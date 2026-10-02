export type MachineStatus = 'running' | 'idle' | 'leaks';

export interface TelemetryPoint {
  timestamp: number;     // Unix timestamp (ms)
  timeLabel: string;     // e.g. "14:30"
  powerKw: number;       // Power draw in kW
  baselineKw: number;    // Contracted baseline power cap (e.g. 220 kW)
  pressureBar: number;   // Pneumatic line pressure in bar
  powerFactor: number;   // Power factor (e.g. 0.94)
  flowCfm?: number;      // Airflow rate in CFM
  tempC?: number;        // Winding/discharge temp in °C
  vibrationMmS?: number; // RMS vibration velocity in mm/s
}

export interface MachineTelemetry {
  id: string;
  name: string;
  tag: string;
  subType: string;
  location: string;
  ratingKw: number;
  ratingHp: number;
  firmware: string;
  status: MachineStatus;
  statusLabel: string;
  powerKw: number;
  baselineKw: number;
  pressureBar: number;
  powerFactor: number;
  efficiency: number;    // 0 - 100 %
  flowCfm: number;
  tempC: number;
  vibrationMmS: number;
  acousticDb: number;
  specificPower: number; // kW / 100 CFM or kWh/Nm³
  energyKwh: number;     // Cumulative energy consumption in kWh
  history: TelemetryPoint[];
}

export interface LeakEvent {
  id: string;
  machineId: string;
  machineName: string;
  tag: string;
  component: string;
  location: string;
  cfmLoss: number;
  pressureDropBar: number;
  costPerDayInr: number;
  costPerMonthInr: number;
  detectedAt: number;
  active: boolean;
  isDispatching?: boolean;
  dispatched?: boolean;
}

export interface SavingsMetrics {
  totalKwhConsumed: number;
  totalKwhSaved: number;
  totalCostSavedInr: number;
  co2AvoidedTonnes: number;
  specificPowerKwhNm3: number;
  baselinePeakKvaAvoided: number;
  monthlyTargetInr: number;
  targetPercentMet: number;
}

export interface SimulatorState {
  timestamp: number;
  timeString: string;
  shiftString: string;
  fleetTelemetry: TelemetryPoint;
  history1h: TelemetryPoint[];
  history6h: TelemetryPoint[];
  history24h: TelemetryPoint[];
  history7d: TelemetryPoint[];
  machines: Record<string, MachineTelemetry>;
  leakAlert: LeakEvent | null;
  savings: SavingsMetrics;
  peakDemandToday: number;
  offPeakAvgToday: number;
  baseIdleLoad: number;
}
