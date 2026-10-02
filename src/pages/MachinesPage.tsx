import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  Search,
  Zap,
  Activity,
  ArrowRight,
  Wind,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useSimulator } from '../sim';

export const MachinesPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useSimulator();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'running' | 'idle' | 'leaks'>('ALL');

  const allMachines = useMemo(() => Object.values(state.machines), [state.machines]);

  const filteredMachines = useMemo(() => {
    return allMachines.filter((m) => {
      const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subType.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [allMachines, statusFilter, searchQuery]);

  const totalCapacityKw = useMemo(
    () => allMachines.reduce((sum, m) => sum + m.ratingKw, 0),
    [allMachines]
  );
  const liveDrawKw = useMemo(
    () => allMachines.reduce((sum, m) => sum + m.powerKw, 0),
    [allMachines]
  );
  const runningCount = useMemo(
    () => allMachines.filter((m) => m.status === 'running').length,
    [allMachines]
  );
  const leaksCount = useMemo(
    () => allMachines.filter((m) => m.status === 'leaks').length,
    [allMachines]
  );

  return (
    <div className="flex flex-col gap-6 select-none max-w-[1600px] mx-auto w-full">
      {/* 1. Header & Summary Strip */}
      <Card variant="glass" className="relative p-6 flex flex-col xl:flex-row xl:items-end justify-between gap-5 overflow-hidden">
        <div className="relative z-10 flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#2DD4BF] tracking-widest uppercase font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-[#14B8A6] shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
            <span>Industrial Fleet Telemetry</span>
            <span className="text-white/30">•</span>
            <span className="text-stone-400">Rotary Screws, Blowers &amp; Motors</span>
          </div>

          <h1 className="font-grotesk text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">
            Machine Assets &amp; Field Nodes
          </h1>
          <p className="text-xs text-stone-400 font-sans">
            Continuous CT meter synchronization, line pressure transmitters &amp; high-frequency vibration sensors
          </p>
        </div>

        {/* Quick Fleet Summary KPIs */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <div className="bg-[#1B1B1F] border border-white/[0.08] px-3.5 py-2 rounded-lg flex items-center gap-3 font-mono">
            <div className="w-8 h-8 rounded-md bg-[#14B8A6]/15 border border-[#14B8A6]/30 flex items-center justify-center text-[#2DD4BF]">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-400 uppercase">Live Fleet Draw</span>
              <span className="text-white font-bold text-sm tabular-nums">
                {liveDrawKw.toFixed(1)} / {totalCapacityKw} kW
              </span>
            </div>
          </div>

          <div className="bg-[#1B1B1F] border border-white/[0.08] px-3.5 py-2 rounded-lg flex items-center gap-3 font-mono">
            <div className="w-8 h-8 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#2DD4BF]">
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-400 uppercase">Active Running</span>
              <span className="text-[#2DD4BF] font-bold text-sm tabular-nums">
                {runningCount} of {allMachines.length}
              </span>
            </div>
          </div>

          {leaksCount > 0 && (
            <div className="bg-[#FF6B5A]/15 border border-[#FF6B5A]/40 px-3.5 py-2 rounded-lg flex items-center gap-3 font-mono">
              <div className="w-8 h-8 rounded-md bg-[#FF6B5A]/20 flex items-center justify-center text-[#FF8070]">
                <Wind className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#FF8070] uppercase font-bold">Active Issues</span>
                <span className="text-[#FF8070] font-bold text-sm tabular-nums">
                  {leaksCount} Anomaly Flag
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#141416] p-3 rounded-xl border border-white/[0.08]">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by tag, name, or location (e.g. CMP-01, Screw, House A)..."
            className="w-full bg-[#1B1B1F] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-xs font-sans text-white placeholder-stone-500 focus:outline-none focus:border-[#14B8A6] transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto font-mono text-xs">
          <span className="text-stone-400 text-[11px] uppercase mr-1">Status:</span>
          {(
            [
              { key: 'ALL', label: `All (${allMachines.length})` },
              {
                key: 'running',
                label: `Running (${allMachines.filter((m) => m.status === 'running').length})`,
              },
              {
                key: 'idle',
                label: `Idle (${allMachines.filter((m) => m.status === 'idle').length})`,
              },
              {
                key: 'leaks',
                label: `Issues (${allMachines.filter((m) => m.status === 'leaks').length})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all active:scale-[0.97] cursor-pointer whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-[#14B8A6]/20 border border-[#14B8A6] text-[#2DD4BF] shadow-[0_0_12px_rgba(20,184,166,0.25)]'
                  : 'text-stone-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Machine Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredMachines.map((m) => {
          const isLeak = m.status === 'leaks';
          const loadPercent = Math.min(100, (m.powerKw / m.ratingKw) * 100);

          return (
            <Card
              key={m.id}
              variant="glass"
              glowTop={isLeak ? 'coral' : m.status === 'running' ? 'teal' : 'none'}
              className="p-5 flex flex-col justify-between gap-4 group hover:border-[#14B8A6]/40 transition-all cursor-pointer relative"
              onClick={() => navigate(`/machines/${m.id}`)}
            >
              <div className="flex flex-col gap-3">
                {/* Card Top: Tag + Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-[#1B1B1F] border border-white/[0.08]">
                      {m.tag}
                    </span>
                    <span className="font-mono text-[10px] text-stone-400 uppercase truncate">
                      {m.subType}
                    </span>
                  </div>
                  <Badge
                    variant={m.status === 'running' ? 'running' : m.status === 'idle' ? 'idle' : 'critical'}
                    pulse={m.status === 'running'}
                    ping={isLeak}
                  >
                    {m.statusLabel}
                  </Badge>
                </div>

                {/* Machine Name & Location */}
                <div>
                  <h3 className="font-grotesk text-base font-bold text-white group-hover:text-[#2DD4BF] transition-colors leading-tight">
                    {m.name}
                  </h3>
                  <span className="font-mono text-xs text-stone-400 mt-0.5 block">
                    Location: {m.location}
                  </span>
                </div>

                {/* Machine Loading Bar */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-stone-400 text-[11px]">Load Factor</span>
                    <span className="text-white font-bold">{loadPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#1B1B1F] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isLeak
                          ? 'bg-[#FF6B5A] shadow-[0_0_8px_#FF6B5A]'
                          : m.status === 'idle'
                          ? 'bg-stone-500'
                          : 'bg-[#14B8A6] shadow-[0_0_8px_#14B8A6]'
                      }`}
                      style={{ width: `${loadPercent}%` }}
                    />
                  </div>
                </div>

                {/* 4 Core Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] font-mono text-xs">
                  <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04] flex flex-col">
                    <span className="text-[10px] text-stone-400 uppercase">Power Draw</span>
                    <span className="text-white font-bold mt-0.5 tabular-nums">
                      {m.powerKw.toFixed(1)} <span className="text-stone-400 text-[10px] font-normal">kW</span>
                    </span>
                  </div>

                  <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04] flex flex-col">
                    <span className="text-[10px] text-stone-400 uppercase">Line Pressure</span>
                    <span
                      className={`font-bold mt-0.5 tabular-nums ${
                        isLeak ? 'text-[#FF8070]' : 'text-[#2DD4BF]'
                      }`}
                    >
                      {m.pressureBar.toFixed(2)} <span className="text-stone-400 text-[10px] font-normal">bar</span>
                    </span>
                  </div>

                  <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04] flex flex-col">
                    <span className="text-[10px] text-stone-400 uppercase">Airflow</span>
                    <span className="text-white font-bold mt-0.5 tabular-nums">
                      {m.flowCfm} <span className="text-stone-400 text-[10px] font-normal">CFM</span>
                    </span>
                  </div>

                  <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04] flex flex-col">
                    <span className="text-[10px] text-stone-400 uppercase">Efficiency</span>
                    <span
                      className={`font-bold mt-0.5 tabular-nums ${
                        isLeak ? 'text-[#FF8070]' : 'text-white'
                      }`}
                    >
                      {m.efficiency.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-stone-400">
                  Rating: {m.ratingKw} kW ({m.ratingHp} HP)
                </span>
                <span className="font-grotesk font-semibold text-[#2DD4BF] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Diagnostics <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredMachines.length === 0 && (
        <Card variant="glass" className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <Cpu className="w-12 h-12 text-stone-500" />
          <h3 className="font-grotesk text-lg font-bold text-white">No Matching Machines Found</h3>
          <p className="text-xs text-stone-400 max-w-md">
            No industrial equipment matched your search term "{searchQuery}". Clear your search query or reset the status filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
            className="mt-2 px-3 py-1.5 rounded-lg bg-[#14B8A6]/20 border border-[#14B8A6] text-[#2DD4BF] text-xs font-mono font-semibold"
          >
            Reset Filters
          </button>
        </Card>
      )}
    </div>
  );
};
