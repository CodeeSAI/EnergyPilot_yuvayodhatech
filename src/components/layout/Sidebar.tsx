import React from 'react';
import { NavLink } from 'react-router-dom';
import { Gauge, Cpu, Leaf, Sliders, X } from 'lucide-react';
import { useSimulator } from '../../sim';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNavClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose, onNavClick }) => {
  const { state, settings } = useSimulator();
  const hasLeak = Boolean(state.leakAlert && state.leakAlert.active);

  const navItems = [
    { name: 'Overview', path: '/', icon: Gauge },
    { name: 'Machines', path: '/machines', icon: Cpu },
    { name: 'Savings', path: '/savings', icon: Leaf },
    { name: 'Settings', path: '/settings', icon: Sliders },
  ];

  const handleLinkClick = () => {
    if (onClose) onClose();
    if (onNavClick) onNavClick();
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-60 bg-[#0B0B0D] z-50 flex flex-col justify-between border-r border-white/[0.08] select-none shadow-[4px_0_30px_rgba(0,0,0,0.6)] transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="flex flex-col">
        {/* Brand Header with Inline SVG Coral-to-Teal Logo */}
        <div className="h-16 px-space-md flex items-center justify-between border-b border-white/[0.08] bg-[#0B0B0D]">
          <div className="flex items-center gap-3">
            <svg
              className="w-8 h-8 rounded-lg shadow-[0_0_16px_rgba(255,107,90,0.35)] shrink-0"
              viewBox="0 0 32 32"
              fill="none"
            >
              <defs>
                <linearGradient id="sidebarLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF6B5A" />
                  <stop offset="100%" stopColor="#14B8A6" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#sidebarLogoGrad)" />
              {/* White energy lightning-bolt */}
              <path d="M18 4L7 17H15L14 28L25 15H17L18 4Z" fill="#FFFFFF" />
            </svg>

            <div className="flex flex-col min-w-0">
              <span className="font-grotesk font-bold text-sm tracking-tight text-white uppercase whitespace-nowrap">
                ENERGY PILOT
              </span>
              <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wide whitespace-nowrap">
                Industrial Monitoring
              </span>
            </div>
          </div>

          {/* Close button on mobile drawer */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/[0.08] cursor-pointer"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Facility Status Chip (Fixed truncation with clean untruncated plant name) */}
        <div className="p-space-md">
          <div
            title={`${settings.plantName || 'Plant 1 / Line A'} • Sector 3`}
            className="px-space-sm py-1.5 rounded bg-[#141416] border border-white/[0.08] flex items-center justify-between shadow-inner"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14B8A6]" />
              </span>
              <span className="font-mono text-[11px] text-white truncate font-medium">
                {settings.plantName || 'Plant 1 / Line A'}
              </span>
            </div>
            <span className="font-mono text-[10px] text-stone-400 shrink-0 ml-1 font-semibold">IN</span>
          </div>
        </div>

        {/* Navigation Links with Gradient Left Accent on Active State */}
        <nav className="flex flex-col gap-1 px-space-sm" id="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `relative flex items-center gap-space-sm px-space-sm py-2.5 transition-all duration-200 font-sans text-sm rounded ${
                    isActive
                      ? 'bg-[#14B8A6]/15 text-[#2DD4BF] font-semibold shadow-[0_0_16px_rgba(20,184,166,0.15)]'
                      : 'text-stone-400 hover:bg-[#14B8A6]/10 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1 bottom-1 w-1 bg-gradient-to-b from-[#FF6B5A] to-[#14B8A6] rounded-r" />
                    )}
                    <Icon className="w-[18px] h-[18px] leading-none shrink-0" />
                    <span className="font-grotesk tracking-tight">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Telemetry Loop Card with Live Status Dot */}
      <div className="p-space-md border-t border-white/[0.08] bg-[#0B0B0D]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between font-grotesk text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
            <span>Compressor Loop A</span>
            <span className="text-[#2DD4BF] font-mono font-bold tracking-tight">6.8 BAR</span>
          </div>
          <div className="font-sans text-xs text-white truncate">
            {hasLeak ? 'Air Network: Alert (Drop)' : 'Air Network: Nominal'}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-white/[0.08]">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                hasLeak
                  ? 'bg-[#FF6B5A] shadow-[0_0_8px_#FF6B5A] animate-pulse'
                  : 'bg-[#14B8A6] shadow-[0_0_8px_#14B8A6]'
              }`}
            />
            <span className="font-mono text-[10px] text-stone-400 truncate">
              {hasLeak ? '1 Leak Unresolved' : 'Telemetry sync: 12ms nominal'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
