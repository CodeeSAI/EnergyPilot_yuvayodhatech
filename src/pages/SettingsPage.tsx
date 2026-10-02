import React, { useState } from 'react';
import {
  Gauge,
  Save,
  RotateCcw,
  CheckCircle2,
  Zap,
  Leaf,
  ShieldAlert,
  Building,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useSimulator, DEFAULT_SETTINGS } from '../sim';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetSettingsToDefault } = useSimulator();

  const [formState, setFormState] = useState({
    tariffInrPerKwh: settings.tariffInrPerKwh,
    gridEmissionFactorKgPerKwh: settings.gridEmissionFactorKgPerKwh,
    baselinePowerCapKw: settings.baselinePowerCapKw,
    acousticThresholdDb: settings.acousticThresholdDb,
    pressureDropThresholdBar: settings.pressureDropThresholdBar,
    plantName: settings.plantName,
  });

  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      tariffInrPerKwh: Math.max(1, Number(formState.tariffInrPerKwh) || 8.0),
      gridEmissionFactorKgPerKwh: Math.max(0.1, Number(formState.gridEmissionFactorKgPerKwh) || 0.82),
      baselinePowerCapKw: Math.max(50, Number(formState.baselinePowerCapKw) || 220),
      acousticThresholdDb: Math.max(40, Number(formState.acousticThresholdDb) || 75),
      pressureDropThresholdBar: Math.max(0.1, Number(formState.pressureDropThresholdBar) || 0.35),
      plantName: formState.plantName.trim() || 'Plant 1 / Line A',
    });

    setSaveStatus('Settings successfully saved and applied to live telemetry!');
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleReset = () => {
    resetSettingsToDefault();
    setFormState({
      tariffInrPerKwh: DEFAULT_SETTINGS.tariffInrPerKwh,
      gridEmissionFactorKgPerKwh: DEFAULT_SETTINGS.gridEmissionFactorKgPerKwh,
      baselinePowerCapKw: DEFAULT_SETTINGS.baselinePowerCapKw,
      acousticThresholdDb: DEFAULT_SETTINGS.acousticThresholdDb,
      pressureDropThresholdBar: DEFAULT_SETTINGS.pressureDropThresholdBar,
      plantName: DEFAULT_SETTINGS.plantName,
    });
    setSaveStatus('Settings reset to factory defaults.');
    setTimeout(() => setSaveStatus(null), 4000);
  };

  return (
    <div className="flex flex-col gap-6 select-none max-w-[1200px] mx-auto w-full">
      {/* 1. Header Banner */}
      <Card variant="glass" className="relative p-6 flex flex-col md:flex-row md:items-end justify-between gap-5 overflow-hidden">
        <div className="relative z-10 flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#2DD4BF] tracking-widest uppercase font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-[#14B8A6] shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
            <span>Industrial Configuration</span>
            <span className="text-white/30">•</span>
            <span className="text-stone-400">Telemetry &amp; Economics Engine</span>
          </div>

          <h1 className="font-grotesk text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">
            System &amp; Engineering Settings
          </h1>
          <p className="text-xs text-stone-400 font-sans">
            Adjust plant baseline capacities, blended power tariffs, CEA decarbonization factors, and acoustic sensor alert thresholds.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw className="w-3.5 h-3.5 text-stone-300" />}
            onClick={handleReset}
          >
            Reset to Defaults
          </Button>
        </div>
      </Card>

      {/* Save Confirmation Notification Toast */}
      {saveStatus && (
        <div className="p-3.5 rounded-xl bg-[#14B8A6]/15 border border-[#14B8A6]/40 flex items-center gap-2.5 text-[#2DD4BF] font-mono text-xs font-semibold animate-fade-lift">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* 2. Main Settings Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Section A: Tariff & Financial Assumptions */}
        <Card variant="glass" className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
            <Zap className="w-4 h-4 text-[#2DD4BF]" />
            <h2 className="font-grotesk text-base font-bold text-white uppercase tracking-wider">
              Electrical Tariff &amp; Financial Cost Model
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-sans">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-300">
                Blended Industrial Electricity Tariff (₹ / kWh)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-stone-400">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="50"
                  value={formState.tariffInrPerKwh}
                  onChange={(e) =>
                    setFormState({ ...formState, tariffInrPerKwh: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-[#1B1B1F] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#14B8A6]"
                  required
                />
              </div>
              <span className="text-[11px] text-stone-400">
                MSEDCL HT-1 Industrial Tariff blended base rate (contracted demand + TOD slot average). Used to calculate realized monetary savings and leak losses.
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#1B1B1F] border border-white/[0.06] flex flex-col justify-between font-mono text-xs">
              <span className="text-[10px] text-stone-400 uppercase font-semibold">Active Calculation Impact</span>
              <div className="mt-2 text-stone-300 text-[11px] space-y-1">
                <div>• Current Rate: <strong className="text-[#2DD4BF]">₹{formState.tariffInrPerKwh.toFixed(2)} / kWh</strong></div>
                <div>• 14.2 CFM Air Leak Loss: <strong className="text-[#FF8070]">₹{Math.round(14.2 * 100 * (formState.tariffInrPerKwh / 8.0)).toLocaleString()} / day</strong></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section B: Decarbonization & Grid Factor */}
        <Card variant="glass" className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
            <Leaf className="w-4 h-4 text-[#2DD4BF]" />
            <h2 className="font-grotesk text-base font-bold text-white uppercase tracking-wider">
              Decarbonization &amp; CEA Grid Emission Factor
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-sans">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-300">
                Grid Weighted Emission Factor (kg CO₂ / kWh)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="2.0"
                value={formState.gridEmissionFactorKgPerKwh}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    gridEmissionFactorKgPerKwh: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-[#1B1B1F] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#14B8A6]"
                required
              />
              <span className="text-[11px] text-stone-400">
                Central Electricity Authority (CEA) of India Baseline Database v19 regional grid average. Used for ISO 50001 &amp; ESG Scope 2 carbon accounting.
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#1B1B1F] border border-white/[0.06] flex flex-col justify-between font-mono text-xs">
              <span className="text-[10px] text-stone-400 uppercase font-semibold">Scope 2 Offset Factor</span>
              <div className="mt-2 text-stone-300 text-[11px]">
                Every 1,000 kWh of compressed-air energy saved prevents <strong className="text-[#2DD4BF]">{(formState.gridEmissionFactorKgPerKwh).toFixed(2)} tCO₂e</strong> from being emitted to the regional grid.
              </div>
            </div>
          </div>
        </Card>

        {/* Section C: Contracted Baseline & Demand Limit */}
        <Card variant="glass" className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
            <Gauge className="w-4 h-4 text-[#2DD4BF]" />
            <h2 className="font-grotesk text-base font-bold text-white uppercase tracking-wider">
              Contracted Power Limit &amp; Baseline Ceiling
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-sans">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-300">
                Contracted Baseline Power Cap (kW)
              </label>
              <input
                type="number"
                step="5"
                min="50"
                max="1000"
                value={formState.baselinePowerCapKw}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    baselinePowerCapKw: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-[#1B1B1F] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#14B8A6]"
                required
              />
              <span className="text-[11px] text-stone-400">
                Sets the red-dashed threshold line on telemetry waveform charts and determines peak load quota breach triggers.
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#1B1B1F] border border-white/[0.06] flex flex-col justify-between font-mono text-xs">
              <span className="text-[10px] text-stone-400 uppercase font-semibold">Chart Baseline Threshold</span>
              <div className="mt-2 text-stone-300 text-[11px]">
                The live chart will mark <strong className="text-[#FF8070]">LIMIT {formState.baselinePowerCapKw} kW</strong> as the contracted demand cap.
              </div>
            </div>
          </div>
        </Card>

        {/* Section D: Sensor Alert Thresholds & Facility Identity */}
        <Card variant="glass" className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
            <ShieldAlert className="w-4 h-4 text-[#FF6B5A]" />
            <h2 className="font-grotesk text-base font-bold text-white uppercase tracking-wider">
              Acoustic Sensor Thresholds &amp; Facility Identity
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-sans">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-300">
                Ultrasonic Acoustic Leak Trigger (dB)
              </label>
              <input
                type="number"
                step="1"
                min="40"
                max="120"
                value={formState.acousticThresholdDb}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    acousticThresholdDb: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-[#1B1B1F] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#14B8A6]"
                required
              />
              <span className="text-[11px] text-stone-400">
                Acoustic sensor US-04 triggers alert when noise exceeds this level (default 75 dB).
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-300">
                Pressure Drop Threshold (bar)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="2.0"
                value={formState.pressureDropThresholdBar}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    pressureDropThresholdBar: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-[#1B1B1F] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#14B8A6]"
                required
              />
              <span className="text-[11px] text-stone-400">
                Line pressure drop triggering automated maintenance alert (default 0.35 bar).
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-300">
                Facility / Plant Label
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={formState.plantName}
                  onChange={(e) => setFormState({ ...formState, plantName: e.target.value })}
                  className="w-full bg-[#1B1B1F] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-xs font-sans text-white focus:outline-none focus:border-[#14B8A6]"
                  required
                />
              </div>
              <span className="text-[11px] text-stone-400">
                Displayed in topbar breadcrumb and audit export documents.
              </span>
            </div>
          </div>
        </Card>

        {/* 3. Action Toolbar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
          >
            Reset to Defaults
          </Button>

          <Button
            type="submit"
            variant="primary"
            icon={<Save className="w-4 h-4 text-[#0B0B0D]" />}
          >
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};
