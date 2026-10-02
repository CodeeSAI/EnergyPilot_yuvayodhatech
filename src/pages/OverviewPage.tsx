import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Check,
  Leaf,
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  X,
  Loader2,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { useSimulator } from '../sim';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, settings, dispatchMaintenance, dismissLeakAlert, triggerLeakEvent } = useSimulator();

  const [timeFilter, setTimeFilter] = useState<'1H' | '6H' | '24H' | '7D'>('24H');
  const [tableFilter, setTableFilter] = useState<'all' | 'running' | 'idle' | 'leaks'>('all');
  const [sortKey, setSortKey] = useState<'name' | 'power' | 'efficiency'>('name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Chart Interactive Tooltip State
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Machine Assets from Simulator
  const assetsList = useMemo(() => Object.values(state.machines), [state.machines]);

  // Count active air leaks
  const activeLeakAssets = useMemo(
    () => assetsList.filter((a) => a.status === 'leaks'),
    [assetsList]
  );
  const activeLeakCount = activeLeakAssets.length;

  // Sorting
  const sortedAssets = useMemo(() => {
    return [...assetsList]
      .filter((asset) => (tableFilter === 'all' ? true : asset.status === tableFilter))
      .sort((a, b) => {
        let valA: string | number =
          sortKey === 'name' ? a.name : sortKey === 'power' ? a.powerKw : a.efficiency;
        let valB: string | number =
          sortKey === 'name' ? b.name : sortKey === 'power' ? b.powerKw : b.efficiency;

        if (typeof valA === 'string') {
          return sortAsc
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [assetsList, tableFilter, sortKey, sortAsc]);

  const handleSort = (key: 'name' | 'power' | 'efficiency') => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // Select telemetry history window based on timeFilter ('1H' | '6H' | '24H' | '7D')
  const history = useMemo(() => {
    switch (timeFilter) {
      case '1H':
        return state.history1h && state.history1h.length > 0 ? state.history1h : state.history24h || [];
      case '6H':
        return state.history6h && state.history6h.length > 0 ? state.history6h : state.history24h || [];
      case '7D':
        return state.history7d && state.history7d.length > 0 ? state.history7d : state.history24h || [];
      case '24H':
      default:
        return state.history24h || [];
    }
  }, [state.history1h, state.history6h, state.history24h, state.history7d, timeFilter]);

  const pointsCount = history.length;

  // Dynamic Y-axis scaling to data range (min/max with padding, line uses full vertical range)
  const { minY, maxY, yTicks, getY } = useMemo(() => {
    if (history.length === 0) {
      return {
        minY: 90,
        maxY: 240,
        yTicks: [
          { val: 240, y: 38 },
          { val: 190, y: 112 },
          { val: 140, y: 186 },
          { val: 90, y: 260 },
        ],
        getY: () => 150,
      };
    }

    const vals = history.map((p) => p.powerKw);
    const dMin = Math.min(...vals);
    const dMax = Math.max(...vals);

    // Include 220 kW baseline cap in scale range so threshold is visible
    const targetMax = Math.max(dMax, 220);
    const span = Math.max(40, targetMax - dMin);
    const pad = span * 0.12;

    const computedMin = Math.floor(Math.max(0, dMin - pad) / 10) * 10;
    const computedMax = Math.ceil((targetMax + pad) / 10) * 10;

    const min = Math.max(0, computedMin);
    const max = Math.max(min + 40, computedMax);

    // Plotting area in SVG viewBox (0 0 1000 300)
    const yTop = 38;
    const yBottom = 260;
    const yRange = yBottom - yTop;

    const getYCoord = (kw: number) => {
      const clamped = Math.max(min, Math.min(max, kw));
      return yBottom - ((clamped - min) / (max - min)) * yRange;
    };

    const t1 = max;
    const t2 = Math.round(min + (max - min) * 0.67);
    const t3 = Math.round(min + (max - min) * 0.33);
    const t4 = min;

    return {
      minY: min,
      maxY: max,
      yTicks: [
        { val: t1, y: yTop },
        { val: t2, y: yTop + yRange * 0.33 },
        { val: t3, y: yTop + yRange * 0.67 },
        { val: t4, y: yBottom },
      ],
      getY: getYCoord,
    };
  }, [history]);

  const svgPoints = useMemo(() => {
    if (pointsCount === 0) return [];
    return history.map((pt, i) => {
      const x = (i / (pointsCount - 1)) * 1000;
      const y = getY(pt.powerKw);
      return { x, y, pt };
    });
  }, [history, pointsCount, getY]);

  // Construct smooth bezier line
  const { linePath, areaPath } = useMemo(() => {
    if (svgPoints.length === 0) return { linePath: '', areaPath: '' };

    let d = `M ${svgPoints[0].x.toFixed(1)},${svgPoints[0].y.toFixed(1)}`;
    for (let i = 0; i < svgPoints.length - 1; i++) {
      const p1 = svgPoints[i];
      const p2 = svgPoints[i + 1];
      const cx = (p1.x + p2.x) / 2;
      d += ` Q ${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${cx.toFixed(1)},${((p1.y + p2.y) / 2).toFixed(1)}`;
    }
    const last = svgPoints[svgPoints.length - 1];
    d += ` T ${last.x.toFixed(1)},${last.y.toFixed(1)}`;

    const area = `${d} L 1000,290 L 0,290 Z`;
    return { linePath: d, areaPath: area };
  }, [svgPoints]);

  // Window-consistent aggregates
  const windowPeak = useMemo(() => {
    if (history.length === 0) return state.peakDemandToday;
    return Math.max(...history.map((p) => p.powerKw));
  }, [history, state.peakDemandToday]);

  const windowOffPeakAvg = useMemo(() => {
    if (history.length === 0) return state.offPeakAvgToday;
    const sorted = [...history].sort((a, b) => a.powerKw - b.powerKw);
    const lowSlice = sorted.slice(0, Math.max(2, Math.floor(sorted.length * 0.35)));
    return +(lowSlice.reduce((acc, p) => acc + p.powerKw, 0) / lowSlice.length).toFixed(1);
  }, [history, state.offPeakAvgToday]);

  const windowBaseIdle = useMemo(() => {
    if (history.length === 0) return state.baseIdleLoad;
    return Number(Math.min(...history.map((p) => p.powerKw)).toFixed(1));
  }, [history, state.baseIdleLoad]);

  // Dynamic Trend Badges (Single source of truth computed from data)
  const savingsTarget = state.savings.monthlyTargetInr || 520000;
  const savingsPercentOfTarget = +((state.savings.totalCostSavedInr / savingsTarget) * 100).toFixed(1);
  const savingsBadgeText = `${savingsPercentOfTarget}% of target`;
  const savingsBadgeVariant = savingsPercentOfTarget >= 90 ? ('running' as const) : ('critical' as const);

  // Contracted monthly energy quota cap is 153,000 kWh
  const energyQuotaKwh = 153000;
  const energyDiffPercent = +(((state.savings.totalKwhConsumed - energyQuotaKwh) / energyQuotaKwh) * 100).toFixed(1);
  const energyBadgeText = `${energyDiffPercent > 0 ? '+' : ''}${energyDiffPercent}%`;
  // A decrease in energy shows as an improvement (teal) and a rise in waste shows as bad (coral)
  const energyBadgeVariant = energyDiffPercent <= 0 ? ('running' as const) : ('critical' as const);

  // Interactive Hover calculations
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setHoverPosition(x / rect.width);
  };

  const handleMouseLeave = () => {
    setHoverPosition(null);
  };

  const isHovering = hoverPosition !== null;
  const currentRatio = isHovering ? hoverPosition : 1.0;
  const activeHoverIdx = Math.min(
    pointsCount - 1,
    Math.max(0, Math.round(currentRatio * (pointsCount - 1)))
  );
  const activePoint = history[activeHoverIdx] || history[history.length - 1];

  const activeKw = activePoint ? activePoint.powerKw : state.fleetTelemetry.powerKw;
  const activeBar = activePoint ? activePoint.pressureBar : state.fleetTelemetry.pressureBar;
  const activePf = activePoint ? activePoint.powerFactor : state.fleetTelemetry.powerFactor;
  const activeTimeStr = activePoint ? activePoint.timeLabel : state.timeString;
  const shiftStr = state.shiftString.toUpperCase();

  // Tooltip horizontal clamping and flip (stays inside chart bounds, flips left/right near edges)
  const clampedRatio = Math.max(0.12, Math.min(0.88, currentRatio));
  const tooltipTransform =
    clampedRatio > 0.65
      ? 'translate(-92%, 0)'
      : clampedRatio < 0.35
      ? 'translate(-8%, 0)'
      : 'translate(-50%, 0)';

  // Live dot SVG coordinates
  const liveDotX = currentRatio * 100;
  const liveDotY = ((getY(activeKw) / 300) * 100).toFixed(1);

  // Time Axis Bottom Markers depending on timeFilter
  const timeAxisMarkers = useMemo(() => {
    switch (timeFilter) {
      case '1H':
        return ['T-60m', 'T-45m', 'T-30m', 'T-15m', `${state.timeString} (Live)`];
      case '6H':
        return ['T-6h', 'T-4.5h', 'T-3h', 'T-1.5h', `${state.timeString} (Live)`];
      case '7D':
        return ['7D Ago', '5D Ago', '3D Ago', 'Yesterday', `${state.timeString} (Live)`];
      case '24H':
      default:
        return ['T-24h', 'T-18h', 'T-12h (Shift A)', 'T-6h', `${state.timeString} (Live)`];
    }
  }, [timeFilter, state.timeString]);

  return (
    <div className="flex flex-col w-full gap-space-lg select-none">
      {/* 1. Top Level Stat Cards (4 Cards with Colored Top Borders & Solid White Numbers) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* Card 1: Saved This Month (Teal Top Border) */}
        <StatCard
          title="Saved This Month"
          value={state.savings.totalCostSavedInr}
          format="currency"
          prefix="₹"
          badgeText={savingsBadgeText}
          badgeVariant={savingsBadgeVariant}
          badgeIcon={<TrendingUp className="w-3.5 h-3.5" />}
          footerLeft={`Target: ₹${savingsTarget.toLocaleString('en-IN')}/mo`}
          footerRight={`${state.savings.targetPercentMet}% met`}
          footerRightHighlight="teal"
          topBorder="teal"
          hasRadialBloom={true}
        />

        {/* Card 2: Energy Consumed (Teal Top Border) */}
        <StatCard
          title="Energy Consumed (kWh)"
          value={state.savings.totalKwhConsumed}
          format="integer"
          unit="kWh"
          badgeText={energyBadgeText}
          badgeVariant={energyBadgeVariant}
          badgeIcon={<Check className="w-3.5 h-3.5" />}
          footerLeft={`${energyBadgeText} from peak load quota`}
          footerRight="Cap: 153k"
          footerRightHighlight="slate"
          topBorder="teal"
        />

        {/* Card 3: CO2 Avoided (Teal-to-Coral Gradient Top Border) */}
        <StatCard
          title="CO₂ Avoided (Tonnes)"
          value={state.savings.co2AvoidedTonnes}
          format="decimal"
          unit="tCO₂e"
          badgeText="CEA Baseline"
          badgeVariant="running"
          badgeIcon={<Leaf className="w-3.5 h-3.5" />}
          footerLeft="Grid electricity saved"
          footerRight={`Grid factor: ${settings.gridEmissionFactorKgPerKwh.toFixed(2)}`}
          footerRightHighlight="teal"
          topBorder="gradient"
        />

        {/* Card 4: Active Air Leaks (Solid Coral Top Border) */}
        <StatCard
          title="Active Leaks / Anomalies"
          value={activeLeakCount}
          format="integer"
          unit={activeLeakCount > 0 ? 'UNRESOLVED' : 'NOMINAL'}
          badgeText={activeLeakCount > 0 ? 'Alert Trigger' : 'All Clear'}
          badgeVariant={activeLeakCount > 0 ? 'critical' : 'running'}
          badgeClassName="whitespace-nowrap px-2 py-0.5"
          badgeIcon={<AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
          footerLeft={
            activeLeakCount > 0
              ? `Est. ₹${(state.leakAlert?.costPerDayInr || 1420).toLocaleString('en-IN')}/day energy waste`
              : 'All lines at nominal pressure'
          }
          footerRight={activeLeakCount > 0 ? `${state.leakAlert?.cfmLoss || 14.2} CFM` : '0.0 CFM'}
          footerRightHighlight={activeLeakCount > 0 ? 'coral' : 'teal'}
          topBorder="coral"
        />
      </div>

      {/* 2. Telemetry Main Chart Section */}
      <Card className="p-space-md flex flex-col gap-space-md bg-[#141416] border border-white/[0.08] rounded-xl">
        {/* Chart Header Controls */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-space-sm border-b border-white/[0.08]">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="font-grotesk font-bold text-sm text-white tracking-wider uppercase">
                Live Compressor &amp; Motor Load ({timeFilter})
              </h2>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#14B8A6]/15 border border-[#14B8A6]/40 text-[#2DD4BF] font-mono text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-ping" />
                LIVE STREAM
              </span>
            </div>
            <span className="font-mono text-[11px] text-stone-400 mt-0.5">
              Telemetry stream updated every 2.5s • Multi-channel meter CT-03 • Current:{' '}
              <span className="text-[#2DD4BF] font-bold">{state.fleetTelemetry.powerKw.toFixed(1)} kW</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-space-sm shrink-0">
            {/* Simulation trigger quick demo button */}
            {(!state.leakAlert || !state.leakAlert.active) && (
              <button
                onClick={() => triggerLeakEvent('MNF-4B')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#FF6B5A]/15 hover:bg-[#FF6B5A]/25 text-[#FF8070] border border-[#FF6B5A]/40 font-mono text-xs font-semibold transition-all active:scale-95 shadow-[0_0_12px_rgba(255,107,90,0.15)] cursor-pointer"
                title="Simulate compressed-air leak"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Simulate Air Leak
              </button>
            )}

            {/* Toggle Metric Legend */}
            <div className="flex items-center gap-2 px-space-sm py-1 bg-[#1B1B1F] rounded-md border border-white/[0.08] font-mono text-[11px]">
              <span className="w-3 h-1 bg-[#14B8A6] rounded-full shadow-[0_0_6px_#14B8A6]" />
              <span className="font-medium text-white">Actual (kW)</span>
              <span className="text-stone-500">/</span>
              <span className="w-3 h-1 bg-[#FF6B5A] rounded-full shadow-[0_0_6px_#FF6B5A]" />
              <span className="text-stone-300">Baseline Peak (220 kW)</span>
            </div>

            {/* Filter Interval Buttons (Readable Active and Inactive States) */}
            <div className="flex items-center bg-[#1B1B1F] rounded-md p-1 border border-white/[0.08] font-mono text-xs gap-1">
              {(['1H', '6H', '24H', '7D'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-2.5 py-1 rounded transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                    timeFilter === filter
                      ? 'bg-[#14B8A6]/20 border border-[#14B8A6] text-[#2DD4BF] font-bold shadow-[0_0_12px_rgba(20,184,166,0.25)]'
                      : 'text-stone-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Graphic SVG Waveform Chart with Interactive Hover & Live Trailing Data */}
        <div
          ref={chartRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full h-72 md:h-80 select-none cursor-crosshair overflow-hidden"
        >
          {/* Interactive Tooltip: Placed inside chart coordinate space, flipped near boundaries, never covering controls */}
          <div
            style={{
              left: `${clampedRatio * 100}%`,
              top: '16px',
              transform: tooltipTransform,
            }}
            className="absolute z-20 pointer-events-none flex flex-col bg-[#141416]/98 rounded-lg p-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.85)] backdrop-blur-md border border-[#14B8A6]/50 transition-all duration-100 ease-out min-w-[210px]"
          >
            <div className="flex items-center justify-between gap-3 font-mono text-[10px] text-stone-400 pb-1.5 border-b border-white/[0.08]">
              <span className="font-bold text-white">
                {shiftStr.split(' ')[0]} • T-{activeTimeStr} {isHovering ? '' : '(LIVE)'}
              </span>
              <span
                className={`font-bold tracking-wider px-2 py-0.5 rounded-full text-[9px] ${
                  activeLeakCount > 0
                    ? 'bg-[#FF6B5A]/20 text-[#FF8070] border border-[#FF6B5A]/40'
                    : 'bg-[#14B8A6]/20 text-[#2DD4BF] border border-[#14B8A6]/40'
                }`}
              >
                {activeLeakCount > 0 ? 'LEAK DETECTED' : 'NOMINAL'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 mt-2 font-mono">
              <div>
                <div className="text-[9px] text-stone-400 uppercase tracking-wider font-semibold">
                  Active Load
                </div>
                <div className="text-white font-bold text-xs mt-0.5">
                  {activeKw.toFixed(1)} kW
                </div>
              </div>
              <div>
                <div className="text-[9px] text-stone-400 uppercase tracking-wider font-semibold">
                  Pressure
                </div>
                <div className="text-[#2DD4BF] font-bold text-xs mt-0.5">
                  {activeBar.toFixed(2)} bar
                </div>
              </div>
              <div>
                <div className="text-[9px] text-stone-400 uppercase tracking-wider font-semibold">
                  Power Factor
                </div>
                <div className="text-[#FF8070] font-bold text-xs mt-0.5">
                  {activePf.toFixed(2)} PF
                </div>
              </div>
            </div>
          </div>

          {/* SVG Vector Chart with Real Trailing Data */}
          <svg
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
            viewBox="0 0 1000 300"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.25" />
                <stop offset="70%" stopColor="#14B8A6" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.00" />
              </linearGradient>
              <linearGradient id="strokeGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#14B8A6" />
                <stop offset="50%" stopColor="#2DD4BF" />
                <stop offset="100%" stopColor="#0F9A8B" />
              </linearGradient>
              <filter id="svgGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Dynamic Y-Axis Grid Lines & Reference Values */}
            <g className="text-stone-500 font-mono text-[11px]" opacity="0.45">
              {yTicks.map((t, idx) => (
                <React.Fragment key={idx}>
                  <line x1="0" x2="1000" y1={t.y} y2={t.y} stroke="currentColor" strokeDasharray="3,4" />
                  <text x="10" y={t.y - 4} fill="currentColor" className="font-tabular">
                    {t.val} kW
                  </text>
                </React.Fragment>
              ))}
            </g>

            {/* Baseline Cap Line (Coral Warning Threshold at 220 kW, Left-Aligned Label to prevent collisions) */}
            {minY <= 220 && maxY >= 220 && (
              <g>
                <line
                  x1="0"
                  x2="1000"
                  y1={getY(220)}
                  y2={getY(220)}
                  stroke="#FF6B5A"
                  strokeDasharray="4,6"
                  strokeWidth="1.5"
                  opacity="0.85"
                />
                <text
                  x="70"
                  y={getY(220) - 5}
                  fill="#FF6B5A"
                  textAnchor="start"
                  className="font-mono text-[10px] tracking-wider uppercase font-bold"
                >
                  LIMIT 220 kW
                </text>
              </g>
            )}

            {/* Live Shaded Area Under Curve */}
            <path d={areaPath} fill="url(#areaGradient)" />

            {/* Live Waveform with Soft Glow */}
            <path
              d={linePath}
              fill="none"
              stroke="url(#strokeGradient)"
              strokeWidth="2.6"
              strokeLinecap="round"
              filter="url(#svgGlow)"
            />

            {/* Dynamic Vertical Guide Line */}
            <line
              x1={currentRatio * 1000}
              x2={currentRatio * 1000}
              y1="20"
              y2="280"
              stroke="#14B8A6"
              strokeDasharray="2,3"
              strokeWidth="1.2"
              opacity="0.65"
            />
          </svg>

          {/* Animated glowing live dot positioned at current line point */}
          <div
            style={{
              left: `${liveDotX}%`,
              top: `${liveDotY}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center transition-all duration-300"
          >
            <span className="absolute inline-flex h-6 w-6 rounded-full bg-[#14B8A6] opacity-75 animate-ping" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#14B8A6] ring-4 ring-[#14B8A6]/30 shadow-[0_0_14px_#14B8A6]" />
          </div>

          {/* Time Axis Bottom Markers */}
          <div className="flex justify-between items-center w-full px-2 pt-1 font-mono text-[11px] text-stone-400 border-t border-white/[0.08]">
            <span>{timeAxisMarkers[0]}</span>
            <span>{timeAxisMarkers[1]}</span>
            <span className="text-stone-300 font-medium">{timeAxisMarkers[2]}</span>
            <span>{timeAxisMarkers[3]}</span>
            <span className="text-[#2DD4BF] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] inline-block animate-pulse" />
              {timeAxisMarkers[4]}
            </span>
          </div>
        </div>

        {/* Secondary Readout Ticker Bar with Live Simulated Aggregates (No Text Cutoff, Wraps Cleanly) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#1B1B1F] rounded-lg border border-white/[0.08] font-mono text-xs">
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-[#141416] rounded-md border border-white/[0.04] min-w-0">
            <span className="text-stone-400 uppercase text-[10px] tracking-wide font-semibold whitespace-nowrap">
              Peak Demand:
            </span>
            <span className="text-white font-bold font-tabular text-sm whitespace-nowrap">
              {windowPeak.toFixed(1)} kW{' '}
              <span className="text-stone-500 font-normal text-[10px]">(Max)</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-[#141416] rounded-md border border-white/[0.04] min-w-0">
            <span className="text-stone-400 uppercase text-[10px] tracking-wide font-semibold whitespace-nowrap">
              Off-Peak Avg:
            </span>
            <span className="text-white font-bold font-tabular text-sm whitespace-nowrap">
              {windowOffPeakAvg.toFixed(1)} kW{' '}
              <span className="text-[#2DD4BF] text-[10px] font-semibold">(Night)</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-[#141416] rounded-md border border-white/[0.04] min-w-0">
            <span className="text-stone-400 uppercase text-[10px] tracking-wide font-semibold whitespace-nowrap">
              Base Idle Load:
            </span>
            <span className="text-[#FF8070] font-bold font-tabular text-sm whitespace-nowrap">
              {windowBaseIdle.toFixed(1)} kW{' '}
              <span className="text-stone-500 font-normal text-[10px]">(&lt;25 kW Target)</span>
            </span>
          </div>
        </div>
      </Card>

      {/* 3. Bottom Section: Critical Assets Table with Live Moving Values */}
      <Card className="p-space-md flex flex-col gap-space-md bg-[#141416] border border-white/[0.08] rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <h3 className="font-grotesk font-bold text-sm text-white tracking-wider uppercase">
              Critical Machines &amp; Assets
            </h3>
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-[#1B1B1F] text-stone-300 border border-white/[0.08] font-semibold">
              {assetsList.length} Monitored Nodes (Live Telemetry)
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#1B1B1F] rounded-md p-1 border border-white/[0.08] font-mono text-xs gap-1">
              {(
                [
                  { key: 'all', label: `All (${assetsList.length})` },
                  {
                    key: 'running',
                    label: `Running (${assetsList.filter((a) => a.status === 'running').length})`,
                  },
                  {
                    key: 'idle',
                    label: `Idle (${assetsList.filter((a) => a.status === 'idle').length})`,
                  },
                  {
                    key: 'leaks',
                    label: `Issues (${assetsList.filter((a) => a.status === 'leaks').length})`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setTableFilter(tab.key)}
                  className={`px-3 py-1 rounded transition-all duration-150 active:scale-[0.97] ${
                    tableFilter === tab.key
                      ? 'bg-[#14B8A6]/20 border border-[#14B8A6] text-[#2DD4BF] font-bold shadow-[0_0_10px_rgba(20,184,166,0.2)]'
                      : 'text-stone-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dense Industrial Data Table */}
        <div className="overflow-x-auto rounded border border-white/[0.08]">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#0B0B0D] font-grotesk text-[11px] text-stone-400 uppercase tracking-wider font-semibold select-none">
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-3.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Asset Identifier &amp; Type
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3.5">Plant Location</th>
                <th className="py-3 px-3.5">Operational Status</th>
                <th
                  onClick={() => handleSort('power')}
                  className="py-3 px-3.5 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    Power Draw
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('efficiency')}
                  className="py-3 px-3.5 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    Efficiency
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] font-mono text-xs">
              {sortedAssets.map((asset) => {
                const isLeak = asset.status === 'leaks';
                return (
                  <tr
                    key={asset.id}
                    onClick={() => navigate(`/machines/${asset.id}`)}
                    className={`transition-all duration-150 group cursor-pointer ${
                      isLeak
                        ? 'bg-[#FF6B5A]/[0.08] hover:bg-[#FF6B5A]/[0.14]'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <td className="py-3.5 px-3.5 font-sans">
                      <div className="flex flex-col">
                        <span
                          className={`font-semibold text-sm transition-colors ${
                            isLeak
                              ? 'text-[#FF8070]'
                              : 'text-white group-hover:text-[#2DD4BF]'
                          }`}
                        >
                          {asset.name}
                        </span>
                        <span className="text-stone-400 text-[11px] font-mono mt-0.5">
                          TAG: {asset.tag} • {asset.subType}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 text-stone-300 font-sans text-xs">
                      {asset.location}
                    </td>
                    <td className="py-3.5 px-3.5">
                      <Badge
                        variant={
                          asset.status === 'running'
                            ? 'running'
                            : asset.status === 'idle'
                            ? 'idle'
                            : 'critical'
                        }
                        pulse={asset.status === 'running'}
                        ping={asset.status === 'leaks'}
                      >
                        {asset.statusLabel}
                      </Badge>
                    </td>
                    <td
                      className={`py-3.5 px-3.5 text-right font-bold font-tabular text-sm ${
                        isLeak ? 'text-[#FF8070]' : 'text-white'
                      }`}
                    >
                      {asset.powerKw.toFixed(1)} kW
                    </td>
                    <td className="py-3.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <span
                          className={`font-bold font-tabular text-xs ${
                            isLeak
                              ? 'text-[#FF8070]'
                              : asset.status === 'idle'
                              ? 'text-stone-400'
                              : 'text-[#2DD4BF]'
                          }`}
                        >
                          {asset.efficiency.toFixed(1)}%{isLeak ? ' - LOW' : ''}
                        </span>
                        <div className="w-14 h-1.5 rounded-full bg-[#1B1B1F] overflow-hidden hidden sm:block">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isLeak
                                ? 'bg-[#FF6B5A] shadow-[0_0_8px_#FF6B5A]'
                                : asset.status === 'idle'
                                ? 'bg-stone-500'
                                : 'bg-[#14B8A6] shadow-[0_0_8px_#14B8A6]'
                            }`}
                            style={{ width: `${asset.efficiency}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/machines/${asset.id}`);
                        }}
                        className={`text-[11px] font-bold inline-flex items-center gap-1 active:scale-[0.97] transition-all group-hover:translate-x-0.5 ${
                          isLeak
                            ? 'text-[#FF8070] hover:underline'
                            : 'text-stone-400 group-hover:text-[#2DD4BF]'
                        }`}
                      >
                        <span>Diagnostic</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 text-stone-400 font-mono text-xs">
          <span>Showing {sortedAssets.length} of 5 monitored industrial machines</span>
          <div className="flex items-center gap-2">
            <button className="px-2.5 py-1 rounded bg-[#1B1B1F] text-stone-300 hover:text-white font-mono text-xs border border-white/[0.08] transition-all duration-150 active:scale-[0.97]">
              Previous
            </button>
            <span className="text-white px-1.5 font-bold">1 / 1</span>
            <button className="px-2.5 py-1 rounded bg-[#1B1B1F] text-stone-300 hover:text-white font-mono text-xs border border-white/[0.08] transition-all duration-150 active:scale-[0.97]">
              Next
            </button>
          </div>
        </div>
      </Card>

      {/* 4. Slide-in Docked Telemetry Alert Toast (Floating bottom-right 20px margin, max-width 380px, working close) */}
      <AnimatePresence>
        {state.leakAlert && state.leakAlert.active && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-5 right-5 max-w-[380px] w-[calc(100%-40px)] backdrop-blur-xl bg-[#1B1B1F]/98 border-2 border-[#FF6B5A] shadow-[0_12px_40px_rgba(255,107,90,0.35)] rounded-xl p-4 z-50 alert-halo"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#FF6B5A] animate-pulse" />
                <span className="font-grotesk font-bold text-xs text-[#FF8070] uppercase tracking-wider">
                  Compressed-Air Leak Detected
                </span>
              </div>
              <button
                onClick={dismissLeakAlert}
                className="text-stone-400 hover:text-white transition-all duration-150 p-1 active:scale-[0.9] rounded hover:bg-white/[0.08] cursor-pointer"
                title="Close Alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2 text-xs font-sans text-stone-300 leading-relaxed">
              <span className="text-white font-bold">{state.leakAlert.machineName}</span> is wasting ~
              <strong className="text-[#FF8070] font-mono">{state.leakAlert.cfmLoss} CFM</strong>. Header pressure drop
              observed: <span className="text-white font-mono font-bold">{state.leakAlert.pressureDropBar} bar</span>.
            </div>

            <div className="mt-3 p-2.5 rounded bg-[#141416] border border-white/[0.08] font-mono">
              <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                Est. Monetary Impact:
              </div>
              <div className="text-[#FF8070] font-bold text-base mt-0.5 font-tabular">
                ₹{state.leakAlert.costPerDayInr.toLocaleString()} / DAY{' '}
                <span className="text-stone-400 text-xs font-normal">
                  (₹{state.leakAlert.costPerMonthInr.toLocaleString()} / MO)
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 pt-2 border-t border-white/[0.08]">
              <button
                onClick={dispatchMaintenance}
                disabled={state.leakAlert.isDispatching || state.leakAlert.dispatched}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all duration-150 active:scale-[0.97] text-center border flex items-center justify-center gap-1.5 ${
                  state.leakAlert.dispatched
                    ? 'bg-[#14B8A6]/20 text-[#2DD4BF] border-[#14B8A6]/40'
                    : 'bg-[#FF6B5A] hover:bg-[#FF8070] active:bg-[#E65A4A] text-[#0B0B0D] border-[#FF6B5A] shadow-[0_0_16px_rgba(255,107,90,0.4)] cursor-pointer'
                }`}
              >
                {state.leakAlert.isDispatching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Dispatching...
                  </>
                ) : state.leakAlert.dispatched ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2DD4BF]" />
                    Dispatched
                  </>
                ) : (
                  'Dispatch Maintenance Technician'
                )}
              </button>
              <button
                onClick={dismissLeakAlert}
                className="py-2 px-3 rounded-lg bg-[#141416] hover:bg-[#222227] text-stone-300 hover:text-white text-xs font-mono transition-all duration-150 active:scale-[0.97] border border-white/[0.08] cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
