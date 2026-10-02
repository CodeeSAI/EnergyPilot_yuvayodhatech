import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useSimulator } from '../../sim';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { dispatchToast, clearDispatchToast } = useSimulator();

  return (
    <div className="bg-[#0B0B0D] text-[#F5F5F4] min-h-screen relative overflow-x-hidden">
      {/* Background Soft Radial Glows: faint coral top-right, faint teal bottom-left */}
      <div
        className="fixed top-0 right-0 w-[550px] h-[550px] rounded-full blur-[140px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(255, 107, 90, 0.07) 0%, transparent 70%)' }}
      />
      <div
        className="fixed bottom-0 left-60 w-[550px] h-[550px] rounded-full blur-[140px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(20, 184, 166, 0.07) 0%, transparent 70%)' }}
      />

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar with responsive slide-in on mobile */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="pl-0 lg:pl-60 min-h-screen flex flex-col relative z-10 transition-all">
        <Topbar onMenuToggle={() => setMobileMenuOpen((prev) => !prev)} />
        <main className="relative w-full px-4 lg:px-space-lg py-space-lg flex-1 pb-44">
          <Outlet />
        </main>
      </div>

      {/* Dispatch Confirmation Toast Banner */}
      {dispatchToast && (
        <div className="fixed top-20 right-4 lg:right-8 z-50 max-w-md w-[calc(100%-32px)] p-4 rounded-xl bg-[#141416]/95 border-2 border-[#14B8A6] shadow-[0_12px_40px_rgba(20,184,166,0.35)] backdrop-blur-xl flex items-center justify-between gap-3 animate-fade-lift">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#14B8A6]/20 border border-[#14B8A6]/50 flex items-center justify-center text-[#2DD4BF] shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col font-mono text-xs">
              <span className="font-bold text-white uppercase tracking-wider">
                Work Order Dispatched
              </span>
              <span className="text-[#2DD4BF] font-sans mt-0.5 leading-snug">
                {dispatchToast}
              </span>
            </div>
          </div>
          <button
            onClick={clearDispatchToast}
            className="p-1 rounded text-stone-400 hover:text-white hover:bg-white/[0.08] shrink-0 cursor-pointer"
            title="Dismiss Toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
