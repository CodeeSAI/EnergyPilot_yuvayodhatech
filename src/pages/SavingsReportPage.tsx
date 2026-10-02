import React, { useState } from 'react';
import {
  Leaf,
  Calendar,
  History,
  TrendingUp,
  Zap,
  Gauge,
  CheckCircle2,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { AnimatedCounter } from '../components/common/AnimatedCounter';
import { useSimulator } from '../sim';
import { exportSavingsReportCsv } from '../utils/exportCsv';

export const SavingsReportPage: React.FC = () => {
  const { state, settings } = useSimulator();
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const monthsData = [
    { name: 'May 2024', baseline: 202000, actual: 191000, delta: 11000, savings: 97790, x: 132, y: 250 },
    { name: 'Jun 2024', baseline: 199000, actual: 178000, delta: 21000, savings: 186690, x: 302, y: 220 },
    { name: 'Jul 2024', baseline: 205000, actual: 171000, delta: 34000, savings: 302260, x: 472, y: 175 },
    { name: 'Aug 2024', baseline: 196000, actual: 158000, delta: 38000, savings: 337820, x: 642, y: 130 },
    { name: 'Sep 2024', baseline: 201000, actual: 151000, delta: 50000, savings: 444500, x: 812, y: 80 },
    {
      name: 'Oct 2024 (Active)',
      baseline: 198000,
      actual: state.savings.totalKwhConsumed,
      delta: Math.max(0, 198000 - state.savings.totalKwhConsumed),
      savings: state.savings.totalCostSavedInr,
      x: 982,
      y: 35,
    },
  ];

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      exportSavingsReportCsv(state.savings, monthsData, settings.tariffInrPerKwh);
    }, 400);
  };

  return (
    <div className="flex flex-col gap-6 select-none max-w-[1600px] mx-auto">
      {/* 1. Top Audit Header & Context Banner */}
      <Card variant="glass" className="relative p-6 flex flex-col xl:flex-row xl:items-end justify-between gap-5 overflow-hidden">
        {/* Subtle corner ambient light */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#14B8A6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#2DD4BF] tracking-widest uppercase font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-[#14B8A6] shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
            <span>BEE / ISO 50001 Energy Audit Compliance</span>
            <span className="text-white/30">/</span>
            <span className="text-stone-400">Bureau of Energy Efficiency (BEE)</span>
          </div>

          <h1 className="font-grotesk text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">
            Energy Savings &amp; Decarbonization Audit Report
          </h1>
          <p className="text-xs text-stone-400 font-sans">
            Facility: {settings.plantName} • Billing Period: FY2024 (Verified against MSEDCL HT-1 Industrial Tariff @ ₹{settings.tariffInrPerKwh.toFixed(2)}/kWh)
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center bg-[#1B1B1F] px-3 py-1.5 rounded-lg border border-white/[0.08] gap-2 font-mono text-xs">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-stone-200">Oct 1 – Oct 31, 2024</span>
          </div>

          <div className="flex items-center bg-[#1B1B1F] px-3 py-1.5 rounded-lg border border-white/[0.08] gap-2 font-mono text-xs">
            <History className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-stone-400">Baseline:</span>
            <span className="text-stone-200">Pre-Audit Baseline</span>
          </div>

          <Button
            variant="primary"
            icon={<FileText className="w-4 h-4" />}
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Generating Audit CSV...' : 'Export Audit Report (CSV)'}
          </Button>
        </div>
      </Card>

      {/* 2. Monthly Summary Hero Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Realized Savings */}
        <Card variant="glass" glowTop="teal" className="p-5 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-sans">
              Total Realized Savings
            </span>
            <Badge variant="running">Verified Savings</Badge>
          </div>
          <div className="my-4">
            <div className="font-mono text-3xl xl:text-[34px] font-bold text-white tracking-tight leading-none drop-shadow-[0_0_24px_rgba(20,184,166,0.4)]">
              ₹<AnimatedCounter value={state.savings.totalCostSavedInr} format="currency" />
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[#2DD4BF] font-mono text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5 leading-none" />
              <span>+{state.savings.targetPercentMet}% above baseline quota</span>
            </div>
          </div>
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between font-mono text-xs text-stone-400">
            <span>Contracted Target</span>
            <span className="text-stone-200 font-semibold">
              ₹{(state.savings.monthlyTargetInr || 520000).toLocaleString('en-IN')}
            </span>
          </div>
        </Card>

        {/* Metric 2: Pneumatic & Motor Energy */}
        <Card variant="glass" glowTop="teal" className="p-5 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-sans">
              Pneumatic &amp; Motor Energy
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#14B8A6]/15 border border-[#14B8A6]/30 flex items-center justify-center text-[#2DD4BF]">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="my-4">
            <div className="font-mono text-3xl xl:text-[34px] font-bold text-white tracking-tight leading-none">
              <AnimatedCounter value={state.savings.totalKwhConsumed} format="integer" />{' '}
              <span className="text-lg font-normal text-stone-400">kWh</span>
            </div>
            <div className="mt-2 text-stone-400 font-mono text-xs font-normal">
              Rate: ₹{settings.tariffInrPerKwh.toFixed(2)} / kWh (MSEDCL HT-1 blended tariff)
            </div>
          </div>
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between font-mono text-xs text-stone-400">
            <span>Avoided Peak Demand</span>
            <span className="text-[#2DD4BF] font-semibold drop-shadow-[0_0_8px_rgba(20,184,166,0.3)]">
              {state.savings.baselinePeakKvaAvoided} kVA
            </span>
          </div>
        </Card>

        {/* Metric 3: Carbon Emissions Avoided */}
        <Card variant="glass" glowTop="gradient" className="p-5 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-sans">
              Carbon Emissions Avoided
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#14B8A6]/15 border border-[#14B8A6]/30 flex items-center justify-center text-[#2DD4BF]">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="my-4">
            <div className="font-mono text-3xl xl:text-[34px] font-bold text-white tracking-tight leading-none">
              <AnimatedCounter value={state.savings.co2AvoidedTonnes} format="decimal" />{' '}
              <span className="text-lg font-normal text-stone-400">tCO₂e</span>
            </div>
            <div className="mt-2 text-stone-400 font-mono text-xs truncate">
              Grid Emission Reduction (CEA Factor: {settings.gridEmissionFactorKgPerKwh.toFixed(2)} kg CO₂/kWh)
            </div>
          </div>
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between font-mono text-xs text-stone-400">
            <span>FY24 Cumulative Offsets</span>
            <span className="text-[#2DD4BF] font-semibold drop-shadow-[0_0_8px_rgba(20,184,166,0.3)]">
              238.1 tCO₂e
            </span>
          </div>
        </Card>

        {/* Metric 4: Specific Power (SPC) */}
        <Card variant="glass" glowTop="teal" className="p-5 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-sans">
              Specific Power Consumption (SPC)
            </span>
            <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-stone-200">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="my-4">
            <div className="font-mono text-3xl xl:text-[34px] font-bold text-white tracking-tight leading-none">
              {state.savings.specificPowerKwhNm3}{' '}
              <span className="text-xs font-normal text-stone-400 uppercase tracking-wider">
                kWh/Nm³
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[#2DD4BF] font-mono text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 leading-none" />
              <span>Target Benchmark: 0.110 (ISO 1217)</span>
            </div>
          </div>
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between font-mono text-xs text-stone-400">
            <span>Optimization Gain</span>
            <span className="text-[#2DD4BF] font-semibold">-18.8% energy intensity</span>
          </div>
        </Card>
      </div>

      {/* 3. Middle Section: Baseline vs Actual Telemetry Comparison Chart */}
      <Card variant="glass" className="p-0 overflow-hidden flex flex-col">
        {/* Card Header Strip */}
        <div className="p-5 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#141416]/70 backdrop-blur-md">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[10px] text-stone-400 uppercase tracking-widest font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] shadow-[0_0_6px_rgba(20,184,166,0.8)]" />
              <span>Continuous Telemetry Reconciliation</span>
              <span>•</span>
              <span className="text-[#2DD4BF]">6-Month Trend Trajectory</span>
            </div>
            <h2 className="font-grotesk text-lg md:text-xl font-bold text-white tracking-tight">
              Baseline vs Actual Consumption (Month-over-Month FY2024)
            </h2>
          </div>

          {/* Chart Legend */}
          <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#2A2A32] border border-white/[0.08]" />
              <span className="text-stone-300">Baseline Pre-Audit (kWh)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#14B8A6] shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
              <span className="text-white font-medium">Actual Measured (kWh)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-1 rounded-full bg-[#FF6B5A] shadow-[0_0_8px_rgba(255,107,90,0.7)]" />
              <span className="text-[#FF8070] font-medium">Delta Savings Trajectory (₹)</span>
            </div>
          </div>
        </div>

        {/* Data Visualization Area */}
        <div className="p-5 flex flex-col gap-5">
          <div className="relative w-full h-80">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1100 320">
              <defs>
                <linearGradient id="savingsAreaGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#FF6B5A" stopOpacity="0.25" />
                  <stop offset="70%" stopColor="#FF6B5A" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="#FF6B5A" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="tealBarGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#14B8A6" stopOpacity="1" />
                  <stop offset="100%" stopColor="#0F9A8B" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="activeOctGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#2DD4BF" stopOpacity="1" />
                  <stop offset="100%" stopColor="#14B8A6" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="baseBarGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#2A2A32" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#1B1B1F" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="2 4" strokeWidth="0.8" x1="0" x2="1100" y1="40" y2="40" />
              <line stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="2 4" strokeWidth="0.8" x1="0" x2="1100" y1="100" y2="100" />
              <line stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="2 4" strokeWidth="0.8" x1="0" x2="1100" y1="160" y2="160" />
              <line stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="2 4" strokeWidth="0.8" x1="0" x2="1100" y1="220" y2="220" />

              {/* Left Y Labels */}
              <text className="fill-[#A8A29E] font-mono text-[11px]" x="12" y="36">220k kWh</text>
              <text className="fill-[#A8A29E] font-mono text-[11px]" x="12" y="96">180k kWh</text>
              <text className="fill-[#A8A29E] font-mono text-[11px]" x="12" y="156">140k kWh</text>
              <text className="fill-[#A8A29E] font-mono text-[11px]" x="12" y="216">100k kWh</text>

              {/* Columns for 6 months */}
              {monthsData.map((m, idx) => {
                const baseH = (m.baseline / 240000) * 230;
                const actH = (m.actual / 240000) * 230;
                const baseY = 270 - baseH;
                const actY = 270 - actH;
                const colX = 100 + idx * 170;

                return (
                  <g
                    key={m.name}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredMonth(idx)}
                    onMouseLeave={() => setHoveredMonth(null)}
                  >
                    <rect
                      className="hover:fill-white/[0.04] transition-colors"
                      fill="transparent"
                      height="295"
                      width="120"
                      x={colX - 30}
                      y="10"
                    />
                    {/* Baseline Bar */}
                    <rect fill="url(#baseBarGrad)" height={baseH} rx="2" width="28" x={colX} y={baseY} />
                    {/* Actual Bar */}
                    <rect
                      fill={idx === 5 ? 'url(#activeOctGrad)' : 'url(#tealBarGrad)'}
                      height={actH}
                      rx="2"
                      width="28"
                      x={colX + 32}
                      y={actY}
                    />
                    {/* Labels */}
                    <text
                      className={`font-mono text-[11px] font-medium ${idx === 5 ? 'fill-[#2DD4BF] font-bold' : 'fill-[#F5F5F4]'}`}
                      textAnchor="middle"
                      x={colX + 30}
                      y="295"
                    >
                      {m.name}
                    </text>
                    <text
                      className={`font-mono text-[10px] ${idx === 5 ? 'fill-[#2DD4BF] font-semibold' : 'fill-[#A8A29E]'}`}
                      textAnchor="middle"
                      x={colX + 30}
                      y="310"
                    >
                      Δ -{m.delta.toLocaleString()} kWh
                    </text>
                  </g>
                );
              })}

              {/* Trajectory Area & Line */}
              <path
                d="M 132 250 L 302 220 L 472 175 L 642 130 L 812 80 L 982 35 L 982 270 L 132 270 Z"
                fill="url(#savingsAreaGrad)"
              />
              <path
                d="M 132 250 L 302 220 L 472 175 L 642 130 L 812 80 L 982 35"
                fill="none"
                stroke="#FF6B5A"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Trajectory Points */}
              {[
                { x: 132, y: 250 },
                { x: 302, y: 220 },
                { x: 472, y: 175 },
                { x: 642, y: 130 },
                { x: 812, y: 80 },
                { x: 982, y: 35 },
              ].map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={i === 5 ? 5 : 3.5}
                  fill="#FF6B5A"
                  stroke="#0B0B0D"
                  strokeWidth={2}
                />
              ))}

              {/* Label above peak */}
              <g>
                <rect fill="#1B1B1F" height="22" rx="4" stroke="#FF6B5A" strokeWidth="1" width="148" x="908" y="7" />
                <text className="fill-[#FF8070] font-mono text-[11px] font-bold" textAnchor="middle" x="982" y="22">
                  ₹{state.savings.totalCostSavedInr.toLocaleString('en-IN')} Realized
                </text>
              </g>
            </svg>

            {/* Floating Tooltip on Hovered Month */}
            {hoveredMonth !== null && (
              <div
                style={{
                  left: `${(monthsData[hoveredMonth].x / 1100) * 100}%`,
                  top: '25%',
                }}
                className="absolute -translate-x-1/2 -translate-y-full mb-3 pointer-events-none z-30 bg-[#1B1B1F]/95 border border-[#14B8A6]/60 rounded-xl px-3 py-2 shadow-[0_0_20px_rgba(20,184,166,0.25)] backdrop-blur-md font-mono text-xs flex flex-col gap-0.5"
              >
                <span className="font-grotesk text-xs font-bold text-white">
                  {monthsData[hoveredMonth].name}
                </span>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-stone-400">Actual:</span>
                  <span className="text-[#2DD4BF] font-bold">
                    {monthsData[hoveredMonth].actual.toLocaleString()} kWh
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-stone-400">Savings:</span>
                  <span className="text-[#FF8070] font-bold">
                    ₹{monthsData[hoveredMonth].savings.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Key Insights Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/[0.08]">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="w-7 h-7 rounded-lg bg-[#14B8A6]/15 border border-[#14B8A6]/40 flex items-center justify-center text-[#2DD4BF] shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider font-mono">
                  Operational Insight
                </span>
                <p className="text-xs text-stone-300 font-sans mt-1 leading-relaxed">
                  VFD compressor control and header pressure reduction contributed <strong className="text-[#2DD4BF] font-semibold">58% of total electrical energy savings</strong> across primary pneumatic systems during non-peak hours.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="w-7 h-7 rounded-lg bg-[#14B8A6]/15 border border-[#14B8A6]/40 flex items-center justify-center text-[#2DD4BF] shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider font-mono">
                  Acoustic Leak Survey Findings
                </span>
                <p className="text-xs text-stone-300 font-sans mt-1 leading-relaxed">
                  Remediated 14 minor leaks across Line B manifolds, recovering <strong className="text-[#2DD4BF] font-semibold">38.4 CFM in compressed air volume</strong>, stabilizing main header pressure at 6.82 bar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Bottom Section: Ranked High-Value Energy Recovery Opportunities */}
      <Card variant="glass" className="p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-white/[0.06] pb-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-stone-400 uppercase tracking-widest font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#FF6B5A] shadow-[0_0_8px_rgba(255,107,90,0.8)]" />
              <span>Prioritized Action Matrix</span>
            </div>
            <h3 className="font-grotesk text-lg text-white font-bold tracking-tight mt-0.5">
              Ranked Energy Conservation Measures (ECM) &amp; Payback
            </h3>
          </div>
          <span className="text-xs font-mono text-stone-400">
            MSEDCL HT-1 Tariff: ₹{settings.tariffInrPerKwh.toFixed(2)}/kWh • 6,400 Operating Hours/yr
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#0B0B0D] font-grotesk text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3.5">Measure Description</th>
                <th className="py-3 px-3.5">Asset / Location</th>
                <th className="py-3 px-3.5 text-right">Annual Savings</th>
                <th className="py-3 px-3.5 text-right">Investment Capex</th>
                <th className="py-3 px-3.5 text-right">Payback Period</th>
                <th className="py-3 px-3.5 text-center">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] font-mono text-xs">
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-3.5 font-sans font-medium text-white">
                  VFD Retrofit on Compressor 02
                </td>
                <td className="py-3 px-3.5 text-stone-400">Compressor House B</td>
                <td className="py-3 px-3.5 text-right font-bold text-[#2DD4BF]">₹1,84,000 / yr</td>
                <td className="py-3 px-3.5 text-right text-stone-400">₹64,000</td>
                <td className="py-3 px-3.5 text-right text-stone-200">4.2 Months</td>
                <td className="py-3 px-3.5 text-center">
                  <Badge variant="resolved">BEE VERIFIED</Badge>
                </td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-3.5 font-sans font-medium text-white">
                  Line B Manifold Leak Remediation
                </td>
                <td className="py-3 px-3.5 text-stone-400">Shopfloor Line 2</td>
                <td className="py-3 px-3.5 text-right font-bold text-[#FF8070]">₹51,120 / yr</td>
                <td className="py-3 px-3.5 text-right text-stone-400">₹4,200</td>
                <td className="py-3 px-3.5 text-right text-stone-200">Immediate (&lt;1 Mo)</td>
                <td className="py-3 px-3.5 text-center">
                  <Badge variant="warning">IN PROGRESS</Badge>
                </td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-3.5 font-sans font-medium text-white">
                  Main Ring Header Pressure Reduction (7.4 to 6.8 bar)
                </td>
                <td className="py-3 px-3.5 text-stone-400">Plant-wide Distribution</td>
                <td className="py-3 px-3.5 text-right font-bold text-[#2DD4BF]">₹1,42,800 / yr</td>
                <td className="py-3 px-3.5 text-right text-stone-400">₹0 (Zero Capex)</td>
                <td className="py-3 px-3.5 text-right text-stone-200">Instant</td>
                <td className="py-3 px-3.5 text-center">
                  <Badge variant="resolved">BEE VERIFIED</Badge>
                </td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-3.5 font-sans font-medium text-white">
                  Zero-Air-Loss Condensate Drain Installation
                </td>
                <td className="py-3 px-3.5 text-stone-400">Main Air Receiver</td>
                <td className="py-3 px-3.5 text-right font-bold text-[#2DD4BF]">₹38,400 / yr</td>
                <td className="py-3 px-3.5 text-right text-stone-400">₹6,800</td>
                <td className="py-3 px-3.5 text-right text-stone-200">2.1 Months</td>
                <td className="py-3 px-3.5 text-center">
                  <Badge variant="resolved">BEE VERIFIED</Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
