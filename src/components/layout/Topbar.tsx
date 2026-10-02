import React from 'react';
import { Download, Bell, User, Menu } from 'lucide-react';
import { Button } from '../common/Button';
import { useSimulator } from '../../sim';
import { exportTelemetryCsv } from '../../utils/exportCsv';

interface TopbarProps {
  facilityName?: string;
  subLocation?: string;
  shift?: string;
  unit?: string;
  onMenuToggle?: () => void;
  onExport?: () => void;
  onNotificationClick?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  facilityName,
  subLocation,
  shift,
  unit = 'Compressed Air & Motors',
  onMenuToggle,
  onExport,
  onNotificationClick,
}) => {
  const { state, settings } = useSimulator();
  const activeShift = shift || state.shiftString.split(' ')[0] + ' ' + (state.shiftString.split(' ')[1] || 'B');
  const hasLeak = Boolean(state.leakAlert && state.leakAlert.active);

  const plantParts = (settings.plantName || 'Plant 1 / Line A').split('/');
  const facName = facilityName || plantParts[0]?.trim() || 'Plant 1';
  const subLoc = subLocation || plantParts[1]?.trim() || 'Line A';

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      exportTelemetryCsv(state.history24h, settings.plantName, state.shiftString);
    }
  };

  return (
    <header className="sticky top-0 h-16 backdrop-blur-md bg-[#0B0B0D]/90 border-b border-white/[0.08] z-30 px-4 lg:px-space-lg flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      {/* Mobile Drawer Toggle + Breadcrumb Subpath */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg bg-[#141416] border border-white/[0.08] text-stone-300 hover:text-white"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 font-sans text-xs text-stone-400">
          <span className="text-[#F5F5F4] font-semibold truncate">{facName}</span>
          <span className="opacity-40">/</span>
          <span className="truncate text-stone-300">{subLoc}</span>
        </div>
        <span className="hidden sm:inline-block h-3 w-px bg-white/[0.12]" />
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#141416] border border-white/[0.08]">
          <span className="font-mono text-[11px] text-[#FF8070] font-bold uppercase tracking-wider">
            {activeShift}
          </span>
          <span className="text-stone-500 text-[11px]">•</span>
          <span className="font-mono text-[11px] text-stone-300 truncate">
            {unit}
          </span>
        </div>
      </div>

      {/* Live Telemetry Status Banner (Shown on wide viewports 2xl+ to avoid crowding at 1280px) */}
      <div className="hidden 2xl:flex items-center gap-space-sm px-space-md py-1.5 rounded-full bg-[#141416] border border-[#14B8A6]/30 shadow-inner shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14B8A6]" />
        </span>
        <span className="font-mono text-[11px] text-[#2DD4BF] tracking-wide uppercase font-bold whitespace-nowrap">
          Live Telemetry • Latency 240ms • 50.04 Hz Grid
        </span>
      </div>

      {/* Quick Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-space-md shrink-0">
        <Button
          variant="secondary"
          size="sm"
          icon={<Download className="w-3.5 h-3.5 text-[#2DD4BF]" />}
          onClick={handleExport}
          className="hidden sm:inline-flex font-mono"
        >
          Export Telemetry
        </Button>

        <button
          onClick={onNotificationClick || (() => {})}
          className="relative p-2 rounded-lg hover:bg-[#1B1B1F] text-stone-300 hover:text-white transition-all duration-150 active:scale-[0.97] cursor-pointer"
          title={hasLeak ? '1 Active Air Leak Alert' : 'All systems nominal'}
        >
          <Bell className="w-5 h-5 leading-none" />
          {hasLeak && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6B5A] ring-2 ring-[#0B0B0D] animate-pulse" />
          )}
        </button>

        <div className="flex items-center gap-2.5 pl-2 border-l border-white/[0.08] shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#1B1B1F] border border-[#14B8A6]/40 flex items-center justify-center text-[#2DD4BF] shadow-sm overflow-hidden shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:flex flex-col text-left shrink-0">
            <span className="font-sans text-xs font-semibold leading-none text-white whitespace-nowrap">
              R. Kulkarni
            </span>
            <span className="font-grotesk text-[10px] text-[#2DD4BF] uppercase tracking-wide font-semibold mt-0.5 whitespace-nowrap">
              Energy Manager
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
