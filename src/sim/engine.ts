import {
  TelemetryPoint,
  MachineTelemetry,
  LeakEvent,
  SavingsMetrics,
  SimulatorState,
} from './types';
import {
  TARIFF_INR_PER_KWH,
  GRID_EMISSION_FACTOR_KG_CO2_PER_KWH,
  BASELINE_POWER_CAP_KW,
  INITIAL_MACHINES_CONFIG,
  ROLLING_WINDOW_POINTS,
} from './constants';

// Helper to format time as HH:mm
export function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatDayTime(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = days[date.getDay()];
  const h = String(date.getHours()).padStart(2, '0');
  return `${day} ${h}:00`;
}

export function getShiftString(hours: number): string {
  if (hours >= 6 && hours < 14) return 'Shift A (Morning)';
  if (hours >= 14 && hours < 22) return 'Shift B (Evening)';
  return 'Shift C (Night)';
}

// Bounded random walk (Ornstein-Uhlenbeck style mean reversion)
function walkValue(current: number, target: number, stepMax: number, min: number, max: number): number {
  const reversion = (target - current) * 0.12;
  const jitter = (Math.random() - 0.5) * 2 * stepMax;
  const next = current + reversion + jitter;
  return Math.min(max, Math.max(min, Number(next.toFixed(2))));
}

// Realistic industrial plant diurnal load model
export function getPlantLoadAtTime(date: Date, isLeak: boolean = false): number {
  const h = date.getHours() + date.getMinutes() / 60;
  let baseKw = 115.0;

  if (h < 6.0) {
    // Night Shift C (22:00 - 06:00): off-peak low ~108 - 128 kW
    baseKw = 114.0 + Math.sin((h / 6.0) * Math.PI) * 10;
  } else if (h < 8.5) {
    // Morning ramp-up (06:00 - 08:30): ramps from ~118 kW up to ~185 kW
    const progress = (h - 6.0) / 2.5;
    baseKw = 118.0 + progress * 66.0;
  } else if (h < 13.0) {
    // Shift A peak production plateau: 180 - 192 kW
    baseKw = 182.0 + Math.sin(((h - 8.5) / 4.5) * Math.PI) * 10;
  } else if (h < 14.0) {
    // Lunch transition dip: ~165 kW
    baseKw = 168.0;
  } else if (h < 18.0) {
    // Shift B afternoon peak production plateau: 184 - 196 kW
    baseKw = 186.0 + Math.sin(((h - 14.0) / 4.0) * Math.PI) * 9;
  } else if (h < 22.0) {
    // Evening Shift B wind-down: ramps from 175 kW down to 125 kW
    const progress = (h - 18.0) / 4.0;
    baseKw = 172.0 - progress * 52.0;
  } else {
    // Late night (22:00 - 24:00): ~115 kW
    baseKw = 116.0;
  }

  // Leak / spike anomaly (+28 to +34 kW)
  if (isLeak) {
    baseKw += 32.0;
  }

  // Small random noise (±2-3%)
  const jitter = (Math.random() - 0.5) * 4.5;
  return Math.max(98.0, Math.min(235.0, Number((baseKw + jitter).toFixed(1))));
}

// Generate realistic 1h history (last 60 mins, 24 points = 2.5 min interval)
export function generateInitial1hHistory(currentKw: number = 184.2): TelemetryPoint[] {
  const points: TelemetryPoint[] = [];
  const now = Date.now();
  const stepMs = 2.5 * 60 * 1000;

  for (let i = 23; i >= 0; i--) {
    const pointTime = new Date(now - i * stepMs);
    // Micro variations ±2-3%
    const microJitter = Math.sin(i * 0.45) * 3.5 + (Math.random() - 0.5) * 2.2;
    const powerKw = Math.max(95.0, Math.min(235.0, Number((currentKw + microJitter).toFixed(1))));
    const pressureBar = +(6.80 + (powerKw / 240) * 0.25 + (Math.random() - 0.5) * 0.05).toFixed(2);
    const powerFactor = +(0.93 + (Math.random() - 0.5) * 0.015).toFixed(2);

    points.push({
      timestamp: pointTime.getTime(),
      timeLabel: formatTime(pointTime),
      powerKw,
      baselineKw: BASELINE_POWER_CAP_KW,
      pressureBar,
      powerFactor,
      flowCfm: Math.round(powerKw * 5.3),
      tempC: +(74 + (powerKw / 220) * 9).toFixed(1),
      vibrationMmS: +(1.2 + (powerKw / 220) * 0.5).toFixed(2),
    });
  }
  return points;
}

// Generate realistic 6h history (last 6 hours, 24 points = 15 min interval)
export function generateInitial6hHistory(isLeaking: boolean = true): TelemetryPoint[] {
  const points: TelemetryPoint[] = [];
  const now = Date.now();
  const stepMs = 15 * 60 * 1000;

  for (let i = 23; i >= 0; i--) {
    const pointTime = new Date(now - i * stepMs);
    // Simulate leak happening in the most recent 1.5 hours
    const pointHasLeak = isLeaking && i <= 6;
    const powerKw = getPlantLoadAtTime(pointTime, pointHasLeak);
    const pressureBar = +(6.75 + (powerKw / 240) * 0.28 + (Math.random() - 0.5) * 0.05).toFixed(2);
    const powerFactor = +(0.92 + (powerKw > 160 ? 0.025 : 0.01) + (Math.random() - 0.5) * 0.01).toFixed(2);

    points.push({
      timestamp: pointTime.getTime(),
      timeLabel: formatTime(pointTime),
      powerKw,
      baselineKw: BASELINE_POWER_CAP_KW,
      pressureBar,
      powerFactor,
      flowCfm: Math.round(powerKw * 5.3),
      tempC: +(73 + (powerKw / 220) * 10).toFixed(1),
      vibrationMmS: +(1.2 + (powerKw / 220) * 0.55).toFixed(2),
    });
  }
  return points;
}

// Generate realistic 24h trailing data (24 points = 1 hour interval)
export function generateInitial24hHistory(isLeaking: boolean = true): TelemetryPoint[] {
  const points: TelemetryPoint[] = [];
  const now = Date.now();
  const oneHour = 3600 * 1000;

  for (let i = ROLLING_WINDOW_POINTS - 1; i >= 0; i--) {
    const pointTime = new Date(now - i * oneHour);
    // Recent leak spike in the last 2 hours
    const pointHasLeak = isLeaking && (i <= 2 || i === 8); // Recent leak + earlier morning spike
    const powerKw = getPlantLoadAtTime(pointTime, pointHasLeak);
    const pressureBar = +(6.68 + (powerKw / 240) * 0.35 + (Math.random() - 0.5) * 0.06).toFixed(2);
    const powerFactor = +(0.91 + (powerKw > 160 ? 0.035 : 0.01) + (Math.random() - 0.5) * 0.01).toFixed(2);

    points.push({
      timestamp: pointTime.getTime(),
      timeLabel: formatTime(pointTime),
      powerKw,
      baselineKw: BASELINE_POWER_CAP_KW,
      pressureBar,
      powerFactor,
      flowCfm: Math.round(powerKw * 5.3),
      tempC: +(72 + (powerKw / 220) * 11).toFixed(1),
      vibrationMmS: +(1.2 + (powerKw / 220) * 0.6).toFixed(2),
    });
  }

  return points;
}

// Generate realistic 7-day history (28 points = 4 points per day, 6-hr interval)
export function generateInitial7dHistory(isLeaking: boolean = true): TelemetryPoint[] {
  const points: TelemetryPoint[] = [];
  const now = Date.now();
  const stepMs = 6 * 3600 * 1000;

  for (let i = 27; i >= 0; i--) {
    const pointTime = new Date(now - i * stepMs);
    const dayOfWeek = pointTime.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const pointHasLeak = isLeaking && i <= 1;

    let powerKw = getPlantLoadAtTime(pointTime, pointHasLeak);
    if (isWeekend) {
      powerKw = Math.max(96.0, Number((powerKw * 0.72).toFixed(1))); // 28% drop on weekend
    }

    const pressureBar = +(6.65 + (powerKw / 240) * 0.35 + (Math.random() - 0.5) * 0.06).toFixed(2);
    const powerFactor = +(0.91 + (powerKw > 160 ? 0.03 : 0.01) + (Math.random() - 0.5) * 0.01).toFixed(2);

    points.push({
      timestamp: pointTime.getTime(),
      timeLabel: formatDayTime(pointTime),
      powerKw,
      baselineKw: BASELINE_POWER_CAP_KW,
      pressureBar,
      powerFactor,
      flowCfm: Math.round(powerKw * 5.3),
      tempC: +(71 + (powerKw / 220) * 11).toFixed(1),
      vibrationMmS: +(1.2 + (powerKw / 220) * 0.6).toFixed(2),
    });
  }
  return points;
}

// Generate initial machines state with individual machine histories
export function generateInitialMachines(history24h: TelemetryPoint[]): Record<string, MachineTelemetry> {
  const result: Record<string, MachineTelemetry> = {};

  // Total rating = 267 kW
  const totalFleetRating = Object.values(INITIAL_MACHINES_CONFIG).reduce((acc, m) => acc + m.ratingKw, 0);

  for (const [id, base] of Object.entries(INITIAL_MACHINES_CONFIG)) {
    const scale = base.ratingKw / totalFleetRating;

    // Generate machine-specific history based on rating & fleet curve
    const machineHistory: TelemetryPoint[] = history24h.map((pt) => {
      const noise = (Math.random() - 0.5) * 1.5;
      const pKw = Math.max(base.ratingKw * 0.2, Number((pt.powerKw * scale + noise).toFixed(1)));
      return {
        timestamp: pt.timestamp,
        timeLabel: pt.timeLabel,
        powerKw: pKw,
        baselineKw: base.ratingKw,
        pressureBar: base.pressureBar + (Math.random() - 0.5) * 0.08,
        powerFactor: base.powerFactor + (Math.random() - 0.5) * 0.01,
        flowCfm: Math.round(pKw * 5.2),
        tempC: +(base.tempC + (Math.random() - 0.5) * 1.2).toFixed(1),
        vibrationMmS: +(base.vibrationMmS + (Math.random() - 0.5) * 0.08).toFixed(2),
      };
    });

    const lastPoint = machineHistory[machineHistory.length - 1];

    result[id] = {
      ...base,
      powerKw: lastPoint.powerKw,
      energyKwh: base.energyKwh,
      history: machineHistory,
    };
  }

  return result;
}

// Initialize simulator state
export function createInitialState(): SimulatorState {
  const now = new Date();
  const hasActiveLeak = true;

  const history24h = generateInitial24hHistory(hasActiveLeak);
  const machines = generateInitialMachines(history24h);

  // Single source of truth: Plant kW = exact sum of machines kW
  const sumMachinesKw = Number(Object.values(machines).reduce((sum, m) => sum + m.powerKw, 0).toFixed(1));
  const sumMachinesKwh = Math.round(Object.values(machines).reduce((sum, m) => sum + m.energyKwh, 0));

  // Ensure last point in each buffer matches the live value
  const latest24 = { ...history24h[history24h.length - 1], powerKw: sumMachinesKw };
  history24h[history24h.length - 1] = latest24;

  const history1h = generateInitial1hHistory(sumMachinesKw);
  history1h[history1h.length - 1] = { ...history1h[history1h.length - 1], powerKw: sumMachinesKw };

  const history6h = generateInitial6hHistory(hasActiveLeak);
  history6h[history6h.length - 1] = { ...history6h[history6h.length - 1], powerKw: sumMachinesKw };

  const history7d = generateInitial7dHistory(hasActiveLeak);
  history7d[history7d.length - 1] = { ...history7d[history7d.length - 1], powerKw: sumMachinesKw };

  const initialLeak: LeakEvent = {
    id: 'LEAK-MNF4B-01',
    machineId: 'MNF-4B',
    machineName: 'CNC Pneumatics Manifold 4B',
    tag: 'MNF-4B',
    component: 'Line 2 Quick-Disconnect Coupling',
    location: 'Shopfloor Line 2',
    cfmLoss: 14.2,
    pressureDropBar: 0.40,
    costPerDayInr: 1420,
    costPerMonthInr: 42600,
    detectedAt: Date.now() - 25 * 60 * 1000,
    active: true,
    isDispatching: false,
    dispatched: false,
  };

  const initialSavings: SavingsMetrics = {
    totalKwhConsumed: sumMachinesKwh, // Single source of truth: sum of machine kWh
    totalKwhSaved: 60293, // (482,350 / 8)
    totalCostSavedInr: 482350,
    co2AvoidedTonnes: 118.4,
    specificPowerKwhNm3: 0.112,
    baselinePeakKvaAvoided: 82.4,
    monthlyTargetInr: 520000,
    targetPercentMet: 92.8,
  };

  // Compute realistic aggregates from history24h
  const peakDemand = Math.max(...history24h.map((p) => p.powerKw));
  const nightPoints = history24h.filter((_, idx) => idx < 6 || idx >= 22);
  const offPeakAvg =
    nightPoints.length > 0
      ? +(nightPoints.reduce((acc, p) => acc + p.powerKw, 0) / nightPoints.length).toFixed(1)
      : 118.4;

  return {
    timestamp: now.getTime(),
    timeString: formatTime(now),
    shiftString: getShiftString(now.getHours()),
    fleetTelemetry: {
      ...latest24,
      powerKw: sumMachinesKw,
      pressureBar: 6.78,
      powerFactor: 0.94,
    },
    history1h,
    history6h,
    history24h,
    history7d,
    machines,
    leakAlert: initialLeak,
    savings: initialSavings,
    peakDemandToday: peakDemand,
    offPeakAvgToday: offPeakAvg,
    baseIdleLoad: 24.8,
  };
}

// Advance simulation by 1 step (called every UPDATE_INTERVAL_MS = 2.5s)
export function stepSimulation(
  prev: SimulatorState,
  elapsedSeconds: number = 2.5,
  tariff: number = TARIFF_INR_PER_KWH,
  emissionFactor: number = GRID_EMISSION_FACTOR_KG_CO2_PER_KWH,
  baselineCapKw: number = BASELINE_POWER_CAP_KW
): SimulatorState {
  const now = new Date();
  const hours = now.getHours();
  const leakActive = Boolean(prev.leakAlert && prev.leakAlert.active);

  // 1. Calculate live plant fleet power from diurnal model
  const targetFleetKw = getPlantLoadAtTime(now, leakActive);
  const liveFleetKw = walkValue(prev.fleetTelemetry.powerKw, targetFleetKw, 0.8, 95.0, 235.0);

  // 2. Proportionally distribute across machines and accumulate per-machine kWh
  const totalFleetRating = Object.values(prev.machines).reduce((acc, m) => acc + m.ratingKw, 0);
  const updatedMachines: Record<string, MachineTelemetry> = {};
  const dtHours = elapsedSeconds / 3600;

  for (const [id, m] of Object.entries(prev.machines)) {
    const scale = m.ratingKw / totalFleetRating;
    const isLeakingMachine = leakActive && prev.leakAlert?.machineId === id;
    const machineTargetKw = liveFleetKw * scale + (isLeakingMachine ? 6.5 : 0);
    const nextKw = walkValue(m.powerKw, machineTargetKw, 0.4, m.ratingKw * 0.15, m.ratingKw * 1.05);

    const targetBar = isLeakingMachine ? 6.38 : m.status === 'idle' ? 6.20 : 6.85;
    const nextBar = walkValue(m.pressureBar, targetBar, 0.02, 5.2, 7.6);
    const nextPf = walkValue(m.powerFactor, m.status === 'idle' ? 0.81 : 0.94, 0.005, 0.78, 0.98);
    const nextTemp = walkValue(m.tempC, 74.0 + (nextKw / m.ratingKw) * 12, 0.15, 48, 92);
    const nextVib = walkValue(m.vibrationMmS, isLeakingMachine ? 2.5 : 1.3, 0.04, 0.6, 4.5);
    const nextCfm = Math.round(nextKw * (isLeakingMachine ? 4.7 : 5.3));
    const nextEfficiency = +(Math.min(99.0, Math.max(50.0, m.efficiency + (Math.random() - 0.5) * 0.15))).toFixed(1);

    // Accumulate individual machine kWh
    const machineDeltaKwh = nextKw * dtHours;
    const nextEnergyKwh = (m.energyKwh || 0) + machineDeltaKwh;

    const newHistoryPoint: TelemetryPoint = {
      timestamp: now.getTime(),
      timeLabel: formatTime(now),
      powerKw: nextKw,
      baselineKw: m.baselineKw,
      pressureBar: nextBar,
      powerFactor: nextPf,
      flowCfm: nextCfm,
      tempC: nextTemp,
      vibrationMmS: nextVib,
    };

    const nextHistory = [...m.history.slice(1), newHistoryPoint];

    updatedMachines[id] = {
      ...m,
      powerKw: nextKw,
      energyKwh: nextEnergyKwh,
      pressureBar: nextBar,
      powerFactor: nextPf,
      tempC: nextTemp,
      vibrationMmS: nextVib,
      flowCfm: nextCfm,
      efficiency: nextEfficiency,
      specificPower: +(nextKw / (nextCfm / 100)).toFixed(2),
      history: nextHistory,
    };
  }

  // 3. Single source of truth: Fleet live kW = exact sum of machine live kW
  const sumMachinesKw = Number(Object.values(updatedMachines).reduce((sum, m) => sum + m.powerKw, 0).toFixed(1));
  const sumMachinesKwh = Math.round(Object.values(updatedMachines).reduce((sum, m) => sum + m.energyKwh, 0));

  const fleetPressure = walkValue(prev.fleetTelemetry.pressureBar, leakActive ? 6.78 : 6.88, 0.015, 6.2, 7.3);
  const fleetPf = walkValue(prev.fleetTelemetry.powerFactor, 0.94, 0.003, 0.88, 0.98);

  const newFleetPoint: TelemetryPoint = {
    timestamp: now.getTime(),
    timeLabel: formatTime(now),
    powerKw: sumMachinesKw,
    baselineKw: baselineCapKw,
    pressureBar: fleetPressure,
    powerFactor: fleetPf,
    flowCfm: Math.round(sumMachinesKw * 5.3),
    tempC: +(75 + (sumMachinesKw / 220) * 8).toFixed(1),
  };

  // 4. Update rolling history buffers (ensuring last point matches live point)
  const nextHistory1h = [...prev.history1h.slice(1), newFleetPoint];
  const nextHistory6h = [...prev.history6h.slice(1), newFleetPoint];
  const nextHistory24h = [...prev.history24h.slice(1), newFleetPoint];
  const nextHistory7d = [
    ...prev.history7d.slice(0, prev.history7d.length - 1),
    { ...newFleetPoint, timeLabel: formatDayTime(now) },
  ];

  // 5. Derived Energy, Monetary & Carbon Savings Formulas:
  const baselineKw = baselineCapKw * 0.95; // Contracted baseline load ceiling
  const deltaKwhSaved = Math.max(0, (baselineKw - sumMachinesKw) * dtHours);

  const newTotalKwhSaved = prev.savings.totalKwhSaved + deltaKwhSaved;
  const newTotalCostSavedInr = Math.round(newTotalKwhSaved * tariff);
  const newCo2AvoidedTonnes = +(
    (newTotalKwhSaved * emissionFactor) /
    1000
  ).toFixed(1);
  const newSpc = +(0.112 + (sumMachinesKw > 195 ? 0.002 : -0.001)).toFixed(3);

  // Peak demand & night averages
  const newPeakDemand = Math.max(prev.peakDemandToday, sumMachinesKw);

  return {
    ...prev,
    timestamp: now.getTime(),
    timeString: formatTime(now),
    shiftString: getShiftString(hours),
    fleetTelemetry: newFleetPoint,
    history1h: nextHistory1h,
    history6h: nextHistory6h,
    history24h: nextHistory24h,
    history7d: nextHistory7d,
    machines: updatedMachines,
    peakDemandToday: Number(newPeakDemand.toFixed(1)),
    savings: {
      ...prev.savings,
      totalKwhConsumed: sumMachinesKwh,
      totalKwhSaved: Math.round(newTotalKwhSaved),
      totalCostSavedInr: newTotalCostSavedInr,
      co2AvoidedTonnes: newCo2AvoidedTonnes,
      specificPowerKwhNm3: newSpc,
      targetPercentMet: +((newTotalCostSavedInr / prev.savings.monthlyTargetInr) * 100).toFixed(1),
    },
  };
}
