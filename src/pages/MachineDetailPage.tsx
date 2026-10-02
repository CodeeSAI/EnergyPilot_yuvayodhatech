import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Download,
  Activity,
  CheckCircle2,
  Wrench,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { useSimulator } from '../sim';
import { exportMachineTelemetryCsv } from '../utils/exportCsv';

export const MachineDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, settings, dispatchMaintenance, triggerLeakEvent } = useSimulator();

  const machine = id ? state.machines[id] : null;

  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [logFilter, setLogFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'RESOLVED' | 'INFO'>('ALL');
  const [isAcked, setIsAcked] = useState<boolean>(false);

  if (!machine) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-[#141416] border border-white/[0.08] rounded-xl max-w-lg mx-auto my-12">
        <div className="w-16 h-16 rounded-full bg-[#FF6B5A]/15 border border-[#FF6B5A]/40 flex items-center justify-center text-[#FF8070] mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2 font-grotesk uppercase tracking-wide">
          Machine Not Found
        </h2>
        <p className="text-stone-400 text-sm mb-6 font-sans">
          The requested equipment identifier <span className="font-mono text-[#FF8070] font-semibold">{id || 'UNKNOWN'}</span> does not exist in the plant telemetry registry.
        </p>
        <Button variant="primary" onClick={() => navigate('/machines')}>
          Back to Fleet Machines
        </Button>
      </div>
    );
  }

  const machineId = machine.id;
  const isLeak = machine.status === 'leaks';
  const history = machine.history || [];
  const numPoints = history.length;

  // Chart coordinates mapping
  // Left Axis (kW): 0 to ratingKw * 1.15 -> SVG Y: 220 to 30
  // Right Axis (bar): 4 to 8.5 bar -> SVG Y: 220 to 30
  const maxKw = Math.max(80, machine.ratingKw * 1.15);
  const getYPower = (kw: number) => 220 - ((Math.min(maxKw, Math.max(0, kw))) / maxKw) * 190;
  const getYPres = (bar: number) => 220 - ((Math.min(8.5, Math.max(4.0, bar)) - 4.0) / 4.5) * 190;

  const svgCoords = useMemo(() => {
    if (numPoints === 0) return { powerPoints: [], presPoints: [] };
    const powerPoints = history.map((pt, i) => ({
      x: (i / (numPoints - 1)) * 800,
      y: getYPower(pt.powerKw),
    }));
    const presPoints = history.map((pt, i) => ({
      x: (i / (numPoints - 1)) * 800,
      y: getYPres(pt.pressureBar),
    }));
    return { powerPoints, presPoints };
  }, [history, numPoints, maxKw]);

  // Construct smooth bezier curves
  const { powerPath, powerAreaPath, presPath } = useMemo(() => {
    if (svgCoords.powerPoints.length === 0) {
      return { powerPath: 'M 0,120 L 800,120', powerAreaPath: 'M 0,240 L 800,240 Z', presPath: 'M 0,80 L 800,80' };
    }

    let pPower = `M ${svgCoords.powerPoints[0].x.toFixed(1)},${svgCoords.powerPoints[0].y.toFixed(1)}`;
    let pPres = `M ${svgCoords.presPoints[0].x.toFixed(1)},${svgCoords.presPoints[0].y.toFixed(1)}`;

    for (let i = 0; i < svgCoords.powerPoints.length - 1; i++) {
      const p1 = svgCoords.powerPoints[i];
      const p2 = svgCoords.powerPoints[i + 1];
      const pr1 = svgCoords.presPoints[i];
      const pr2 = svgCoords.presPoints[i + 1];

      const cpx = (p1.x + p2.x) / 2;
      pPower += ` Q ${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${cpx.toFixed(1)},${((p1.y + p2.y) / 2).toFixed(1)}`;
      pPres += ` Q ${pr1.x.toFixed(1)},${pr1.y.toFixed(1)} ${cpx.toFixed(1)},${((pr1.y + pr2.y) / 2).toFixed(1)}`;
    }
    const lastP = svgCoords.powerPoints[svgCoords.powerPoints.length - 1];
    const lastPr = svgCoords.presPoints[svgCoords.presPoints.length - 1];
    pPower += ` T ${lastP.x.toFixed(1)},${lastP.y.toFixed(1)}`;
    pPres += ` T ${lastPr.x.toFixed(1)},${lastPr.y.toFixed(1)}`;

    const area = `${pPower} L 800,240 L 0,240 Z`;
    return { powerPath: pPower, powerAreaPath: area, presPath: pPres };
  }, [svgCoords]);

  // Tooltip Hover Index & Boundary Clamping
  const isHovering = hoverPosition !== null;
  const currentRatio = isHovering ? hoverPosition : 1.0;
  const activeIdx = Math.min(numPoints - 1, Math.max(0, Math.round(currentRatio * (numPoints - 1))));
  const activePoint = history[activeIdx] || {
    timeLabel: state.timeString,
    powerKw: machine.powerKw,
    pressureBar: machine.pressureBar,
  };

  const clampedRatio = Math.max(0.12, Math.min(0.88, currentRatio));
  const tooltipTransform =
    clampedRatio > 0.72
      ? 'translate(-88%, 0)'
      : clampedRatio < 0.28
      ? 'translate(-12%, 0)'
      : 'translate(-50%, 0)';

  const loadingFactor = ((machine.powerKw / machine.ratingKw) * 100).toFixed(1);

  const events = useMemo(() => {
    const list = [];
    if (isLeak) {
      list.push({
        id: 'ev-leak',
        time: '14:24 IST',
        source: 'ACOUSTIC_US_04',
        desc: 'Turbulent compressed-air leak acoustic signature detected at manifold quick-connect coupling',
        status: 'CRITICAL' as const,
        statusBadge: 'ACTIVE LEAK',
        metric: '-0.40 bar',
        isCritical: true,
      });
    }
    list.push(
      {
        id: 'ev-flow',
        time: '12:00 IST',
        source: 'FLOW_MTR_01',
        desc: `Mid-shift flow meter calibration check nominal • ${machine.flowCfm} CFM steady state verified`,
        status: 'RESOLVED' as const,
        statusBadge: 'VERIFIED',
        metric: `${machine.flowCfm} CFM`,
        isCritical: false,
      },
      {
        id: 'ev-vfd',
        time: '08:00 IST',
        source: 'VFD_DRIVE_02',
        desc: 'Shift B morning load ramp completed nominal. Frequency modulated to 44.8 Hz.',
        status: 'WARNING' as const,
        statusBadge: 'NOMINAL',
        metric: '44.8 Hz',
        isCritical: false,
      },
      {
        id: 'ev-drain',
        time: '06:00 IST',
        source: 'CONDENSATE_DRAIN_TRAP',
        desc: 'Scheduled auto-purge condensate drain cycle executed nominal across ring header',
        status: 'RESOLVED' as const,
        statusBadge: 'RESOLVED',
        metric: '100% OK',
        isCritical: false,
      }
    );

    if (logFilter === 'ALL') return list;
    return list.filter((e) => e.status === logFilter);
  }, [isLeak, logFilter, machine.flowCfm]);

  return (
    <div className="flex flex-col gap-6 select-none max-w-[1600px] mx-auto">
      {/* 1. Top Breadcrumb & Return Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/')}
            className="text-stone-400 hover:text-white"
          >
            Back to Overview
          </Button>
          <span className="text-white/20">•</span>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-stone-400">Machines</span>
            <span className="text-white/20">/</span>
            <span className="text-[#2DD4BF] font-bold">{machine.tag}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-stone-400">
          <span>Telemetry Node ID: EP-SN-{machine.id}-401</span>
        </div>
      </div>

      {/* 2. Machine Switcher Bar (Teal-tinted fill, teal border and bright teal/white text for selected tab) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-lg bg-[#141416] border border-white/[0.08]">
        <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider px-2 font-semibold">
          Select Machine Asset:
        </span>
        {Object.values(state.machines).map((m) => {
          const selected = m.id === machineId;
          const hasIssue = m.status === 'leaks';
          return (
            <button
              key={m.id}
              onClick={() => navigate(`/machines/${m.id}`)}
              className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                selected
                  ? 'bg-[#14B8A6]/20 border border-[#14B8A6] text-[#2DD4BF] font-bold shadow-[0_0_14px_rgba(20,184,166,0.3)]'
                  : 'text-stone-400 hover:bg-white/[0.04] hover:text-white border border-transparent'
              }`}
            >
              <span>{m.tag}</span>
              {hasIssue && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    selected ? 'bg-[#FF6B5A]' : 'bg-[#FF6B5A] animate-pulse'
                  }`}
                  title="Active Issue"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Machine Header Hero Panel */}
      <Card variant="glass" className="relative p-6 flex flex-col gap-4 overflow-hidden bg-[#141416] border border-white/[0.08] rounded-xl">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 relative z-10">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-[#1B1B1F] border border-white/[0.08] font-mono text-[10px] text-stone-300 font-semibold tracking-wider">
                {machine.tag} // SEC-03
              </span>
              <span className="font-mono text-[11px] text-stone-400 uppercase tracking-wider font-medium">
                {machine.subType}
              </span>
              <Badge
                variant={machine.status === 'running' ? 'running' : machine.status === 'idle' ? 'idle' : 'critical'}
                pulse={machine.status === 'running'}
                ping={isLeak}
              >
                {machine.statusLabel}
              </Badge>
            </div>

            <h1 className="font-grotesk text-2xl lg:text-3xl text-white tracking-tight font-semibold truncate pt-1">
              {machine.name}{' '}
              <span className="text-stone-400 font-normal text-xl lg:text-2xl">
                ({machine.ratingKw} kW / {machine.ratingHp} HP)
              </span>
            </h1>

            {/* Industrial Metadata Badges */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 pt-1 text-stone-400 font-mono text-xs">
              <div>
                <span className="text-stone-500">Location: </span>
                <span className="text-white font-semibold">{machine.location}</span>
              </div>
              <span className="text-white/20">•</span>
              <div>
                <span className="text-stone-500">Baseline Power: </span>
                <span className="text-white font-medium">{machine.baselineKw} kW</span>
              </div>
              <span className="text-white/20">•</span>
              <div>
                <span className="text-stone-500">Firmware: </span>
                <span className="text-stone-300 font-mono font-medium">{machine.firmware}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-1 lg:pt-0">
            {isLeak && (
              <Button
                variant={isAcked ? 'secondary' : 'primary'}
                size="sm"
                icon={<AlertTriangle className="w-4 h-4" />}
                onClick={() => {
                  setIsAcked(true);
                  dispatchMaintenance();
                }}
              >
                {isAcked ? 'Technician Dispatched' : 'Acknowledge & Dispatch'}
              </Button>
            )}

            {!isLeak && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Sparkles className="w-3.5 h-3.5 text-[#2DD4BF]" />}
                onClick={() => triggerLeakEvent(machine.id)}
              >
                Simulate Air Leak
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="w-3.5 h-3.5 text-[#2DD4BF]" />}
              onClick={() => exportMachineTelemetryCsv(machine)}
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* Severity Banner Pill (When Leak Exists) */}
        {isLeak && (
          <div className="mt-1 flex items-center justify-between p-3 rounded-lg backdrop-blur-md bg-[#1B1B1F] border border-[#FF6B5A]/50 text-[#FF8070] shadow-[0_0_24px_rgba(255,107,90,0.2)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className="w-5 h-5 text-[#FF6B5A] animate-pulse shrink-0" />
              <span className="font-mono text-xs tracking-wider font-bold uppercase truncate">
                CRITICAL COMPRESSED-AIR LEAK DETECTED ({machine.tag}) — ESTIMATED AIR LOSS -21.4%
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold text-[#FF8070] uppercase tracking-widest shrink-0 ml-3 bg-[#FF6B5A]/20 px-2 py-0.5 rounded border border-[#FF6B5A]/40">
              SEV-1 AIR LOSS FLAG
            </span>
          </div>
        )}
      </Card>

      {/* 4. Primary Dashboard Grid (Telemetry Chart + Diagnostics Panel) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Dual Axis Engineering Chart & Live Metrics (8 Cols) */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <Card variant="glass" className="p-5 flex flex-col gap-4 bg-[#141416] border border-white/[0.08] rounded-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/[0.08]">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                  Synchronous Waveform Analysis
                </span>
                <h2 className="font-grotesk text-lg text-white font-semibold tracking-tight">
                  Real-Time Telemetry: Power &amp; Line Pressure (Live Window)
                </h2>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3.5 font-mono text-[11px]">
                <div className="flex items-center gap-1.5 bg-[#1B1B1F] px-2.5 py-1 rounded-md border border-white/[0.08]">
                  <span className="w-3 h-1 bg-[#14B8A6] rounded-full shadow-[0_0_6px_#14B8A6]" />
                  <span className="text-white font-medium">Power (kW)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#1B1B1F] px-2.5 py-1 rounded-md border border-white/[0.08]">
                  <span className="w-3 h-1 bg-[#FF6B5A] rounded-full shadow-[0_0_6px_#FF6B5A]" />
                  <span className="text-[#FF8070] font-medium">Line Pressure (bar)</span>
                </div>
              </div>
            </div>

            {/* Telemetry Graph Surface */}
            <div
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                setHoverPosition(x / rect.width);
              }}
              onMouseLeave={() => setHoverPosition(null)}
              className="relative w-full h-80 bg-[#0B0B0D] rounded-lg p-2 overflow-hidden flex flex-col justify-between border border-white/[0.04] cursor-crosshair"
            >
              {/* Top readout headers */}
              <div className="flex items-center justify-between px-3 py-1 font-mono text-[11px] text-stone-400 z-10 pointer-events-none">
                <div className="flex items-center gap-4">
                  <span>Y1: POWER (kW)</span>
                  <span className="text-[#2DD4BF] font-bold tabular-nums">
                    CURR: {activePoint.powerKw.toFixed(1)} kW
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[#FF8070] font-bold tabular-nums">
                    PRES: {activePoint.pressureBar.toFixed(2)} bar
                  </span>
                  <span>Y2: PRESSURE (BAR)</span>
                </div>
              </div>

              {/* Dual Axis SVG Graph */}
              <div className="absolute inset-0 px-6 pt-8 pb-7 flex items-center">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 240">
                  <defs>
                    <linearGradient id="machinePowerFill" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.25" />
                      <stop offset="70%" stopColor="#14B8A6" stopOpacity="0.04" />
                      <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="3 3" strokeWidth="0.8" x1="0" x2="800" y1="30" y2="30" />
                  <line stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="3 3" strokeWidth="0.8" x1="0" x2="800" y1="90" y2="90" />
                  <line stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="3 3" strokeWidth="0.8" x1="0" x2="800" y1="150" y2="150" />
                  <line stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="3 3" strokeWidth="0.8" x1="0" x2="800" y1="210" y2="210" />

                  {/* Baseline Limit (dotted) */}
                  <line
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeDasharray="4 6"
                    strokeWidth="1.2"
                    opacity="0.6"
                    x1="0"
                    x2="800"
                    y1={getYPower(machine.baselineKw)}
                    y2={getYPower(machine.baselineKw)}
                  />

                  {/* Area fill */}
                  <path d={powerAreaPath} fill="url(#machinePowerFill)" />

                  {/* Power Waveform line (Teal) */}
                  <path
                    d={powerPath}
                    fill="none"
                    stroke="#14B8A6"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Pressure Waveform line (Coral) */}
                  <path
                    d={presPath}
                    fill="none"
                    stroke="#FF6B5A"
                    strokeWidth="2.0"
                    strokeDasharray="4 3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Dynamic Vertical Guide */}
                  <line
                    x1={currentRatio * 800}
                    x2={currentRatio * 800}
                    y1="10"
                    y2="230"
                    stroke="#FFFFFF"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                    opacity="0.4"
                  />
                </svg>

                {/* Tooltip Overlay */}
                <div
                  style={{
                    left: `${clampedRatio * 100}%`,
                    top: '16px',
                    transform: tooltipTransform,
                  }}
                  className="absolute z-20 pointer-events-none bg-[#141416]/98 backdrop-blur-md px-3 py-2 rounded-lg border border-[#14B8A6]/50 shadow-[0_12px_32px_rgba(0,0,0,0.8)] font-mono text-xs flex flex-col gap-1 min-w-[190px]"
                >
                  <div className="text-[10px] text-stone-400 uppercase font-semibold">
                    {activePoint.timeLabel} {isHovering ? '' : '(LIVE)'}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-stone-300">Power:</span>
                    <span className="text-[#2DD4BF] font-bold">{activePoint.powerKw.toFixed(1)} kW</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-stone-300">Pressure:</span>
                    <span className="text-[#FF8070] font-bold">{activePoint.pressureBar.toFixed(2)} bar</span>
                  </div>
                </div>
              </div>

              {/* Time scale bottom */}
              <div className="flex items-center justify-between px-4 py-1.5 border-t border-white/[0.06] font-mono text-[11px] text-stone-400 z-10">
                <span>T-24h</span>
                <span>T-18h</span>
                <span>T-12h</span>
                <span>T-6h</span>
                <span className="text-[#2DD4BF] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] inline-block animate-pulse" />
                  {state.timeString} (Now)
                </span>
              </div>
            </div>

            {/* Telemetry Summary Metric Strip (4 KPIs) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Power */}
              <div className="bg-[#1B1B1F] border border-white/[0.06] rounded-lg p-3.5 flex flex-col gap-1 relative overflow-hidden">
                <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                  Present Power
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-2xl text-white font-bold tabular-nums tracking-tight">
                    {machine.powerKw.toFixed(1)}
                  </span>
                  <span className="font-mono text-xs text-stone-400 font-medium">kW</span>
                </div>
                <span className="font-mono text-[11px] text-[#2DD4BF] flex items-center gap-0.5 font-medium">
                  Rating: {machine.ratingKw} kW
                </span>
              </div>

              {/* Pressure */}
              <div className="bg-[#1B1B1F] border border-white/[0.06] rounded-lg p-3.5 flex flex-col gap-1 relative overflow-hidden">
                <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                  Header Pressure
                </span>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`font-mono text-2xl font-bold tabular-nums tracking-tight ${
                      isLeak ? 'text-[#FF8070]' : 'text-white'
                    }`}
                  >
                    {machine.pressureBar.toFixed(2)}
                  </span>
                  <span className="font-mono text-xs text-stone-400 font-medium">bar</span>
                </div>
                <span
                  className={`font-mono text-[11px] font-medium ${
                    isLeak ? 'text-[#FF8070]' : 'text-[#2DD4BF]'
                  }`}
                >
                  {isLeak ? '-0.40 bar Pressure Drop' : 'Nominal Band (6.8 bar)'}
                </span>
              </div>

              {/* Flow */}
              <div className="bg-[#1B1B1F] border border-white/[0.06] rounded-lg p-3.5 flex flex-col gap-1 relative overflow-hidden">
                <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                  Airflow Rate
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-2xl text-white font-bold tabular-nums tracking-tight">
                    {machine.flowCfm}
                  </span>
                  <span className="font-mono text-xs text-stone-400 font-medium">CFM</span>
                </div>
                <span className="font-mono text-[11px] text-stone-400">
                  Efficiency: {machine.efficiency}%
                </span>
              </div>

              {/* Motor Temperature */}
              <div className="bg-[#1B1B1F] border border-white/[0.06] rounded-lg p-3.5 flex flex-col gap-1 relative overflow-hidden">
                <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                  Motor Temperature
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-2xl text-white font-bold tabular-nums tracking-tight">
                    {machine.tempC.toFixed(1)}
                  </span>
                  <span className="font-mono text-xs text-stone-400 font-medium">°C</span>
                </div>
                <span className="font-mono text-[11px] text-stone-400">
                  Vibration: {machine.vibrationMmS.toFixed(2)} mm/s
                </span>
              </div>
            </div>
          </Card>

          {/* Telemetry Chronology Event Log Table */}
          <Card variant="glass" className="p-5 flex flex-col gap-3 bg-[#141416] border border-white/[0.08] rounded-xl">
            <div className="flex flex-wrap items-center justify-between pb-2 border-b border-white/[0.06] gap-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-stone-400" />
                <h3 className="font-grotesk text-base text-white font-semibold tracking-tight">
                  Telemetry Chronology &amp; Sensor Events
                </h3>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-stone-400 uppercase">Filter:</span>
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value as any)}
                  className="bg-[#1B1B1F] text-white border border-white/[0.08] rounded px-2 py-0.5"
                >
                  <option value="ALL">ALL LOGS</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="WARNING">WARNING</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-stone-400 uppercase text-[10px]">
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Source Tag</th>
                    <th className="py-2 px-3">Telemetry Event Description</th>
                    <th className="py-2 px-3 text-center">Status</th>
                    <th className="py-2 px-3 text-right">Metric</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {events.map((ev) => (
                    <tr
                      key={ev.id}
                      className={ev.isCritical ? 'bg-[#FF6B5A]/[0.08]' : 'hover:bg-white/[0.02]'}
                    >
                      <td className={`py-3 px-3 font-bold ${ev.isCritical ? 'text-[#FF8070]' : 'text-stone-400'}`}>
                        {ev.time}
                      </td>
                      <td className={`py-3 px-3 ${ev.isCritical ? 'text-[#FF8070] font-bold' : 'text-white'}`}>
                        {ev.source}
                      </td>
                      <td className={`py-3 px-3 font-sans ${ev.isCritical ? 'text-white' : 'text-stone-300'}`}>
                        {ev.desc}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            ev.isCritical
                              ? 'bg-[#FF6B5A]/20 text-[#FF8070] border-[#FF6B5A]/40'
                              : 'bg-[#14B8A6]/20 text-[#2DD4BF] border-[#14B8A6]/40'
                          }`}
                        >
                          {ev.statusBadge}
                        </span>
                      </td>
                      <td className={`py-3 px-3 text-right font-bold ${ev.isCritical ? 'text-[#FF8070]' : 'text-[#2DD4BF]'}`}>
                        {ev.metric}
                      </td>
                    </tr>
                  ))}
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-stone-500 font-sans">
                        No telemetry events matching filter "{logFilter}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Diagnostics & ISO 1217 Benchmark Panel (4 Cols) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Active Leak Diagnostic Card */}
          {isLeak ? (
            <Card variant="glass" className="relative p-5 flex flex-col gap-4 border-l-4 border-l-[#FF6B5A] alert-halo bg-[#1B1B1F] rounded-xl">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B5A] animate-pulse shadow-[0_0_8px_#FF6B5A]" />
                  <h3 className="font-grotesk text-sm text-[#FF8070] uppercase tracking-wider font-bold">
                    Active Acoustic Leak Diagnostic
                  </h3>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 bg-[#FF6B5A]/20 text-[#FF8070] font-bold rounded-full border border-[#FF6B5A]/40">
                  CONFIDENCE: 98.4%
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                  Identified Leak Location
                </span>
                <div className="font-grotesk text-sm font-semibold text-white">
                  Line 2 Quick-Disconnect Coupling
                </div>
                <p className="font-sans text-xs text-stone-300 mt-1 leading-relaxed">
                  Ultrasonic sensor US-04 detected 84.6 dB acoustic emission signature at 40 kHz during full-load cycle.
                </p>
              </div>

              {/* Waste Metrics */}
              <div className="grid grid-cols-2 gap-3 bg-[#141416] rounded-lg p-3 border border-white/[0.06]">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-stone-400 uppercase font-semibold">Orifice Air Loss</span>
                  <span className="font-mono text-xl text-[#FF8070] font-bold tabular-nums">
                    14.2 <span className="text-xs text-stone-400 font-normal">CFM</span>
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-stone-400 uppercase font-semibold">Parasitic Power</span>
                  <span className="font-mono text-xl text-[#FF8070] font-bold tabular-nums">
                    4.2 <span className="text-xs text-stone-400 font-normal">kW</span>
                  </span>
                </div>
              </div>

              {/* Financial Impact */}
              <div className="relative bg-[#141416] rounded-lg p-3.5 flex flex-col gap-1 border-l-2 border-[#FF6B5A] overflow-hidden shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#FF8070] uppercase tracking-wider font-bold">
                    Financial Impact
                  </span>
                  <span className="font-mono text-[10px] text-stone-400">
                    Blended rate: ₹{settings.tariffInrPerKwh.toFixed(2)}/kWh
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl text-white font-bold tabular-nums tracking-tight">
                    ₹{(state.leakAlert?.costPerDayInr || 1420).toLocaleString('en-IN')}
                  </span>
                  <span className="font-sans text-xs text-stone-400">/ 24-hr shift</span>
                </div>
                <span className="font-mono text-xs text-[#FF8070] font-semibold">
                  Projected: ₹{(state.leakAlert?.costPerMonthInr || 42600).toLocaleString('en-IN')} / month cumulative loss
                </span>
              </div>

              {/* Work Order Action */}
              <Button
                variant="primary"
                icon={<Wrench className="w-4 h-4 text-[#0B0B0D]" />}
                onClick={() => {
                  setIsAcked(true);
                  dispatchMaintenance();
                }}
                className="w-full font-mono text-xs font-bold"
              >
                {isAcked ? 'Work Order Dispatched' : 'Dispatch Maintenance Technician'}
              </Button>
            </Card>
          ) : (
            <Card variant="glass" className="p-5 flex flex-col gap-4 border-l-4 border-l-[#14B8A6] bg-[#141416] rounded-xl border border-white/[0.08]">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2DD4BF]" />
                  <h3 className="font-grotesk text-sm text-[#2DD4BF] uppercase tracking-wider font-bold">
                    Compressor Health: Nominal
                  </h3>
                </div>
                <span className="font-mono text-[10px] px-2.5 py-0.5 bg-[#14B8A6]/15 text-[#2DD4BF] font-bold rounded-full border border-[#14B8A6]/40">
                  HEALTH: 97%
                </span>
              </div>
              <p className="text-xs text-stone-300 font-sans leading-relaxed">
                Acoustic sensors show normal baseline (&lt; 65 dB). No turbulent air leaks detected in main ring header or tool drop lines.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] font-mono text-xs text-stone-400">
                <span>Next Scheduled Inspection:</span>
                <span className="text-white font-semibold">14 Days (Nov 15)</span>
              </div>
            </Card>
          )}

          {/* Baseline vs Current Benchmark Card (ISO 1217 Annex C) */}
          <Card variant="glass" className="p-5 flex flex-col gap-4 bg-[#141416] border border-white/[0.08] rounded-xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-stone-400" />
                <h3 className="font-grotesk text-sm text-white uppercase tracking-wider font-bold">
                  Specific Power Consumption (SPC)
                </h3>
              </div>
              <span className="font-mono text-[10px] text-[#2DD4BF] font-semibold tracking-wider">
                ISO 1217 ANNEX C
              </span>
            </div>

            {/* Specific Power Gauge */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-stone-400">Specific Power (kW/100 CFM):</span>
                <span className="text-white font-bold">{machine.specificPower} kW/100 CFM</span>
              </div>
              <div className="w-full bg-[#0B0B0D] h-2.5 rounded-full overflow-hidden flex p-0.5 border border-white/[0.08]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isLeak ? 'bg-[#FF6B5A] shadow-[0_0_8px_#FF6B5A]' : 'bg-[#14B8A6] shadow-[0_0_8px_#14B8A6]'
                  }`}
                  style={{ width: `${Math.min(100, (machine.specificPower / 25) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] text-stone-400">
                <span>Benchmark: 17.5 kW/100 CFM</span>
                <span className={isLeak ? 'text-[#FF8070] font-bold' : 'text-[#2DD4BF] font-semibold'}>
                  {isLeak ? '+28% degradation' : 'Optimal Band'}
                </span>
              </div>
            </div>

            {/* Sub-system Indicators */}
            <div className="flex flex-col gap-1 divide-y divide-white/[0.04] pt-2">
              <div className="flex items-center justify-between py-2 font-mono text-xs">
                <span className="text-stone-300 font-sans">Compressor Loading Factor</span>
                <span className="text-white font-bold">{loadingFactor}%</span>
              </div>
              <div className="flex items-center justify-between py-2 font-mono text-xs">
                <span className="text-stone-300 font-sans">Power Factor (cos φ)</span>
                <span className="text-[#2DD4BF] font-bold">{machine.powerFactor.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 font-mono text-xs">
                <span className="text-stone-300 font-sans">Sensor Floor</span>
                <span className={isLeak ? 'text-[#FF8070] font-bold' : 'text-white'}>
                  {machine.acousticDb.toFixed(1)} dB
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
