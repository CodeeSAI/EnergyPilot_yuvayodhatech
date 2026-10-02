import React from 'react';
import { Card } from './Card';
import { AnimatedCounter } from './AnimatedCounter';

interface StatCardProps {
  title: string;
  badgeText: string;
  badgeVariant?: 'running' | 'idle' | 'warning' | 'critical' | 'info';
  badgeIcon?: React.ReactNode;
  badgeClassName?: string;
  value: number;
  format?: 'currency' | 'integer' | 'decimal';
  unit?: string;
  prefix?: string;
  footerLeft: string;
  footerRight: string;
  footerRightHighlight?: 'teal' | 'coral' | 'slate';
  topBorder?: 'teal' | 'coral' | 'gradient' | 'none';
  glowTop?: 'teal' | 'coral' | 'none';
  hasRadialBloom?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  badgeText,
  badgeVariant = 'running',
  badgeIcon,
  badgeClassName = '',
  value,
  format = 'integer',
  unit,
  prefix,
  footerLeft,
  footerRight,
  footerRightHighlight = 'slate',
  topBorder = 'teal',
  hasRadialBloom = false,
  className = '',
}) => {
  const getBadgeStyle = () => {
    switch (badgeVariant) {
      case 'running':
        return 'bg-[#14B8A6]/15 text-[#2DD4BF] border border-[#14B8A6]/40 shadow-[0_0_10px_rgba(20,184,166,0.2)]';
      case 'critical':
      case 'warning':
        return 'bg-[#FF6B5A]/15 text-[#FF8070] border border-[#FF6B5A]/40 shadow-[0_0_10px_rgba(255,107,90,0.2)]';
      case 'idle':
        return 'bg-stone-800/60 text-stone-400 border border-stone-600/40';
      default:
        return 'bg-[#1B1B1F] text-stone-300 border border-white/[0.08]';
    }
  };

  const getFooterRightColor = () => {
    switch (footerRightHighlight) {
      case 'teal':
        return 'text-[#2DD4BF] font-bold';
      case 'coral':
        return 'text-[#FF8070] font-bold';
      default:
        return 'text-stone-400';
    }
  };

  return (
    <Card
      className={`p-space-md flex flex-col justify-between group select-none relative bg-[#141416] border border-white/[0.08] rounded-xl overflow-hidden ${className}`}
    >
      {/* Thin Colored Top Border & Soft Glow */}
      {topBorder === 'teal' && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-[#14B8A6] shadow-[0_0_14px_rgba(20,184,166,0.6)] pointer-events-none z-10" />
      )}
      {topBorder === 'coral' && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-[#FF6B5A] shadow-[0_0_14px_rgba(255,107,90,0.6)] pointer-events-none z-10" />
      )}
      {topBorder === 'gradient' && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#14B8A6] to-[#FF6B5A] shadow-[0_0_14px_rgba(255,107,90,0.5)] pointer-events-none z-10" />
      )}

      {/* Subtle Radial Bloom */}
      {hasRadialBloom && (
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[radial-gradient(ellipse_at_center,_rgba(20,184,166,0.14)_0%,_transparent_70%)] pointer-events-none" />
      )}

      {/* Header Label & Pill */}
      <div className="flex items-center justify-between gap-1.5 relative z-10">
        <span className="font-grotesk font-semibold text-xs text-stone-400 uppercase tracking-wider truncate">
          {title}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full font-mono text-[10.5px] font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 ${getBadgeStyle()} ${badgeClassName}`}
        >
          {badgeIcon}
          <span>{badgeText}</span>
        </span>
      </div>

      {/* Main Metric Value: Solid White, never fades or clips */}
      <div className="mt-4 mb-2 relative z-10 flex items-baseline gap-1">
        {prefix && (
          <span className="font-grotesk text-2xl text-[#2DD4BF] font-bold">{prefix}</span>
        )}
        <span className="font-mono font-bold tracking-tight text-white text-3xl xl:text-[34px] leading-tight font-tabular">
          <AnimatedCounter value={value} format={format} />
        </span>
        {unit && (
          <span className="font-mono text-xs text-stone-400 ml-1 font-semibold">{unit}</span>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.06] relative z-10 font-sans">
        <span className="truncate text-stone-300">{footerLeft}</span>
        <span className={`font-mono text-xs shrink-0 ml-2 ${getFooterRightColor()}`}>{footerRight}</span>
      </div>
    </Card>
  );
};
