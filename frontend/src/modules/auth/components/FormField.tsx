"use client";

import React, { forwardRef, InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, icon, rightElement, id, className = "", ...props }, ref) => {
    const inputId = id || props.name || label.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-2 w-full text-left">
        <label 
          htmlFor={inputId} 
          className="text-sm font-semibold text-[#1F2627] tracking-tight flex items-center justify-between"
        >
          <span>{label}</span>
          {props.required && <span className="text-rose-600 font-bold text-sm">*</span>}
        </label>
        
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-[#475254] pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={`
              w-full h-12 rounded-xl bg-white border 
              ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-[#D5D2C8] focus:border-[#7FA086] focus:ring-[#7FA086]/25'}
              ${icon ? 'pl-11' : 'pl-4'}
              ${rightElement ? 'pr-11' : 'pr-4'}
              text-sm font-medium text-[#1F2627] placeholder:text-[#5A6466]/70 
              transition-all duration-150 outline-none
              focus:ring-4 focus:bg-white
              disabled:opacity-60 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3.5 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-rose-700 font-medium tracking-tight mt-0.5 animate-in fade-in-50 duration-150">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
