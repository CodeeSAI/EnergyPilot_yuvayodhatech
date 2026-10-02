import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'premium' | 'glass' | 'sub';
  hoverEffect?: boolean;
  glowTop?: 'teal' | 'coral' | 'gradient' | 'none';
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  variant = 'premium',
  hoverEffect = true,
  glowTop = 'none',
  children,
  className = '',
  ...props
}) => {
  const variantClass =
    variant === 'premium'
      ? 'premium-card'
      : variant === 'glass'
      ? 'glass-panel'
      : 'glass-panel-sub';

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -3, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } } : undefined}
      className={`rounded-lg overflow-hidden relative ${variantClass} ${className}`}
      {...props}
    >
      {glowTop === 'teal' && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-[#14B8A6] shadow-[0_0_12px_rgba(20,184,166,0.6)] pointer-events-none z-10" />
      )}
      {glowTop === 'coral' && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-[#FF6B5A] shadow-[0_0_12px_rgba(255,107,90,0.6)] pointer-events-none z-10" />
      )}
      {glowTop === 'gradient' && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#14B8A6] to-[#FF6B5A] shadow-[0_0_12px_rgba(255,107,90,0.5)] pointer-events-none z-10" />
      )}
      {children}
    </motion.div>
  );
};
