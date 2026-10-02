import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#FF6B5A] hover:bg-[#FF8070] active:bg-[#E65A4A] text-[#0B0B0D] font-bold shadow-[0_0_16px_rgba(255,107,90,0.35)] border border-[#FF6B5A]';
      case 'secondary':
        return 'bg-transparent hover:bg-[#14B8A6]/10 active:bg-[#14B8A6]/20 border border-[#14B8A6] text-[#2DD4BF] font-semibold shadow-[0_0_12px_rgba(20,184,166,0.15)]';
      case 'danger':
        return 'bg-[#FF6B5A]/15 hover:bg-[#FF6B5A]/25 border border-[#FF6B5A]/40 text-[#FF8070] font-semibold shadow-[0_0_14px_rgba(255,107,90,0.2)]';
      case 'ghost':
        return 'bg-transparent hover:bg-white/[0.06] text-stone-300 hover:text-white';
      case 'outline':
      default:
        return 'bg-transparent border border-white/[0.12] hover:border-[#14B8A6] text-stone-300 hover:text-[#2DD4BF]';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2.5 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2.5 text-sm font-semibold';
      case 'md':
      default:
        return 'px-3 py-1.5 text-xs';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`inline-flex items-center justify-center gap-1.5 rounded font-sans transition-all duration-150 select-none cursor-pointer ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </motion.button>
  );
};
