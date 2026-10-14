"use client";

import React from 'react';
import { ShinyText } from '../react-bits/ShinyText';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'editorial' | 'outline';
  size?: 'sm' | 'md';
  shiny?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  shiny = false,
  className = '',
  ...props
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  
  const variantClasses = {
    default: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    success: 'bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1]',
    warning: 'bg-[#FAF2E8] text-[#8C6239] border border-[#EEDFCD]',
    danger: 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
    info: 'bg-[#E6F0F7] text-[#2A5778] border border-[#C6D9E8]',
    editorial: 'bg-[#F2EFE8] text-[#1F2627] border border-[#E5E3DC]',
    outline: 'bg-transparent text-[#5A6466] border border-[#E5E3DC]',
  }[variant];

  const content = shiny && typeof children === 'string' ? (
    <ShinyText text={children} className="font-semibold" />
  ) : (
    children
  );

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full font-mono transition-colors ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {content}
    </span>
  );
};
