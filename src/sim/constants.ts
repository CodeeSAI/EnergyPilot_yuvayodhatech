import { MachineTelemetry } from './types';

/**
 * Industrial Energy Engineering Assumptions & Conversion Constants:
 *
 * 1. Tariff:
 *    MSEDCL HT-1 Industrial Tariff (Maharashtra/Pune industrial cluster):
 *    Average blended rate = ₹8.00 per kWh.
 *
 * 2. Emission Factor:
 *    Central Electricity Authority (CEA) of India CO2 Baseline Database (v19):
 *    Grid weighted average emission factor = 0.82 kg CO2 / kWh (0.00082 tCO2e / kWh).
 *    Reflects reduced grid electricity consumption through energy efficiency.
 *
 * 3. Specific Power Consumption (SPC):
 *    ISO 1217 Annex C benchmark for rotary screw compressors:
 *    Target = 0.110 - 0.114 kWh/Nm³ (~6.6 - 6.8 kW per 100 CFM at 7.0 bar).
 *
 * 4. Compressed-Air Leak Rule of Thumb:
 *    At 7.0 bar header pressure, 1 CFM of compressed air leak running continuously 24/7 costs approx:
 *    1 CFM ≈ 0.18 - 0.22 kW compressor input ≈ 4.8 kWh/day ≈ ₹38.4 - ₹100/day.
 *    For a 14.2 CFM orifice leak, estimated loss is ~₹1,420 / day (₹42,600 / month).
 */

export const TARIFF_INR_PER_KWH = 8.0;
export const GRID_EMISSION_FACTOR_KG_CO2_PER_KWH = 0.82;
export const BASELINE_POWER_CAP_KW = 220.0;
export const UPDATE_INTERVAL_MS = 2500; // 2.5 seconds per telemetry packet
export const ROLLING_WINDOW_POINTS = 24; // 24 hourly trailing points + live head

export const INITIAL_MACHINES_CONFIG: Record<string, Omit<MachineTelemetry, 'history'>> = {
  'CMP-01': {
    id: 'CMP-01',
    name: 'Atlas Copco GA-75 VSD',
    tag: 'CMP-01',
    subType: 'Rotary Screw VSD',
    location: 'Compressor House A',
    ratingKw: 75,
    ratingHp: 100,
    firmware: 'v4.18.2-rt',
    status: 'running',
    statusLabel: 'Running Nominal',
    powerKw: 68.4,
    baselineKw: 75.0,
    pressureBar: 6.84,
    powerFactor: 0.94,
    efficiency: 94.2,
    flowCfm: 382.5,
    tempC: 78.4,
    vibrationMmS: 1.42,
    acousticDb: 64.2,
    specificPower: 17.88, // kW / 100 CFM
    energyKwh: 40135,
  },
  'BLW-03': {
    id: 'BLW-03',
    name: 'Roots Positive Displacement Blower',
    tag: 'BLW-03',
    subType: 'Roots PD Blower',
    location: 'Pneumatics Line B',
    ratingKw: 22,
    ratingHp: 30,
    firmware: 'v2.09.1-std',
    status: 'idle',
    statusLabel: 'Idle (Standby 14 kW)',
    powerKw: 14.1,
    baselineKw: 22.0,
    pressureBar: 2.10,
    powerFactor: 0.81,
    efficiency: 81.0,
    flowCfm: 120.0,
    tempC: 61.2,
    vibrationMmS: 0.95,
    acousticDb: 58.0,
    specificPower: 11.75,
    energyKwh: 11772,
  },
  'MNF-4B': {
    id: 'MNF-4B',
    name: 'CNC Pneumatics Manifold 4B',
    tag: 'MNF-4B',
    subType: 'Pneumatic Manifold',
    location: 'Shopfloor Line 2',
    ratingKw: 25,
    ratingHp: 35,
    firmware: 'v3.12.0-flx',
    status: 'leaks',
    statusLabel: 'Compressed-Air Leak Detected',
    powerKw: 18.6,
    baselineKw: 25.0,
    pressureBar: 6.42,
    powerFactor: 0.88,
    efficiency: 64.5,
    flowCfm: 104.2,
    tempC: 69.8,
    vibrationMmS: 2.65,
    acousticDb: 84.6, // Ultrasonic leak detector spike
    specificPower: 22.40,
    energyKwh: 13378,
  },
  'CMP-02': {
    id: 'CMP-02',
    name: 'Main Line Screw Compressor 02',
    tag: 'CMP-02',
    subType: 'Fixed-Speed Screw',
    location: 'Compressor House B',
    ratingKw: 90,
    ratingHp: 120,
    firmware: 'v5.01.4-kae',
    status: 'running',
    statusLabel: 'Running Nominal',
    powerKw: 74.0,
    baselineKw: 90.0,
    pressureBar: 6.95,
    powerFactor: 0.95,
    efficiency: 92.8,
    flowCfm: 440.0,
    tempC: 82.1,
    vibrationMmS: 1.58,
    acousticDb: 67.5,
    specificPower: 16.81,
    energyKwh: 48162,
  },
  'MOT-09': {
    id: 'MOT-09',
    name: 'Induction Motor 55kW Line 2',
    tag: 'MOT-09',
    subType: 'IE4 High-Eff Motor',
    location: 'Motor Control Center 2',
    ratingKw: 55,
    ratingHp: 75,
    firmware: 'v1.44.0-sim',
    status: 'running',
    statusLabel: 'Running Nominal',
    powerKw: 42.1,
    baselineKw: 55.0,
    pressureBar: 6.80,
    powerFactor: 0.96,
    efficiency: 95.4,
    flowCfm: 260.0,
    tempC: 66.5,
    vibrationMmS: 0.88,
    acousticDb: 59.2,
    specificPower: 16.19,
    energyKwh: 29433,
  },
};
