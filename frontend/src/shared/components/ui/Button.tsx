"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
import { StarBorder } from '../react-bits/StarBorder';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'editorial';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  magnetic?: boolean;
  magnetPadding?: number;
  starBorder?: boolean;
  starColor?: string;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  magnetic = false,
  magnetPadding = 8,
  starBorder = false,
  starColor = '#B7CDBB',
  icon,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2 text-sm rounded-xl gap-2',
    lg: 'px-6 py-2.5 text-base rounded-xl gap-2.5',
  }[size];

  const variantClasses = {
    primary: 'bg-[#1F2627] hover:bg-[#121617] text-[#F8F7F2] border border-[#303A3B] shadow-soft-sm hover:shadow-soft-md active:scale-[0.98]',
    secondary: 'bg-[#E8F0EA] hover:bg-[#D8E7DC] text-[#2D5A34] border border-[#CDE0D1] shadow-soft-sm hover:shadow-soft active:scale-[0.98]',
    editorial: 'bg-[#FAF9F5] hover:bg-[#F2EFE8] text-[#1F2627] border border-[#E5E3DC] hover:border-[#B7CDBB] shadow-soft-sm hover:shadow-soft active:scale-[0.98]',
    outline: 'bg-transparent border border-[#D5D2C8] text-[#1F2627] hover:bg-black/[0.03] active:scale-[0.98]',
    ghost: 'bg-transparent text-[#475254] hover:text-[#1F2627] hover:bg-black/5 active:scale-[0.98]',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 shadow-soft-sm hover:shadow-soft active:scale-[0.98]',
  }[variant];

  const isBtnDisabled = disabled || isLoading;

  const baseButton = (
    <button
      className={`inline-flex items-center justify-center font-medium font-sans transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${sizeClasses} ${variantClasses} ${className}`}
      disabled={isBtnDisabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );

  // Áp dụng hiệu ứng StarBorder viền sáng nếu bật
  if (starBorder && !isBtnDisabled) {
    return (
      <StarBorder color={starColor} speed="4s" className="inline-block">
        {baseButton}
      </StarBorder>
    );
  }

  return baseButton;
};
