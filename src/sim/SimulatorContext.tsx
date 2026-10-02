import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { SimulatorState, LeakEvent, MachineTelemetry } from './types';
import { createInitialState, stepSimulation } from './engine';
import { UPDATE_INTERVAL_MS, TARIFF_INR_PER_KWH, GRID_EMISSION_FACTOR_KG_CO2_PER_KWH, BASELINE_POWER_CAP_KW } from './constants';

export interface AppSettings {
  tariffInrPerKwh: number;
  gridEmissionFactorKgPerKwh: number;
  baselinePowerCapKw: number;
  acousticThresholdDb: number;
  pressureDropThresholdBar: number;
  plantName: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  tariffInrPerKwh: TARIFF_INR_PER_KWH,
  gridEmissionFactorKgPerKwh: GRID_EMISSION_FACTOR_KG_CO2_PER_KWH,
  baselinePowerCapKw: BASELINE_POWER_CAP_KW,
  acousticThresholdDb: 75.0,
  pressureDropThresholdBar: 0.35,
  plantName: 'Plant 1 / Line A',
};

const SETTINGS_STORAGE_KEY = 'energy_pilot_settings';
const LEAK_STATE_STORAGE_KEY = 'energy_pilot_leak_active';

/**
 * Industrial Compressed-Air Leak Cost Calculation (ISO 1217 / MSME Audit Standard):
 * 
 * At standard 7.0 bar (100 psig) header pressure:
 * 1 CFM of continuous compressed-air orifice leak requires ~0.18 - 0.22 kW motor input power.
 * Base electrical compression cost per day:
 *   Power = CFM * 0.20 kW/CFM
 *   Daily kWh = Power * 24 h/day
 *   Cost/day = Daily kWh * Tariff = CFM * 0.20 * 24 * Tariff = CFM * 4.8 * Tariff (Rs 38.4/day per CFM @ Rs 8/kWh)
 *
 * Total industrial system penalty multiplier (~2.6x):
 *   Accounts for artificial demand surge, header pressure degradation recompensation,
 *   and unloaded idle compressor runtime.
 * 
 * Final Daily Monetary Waste = CFM * 100 * (Tariff / 8.0) Rs/day.
 * Final Monthly Waste = Daily Monetary Waste * 30 days = CFM * 3,000 * (Tariff / 8.0) Rs/month.
 * For 14.2 CFM @ Rs 8.00/kWh: 14.2 * 100 = Rs 1,420 / day (Rs 42,600 / month).
 */
export function calculateLeakLossInr(cfmLoss: number, tariff: number = 8.0): { perDay: number; perMonth: number } {
  const perDay = Math.round(cfmLoss * 100 * (tariff / 8.0));
  const perMonth = perDay * 30;
  return { perDay, perMonth };
}

interface SimulatorContextValue {
  state: SimulatorState;
  settings: AppSettings;
  dispatchToast: string | null;
  clearDispatchToast: () => void;
  isRunning: boolean;
  toggleSimulation: () => void;
  dispatchMaintenance: () => void;
  dismissLeakAlert: () => void;
  triggerLeakEvent: (machineId?: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettingsToDefault: () => void;
  getMachine: (id: string) => MachineTelemetry | undefined;
}

const SimulatorContext = createContext<SimulatorContextValue | undefined>(undefined);

export const SimulatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load settings from localStorage or fallback to defaults
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to parse saved settings, using defaults', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Load initial simulator state, checking if leak was previously dismissed/resolved
  const [state, setState] = useState<SimulatorState>(() => {
    const initial = createInitialState();
    try {
      const savedLeakState = localStorage.getItem(LEAK_STATE_STORAGE_KEY);
      if (savedLeakState !== null) {
        const isLeakActive = JSON.parse(savedLeakState);
        if (!isLeakActive && initial.leakAlert) {
          initial.leakAlert.active = false;
          // Restore leaking machine to nominal
          if (initial.machines['MNF-4B']) {
            initial.machines['MNF-4B'].status = 'running';
            initial.machines['MNF-4B'].statusLabel = 'Running Nominal';
            initial.machines['MNF-4B'].acousticDb = 64.0;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to read saved leak state', e);
    }
    return initial;
  });

  const [dispatchToast, setDispatchToast] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  // Auto-dismiss confirmation toast after 6s
  useEffect(() => {
    if (!dispatchToast) return;
    const t = setTimeout(() => setDispatchToast(null), 6000);
    return () => clearTimeout(t);
  }, [dispatchToast]);

  const clearDispatchToast = useCallback(() => {
    setDispatchToast(null);
  }, []);

  // Update settings and persist to localStorage
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save settings to localStorage', e);
      }
      return updated;
    });

    // Recompute state derived metrics (costs, CO2, leak values) based on new settings
    setState((prev) => {
      const tariff = newSettings.tariffInrPerKwh ?? settings.tariffInrPerKwh;
      const emissionFactor = newSettings.gridEmissionFactorKgPerKwh ?? settings.gridEmissionFactorKgPerKwh;

      const newCostSaved = Math.round(prev.savings.totalKwhSaved * tariff);
      const newCo2Avoided = +((prev.savings.totalKwhSaved * emissionFactor) / 1000).toFixed(1);

      let updatedLeak = prev.leakAlert;
      if (prev.leakAlert) {
        const { perDay, perMonth } = calculateLeakLossInr(prev.leakAlert.cfmLoss, tariff);
        updatedLeak = {
          ...prev.leakAlert,
          costPerDayInr: perDay,
          costPerMonthInr: perMonth,
        };
      }

      return {
        ...prev,
        leakAlert: updatedLeak,
        savings: {
          ...prev.savings,
          totalCostSavedInr: newCostSaved,
          co2AvoidedTonnes: newCo2Avoided,
        },
      };
    });
  }, [settings]);

  // Reset settings to defaults
  const resetSettingsToDefault = useCallback(() => {
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to remove settings from localStorage', e);
    }
    setSettings(DEFAULT_SETTINGS);

    setState((prev) => {
      const newCostSaved = Math.round(prev.savings.totalKwhSaved * DEFAULT_SETTINGS.tariffInrPerKwh);
      const newCo2Avoided = +((prev.savings.totalKwhSaved * DEFAULT_SETTINGS.gridEmissionFactorKgPerKwh) / 1000).toFixed(1);

      let updatedLeak = prev.leakAlert;
      if (prev.leakAlert) {
        const { perDay, perMonth } = calculateLeakLossInr(prev.leakAlert.cfmLoss, DEFAULT_SETTINGS.tariffInrPerKwh);
        updatedLeak = {
          ...prev.leakAlert,
          costPerDayInr: perDay,
          costPerMonthInr: perMonth,
        };
      }

      return {
        ...prev,
        leakAlert: updatedLeak,
        savings: {
          ...prev.savings,
          totalCostSavedInr: newCostSaved,
          co2AvoidedTonnes: newCo2Avoided,
        },
      };
    });
  }, []);

  // Stepping simulation loop every 2.5 seconds
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setState((prev) =>
        stepSimulation(
          prev,
          UPDATE_INTERVAL_MS / 1000,
          settings.tariffInrPerKwh,
          settings.gridEmissionFactorKgPerKwh,
          settings.baselinePowerCapKw
        )
      );
    }, UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isRunning, settings.tariffInrPerKwh, settings.gridEmissionFactorKgPerKwh, settings.baselinePowerCapKw]);

  // Maintenance technician dispatch workflow
  const dispatchMaintenance = useCallback(() => {
    setState((prev) => {
      if (!prev.leakAlert) return prev;
      return {
        ...prev,
        leakAlert: {
          ...prev.leakAlert,
          isDispatching: true,
        },
      };
    });

    const timer1 = setTimeout(() => {
      setState((prev) => {
        if (!prev.leakAlert) return prev;
        return {
          ...prev,
          leakAlert: {
            ...prev.leakAlert,
            isDispatching: false,
            dispatched: true,
          },
        };
      });

      // Show confirmation toast
      setDispatchToast('Work order #WO-2024-884 dispatched • Technician assigned to Line 2 • ETA 8 mins');

      // After dispatch confirmation, resolve the air leak and restore machine nominal status
      const timer2 = setTimeout(() => {
        setState((prev) => {
          if (!prev.leakAlert) return prev;
          const leakMachineId = prev.leakAlert.machineId;
          const machine = prev.machines[leakMachineId];

          const updatedMachines = machine
            ? {
                ...prev.machines,
                [leakMachineId]: {
                  ...machine,
                  status: 'running' as const,
                  statusLabel: 'Running Nominal',
                  acousticDb: 64.0,
                  efficiency: 94.0,
                  pressureBar: 6.85,
                },
              }
            : prev.machines;

          try {
            localStorage.setItem(LEAK_STATE_STORAGE_KEY, JSON.stringify(false));
          } catch (e) {
            console.warn('Failed to persist leak state', e);
          }

          return {
            ...prev,
            leakAlert: {
              ...prev.leakAlert,
              active: false,
            },
            machines: updatedMachines,
          };
        });
      }, 1500);

      return () => clearTimeout(timer2);
    }, 1200);

    return () => clearTimeout(timer1);
  }, []);

  const dismissLeakAlert = useCallback(() => {
    setState((prev) => {
      if (!prev.leakAlert) return prev;
      try {
        localStorage.setItem(LEAK_STATE_STORAGE_KEY, JSON.stringify(false));
      } catch (e) {
        console.warn('Failed to persist leak state', e);
      }
      return {
        ...prev,
        leakAlert: {
          ...prev.leakAlert,
          active: false,
        },
      };
    });
  }, []);

  const triggerLeakEvent = useCallback((machineId?: string) => {
    setState((prev) => {
      const targetId = machineId || 'MNF-4B';
      const targetMachine = prev.machines[targetId] || prev.machines['MNF-4B'];
      const cfmLoss = 14.2;
      const { perDay, perMonth } = calculateLeakLossInr(cfmLoss, settings.tariffInrPerKwh);

      const newLeak: LeakEvent = {
        id: `LEAK-${targetId}-${Date.now()}`,
        machineId: targetId,
        machineName: targetMachine.name,
        tag: targetMachine.tag,
        component:
          targetId === 'MNF-4B'
            ? 'Line 2 Quick-Disconnect Coupling'
            : 'Intercooler Flange Gasket',
        location: targetMachine.location,
        cfmLoss,
        pressureDropBar: 0.40,
        costPerDayInr: perDay,
        costPerMonthInr: perMonth,
        detectedAt: Date.now(),
        active: true,
        isDispatching: false,
        dispatched: false,
      };

      const updatedMachines = {
        ...prev.machines,
        [targetId]: {
          ...targetMachine,
          status: 'leaks' as const,
          statusLabel: 'Compressed-Air Leak Detected',
          acousticDb: 86.4,
          efficiency: 63.8,
        },
      };

      try {
        localStorage.setItem(LEAK_STATE_STORAGE_KEY, JSON.stringify(true));
      } catch (e) {
        console.warn('Failed to persist leak state', e);
      }

      return {
        ...prev,
        leakAlert: newLeak,
        machines: updatedMachines,
      };
    });
  }, [settings.tariffInrPerKwh]);

  const toggleSimulation = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const getMachine = useCallback(
    (id: string) => {
      return state.machines[id];
    },
    [state.machines]
  );

  const value = useMemo(
    () => ({
      state,
      settings,
      dispatchToast,
      clearDispatchToast,
      isRunning,
      toggleSimulation,
      dispatchMaintenance,
      dismissLeakAlert,
      triggerLeakEvent,
      updateSettings,
      resetSettingsToDefault,
      getMachine,
    }),
    [
      state,
      settings,
      dispatchToast,
      clearDispatchToast,
      isRunning,
      toggleSimulation,
      dispatchMaintenance,
      dismissLeakAlert,
      triggerLeakEvent,
      updateSettings,
      resetSettingsToDefault,
      getMachine,
    ]
  );

  return <SimulatorContext.Provider value={value}>{children}</SimulatorContext.Provider>;
};

export const useSimulator = (): SimulatorContextValue => {
  const context = useContext(SimulatorContext);
  if (!context) {
    throw new Error('useSimulator must be used within a SimulatorProvider');
  }
  return context;
};
