"use client";

import React from 'react';

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  displayValue?: string | number;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  displayValue,
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  className = '',
  ...props
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {(label || displayValue !== undefined) && (
        <div className="flex justify-between items-center text-xs">
          {label && <span className="font-medium text-[#475254] font-sans">{label}</span>}
          {displayValue !== undefined && (
            <span className="font-mono font-bold text-[#1F2627]">{displayValue}</span>
          )}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full h-1.5 bg-[#E5E3DC] rounded-lg appearance-none cursor-pointer accent-[#2D5A34] focus:outline-none"
        {...props}
      />
    </div>
  );
};
