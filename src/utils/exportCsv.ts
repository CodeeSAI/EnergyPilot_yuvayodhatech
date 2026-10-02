import { TelemetryPoint, MachineTelemetry, SavingsMetrics } from '../sim/types';

/**
 * Utility to trigger actual CSV file downloads in the browser
 */
export function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export live plant telemetry stream to CSV
 */
export function exportTelemetryCsv(
  history: TelemetryPoint[],
  facilityName: string = 'Plant 1',
  shift: string = 'Shift B'
) {
  const headers = ['Timestamp', 'Time_Label', 'Power_kW', 'Baseline_Cap_kW', 'Line_Pressure_bar', 'Power_Factor_PF', 'Airflow_CFM'];
  const rows = history.map((pt) => [
    new Date(pt.timestamp).toISOString(),
    pt.timeLabel,
    pt.powerKw.toFixed(1),
    pt.baselineKw.toFixed(1),
    pt.pressureBar.toFixed(2),
    pt.powerFactor.toFixed(2),
    pt.flowCfm ?? Math.round(pt.powerKw * 5.3),
  ]);

  const csvContent = [
    `# Facility: ${facilityName}`,
    `# Shift: ${shift}`,
    `# Generated: ${new Date().toISOString()}`,
    headers.join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\n');

  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsv(`EnergyPilot_Telemetry_${dateStr}.csv`, csvContent);
}

/**
 * Export comprehensive ISO 50001 / BEE Energy Savings Audit Report to CSV
 */
export function exportSavingsReportCsv(
  savings: SavingsMetrics,
  monthsData: Array<{ name: string; baseline: number; actual: number; delta: number; savings: number }>,
  tariff: number = 8.0
) {
  const summaryLines = [
    '# ENERGY PILOT - ISO 50001 / BEE COMPLIANCE ENERGY AUDIT REPORT',
    `# Generated: ${new Date().toISOString()}`,
    `# Blended HT-1 Industrial Tariff: Rs ${tariff.toFixed(2)}/kWh`,
    `# Total Realized Savings (INR): Rs ${savings.totalCostSavedInr.toLocaleString('en-IN')}`,
    `# Total Electrical Energy Consumed: ${savings.totalKwhConsumed.toLocaleString('en-IN')} kWh`,
    `# Cumulative Carbon Avoided: ${savings.co2AvoidedTonnes.toFixed(1)} tCO2e`,
    `# Specific Power Consumption: ${savings.specificPowerKwhNm3} kWh/Nm3 (Target: 0.110)`,
    '',
    '# MONTH-OVER-MONTH RECONCILIATION',
    'Month,Pre_Audit_Baseline_kWh,Actual_Measured_kWh,Energy_Saved_Delta_kWh,Financial_Savings_INR',
    ...monthsData.map(
      (m) =>
        `"${m.name}",${m.baseline},${m.actual},${m.delta},${m.savings}`
    ),
    '',
    '# RANKED ENERGY CONSERVATION MEASURES (ECM)',
    'Measure_Description,Asset_Location,Annual_Savings_INR,Investment_Capex_INR,Payback_Months,Status',
    '"VFD Retrofit on Compressor 02","Compressor House B",184000,64000,4.2,"BEE VERIFIED"',
    '"Line B Manifold Leak Remediation","Shopfloor Line 2",51120,4200,1.0,"IN PROGRESS"',
    '"Main Ring Header Pressure Reduction (7.4 to 6.8 bar)","Plant-wide",142800,0,0.0,"BEE VERIFIED"',
    '"Zero-Air-Loss Condensate Drain Installation","Main Air Receiver",38400,6800,2.1,"BEE VERIFIED"',
  ];

  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsv(`EnergyPilot_Audit_Report_${dateStr}.csv`, summaryLines.join('\n'));
}

/**
 * Export single machine telemetry historical stream to CSV
 */
export function exportMachineTelemetryCsv(machine: MachineTelemetry) {
  const headers = ['Timestamp', 'Time_Label', 'Power_kW', 'Rating_kW', 'Line_Pressure_bar', 'Power_Factor_PF', 'Airflow_CFM', 'Temp_C', 'Vibration_mm_s'];
  const rows = (machine.history || []).map((pt) => [
    new Date(pt.timestamp).toISOString(),
    pt.timeLabel,
    pt.powerKw.toFixed(1),
    machine.ratingKw,
    pt.pressureBar.toFixed(2),
    pt.powerFactor.toFixed(2),
    pt.flowCfm ?? 0,
    pt.tempC ?? machine.tempC,
    pt.vibrationMmS ?? machine.vibrationMmS,
  ]);

  const csvContent = [
    `# Machine Asset: ${machine.name} (${machine.tag})`,
    `# Sub-Type: ${machine.subType}`,
    `# Location: ${machine.location}`,
    `# Rating: ${machine.ratingKw} kW / ${machine.ratingHp} HP`,
    `# Firmware: ${machine.firmware}`,
    `# Generated: ${new Date().toISOString()}`,
    headers.join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\n');

  downloadCsv(`EnergyPilot_${machine.tag}_Telemetry.csv`, csvContent);
}
