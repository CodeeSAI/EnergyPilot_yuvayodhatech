import React from 'react';

export type BadgeVariant =
  | 'running'
  | 'idle'
  | 'warning'
  | 'critical'
  | 'resolved'
  | 'info'
  | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  pulse?: boolean;
  ping?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'running',
  pulse = false,
  ping = false,
  icon,
  children,
  className = '',
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'running':
      case 'resolved':
        return 'bg-[#14B8A6]/15 text-[#2DD4BF] border border-[#14B8A6]/40 shadow-[0_0_10px_rgba(20,184,166,0.2)]';
      case 'warning':
      case 'critical':
        return 'bg-[#FF6B5A]/15 text-[#FF8070] border border-[#FF6B5A]/40 shadow-[0_0_10px_rgba(255,107,90,0.2)]';
      case 'idle':
        return 'bg-stone-800/60 text-stone-400 border border-stone-600/40';
      case 'info':
      case 'neutral':
      default:
        return 'bg-[#1B1B1F] text-stone-300 border border-white/[0.08]';
    }
  };

  const getDotColor = () => {
    switch (variant) {
      case 'running':
      case 'resolved':
        return 'bg-[#14B8A6]';
      case 'idle':
        return 'bg-[#78716C]';
      case 'warning':
      case 'critical':
        return 'bg-[#FF6B5A]';
      default:
        return 'bg-[#78716C]';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold select-none ${getStyles()} ${className}`}
    >
      {(pulse || ping) && (
        <span className="relative flex h-1.5 w-1.5">
          {ping && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getDotColor()}`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${getDotColor()} ${
              pulse ? 'animate-pulse' : ''
            }`}
          />
        </span>
      )}
      {icon}
      <span>{children}</span>
    </span>
  );
};
