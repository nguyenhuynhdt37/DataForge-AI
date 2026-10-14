"use client";

import React, { useState, forwardRef, InputHTMLAttributes } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { FormField } from './FormField';

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <FormField
        ref={ref}
        label={label}
        error={error}
        type={showPassword ? 'text' : 'password'}
        icon={<Lock className="h-4 w-4" />}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="p-1 rounded-md text-[#777B78] hover:text-[#30383A] hover:bg-[#F3EACB]/50 transition-colors focus:outline-none"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        }
        {...props}
      />
    );
  }
);

PasswordField.displayName = 'PasswordField';
