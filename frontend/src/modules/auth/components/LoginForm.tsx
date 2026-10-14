"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import { FormField } from './FormField';
import { PasswordField } from './PasswordField';
import { useAuthStore } from '../store/useAuthStore';

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, isLoading, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      newErrors.email = 'Vui lòng nhập địa chỉ email.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = 'Địa chỉ email không đúng định dạng hợp lệ.';
      }
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate()) {
      return;
    }

    try {
      const res = await login(email.trim(), password);
      if (!res.requiresOtp) {
        onSuccess();
      }
    } catch {
      // Lỗi do store useAuthStore quản lý và hiển thị qua thông báo lỗi
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full" noValidate>
      {/* Email Field */}
      <FormField
        label="Địa chỉ Email"
        type="email"
        placeholder="tenban@greensm.vn"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
        }}
        icon={<Mail className="h-4 w-4" />}
        error={errors.email}
        disabled={isLoading}
        autoComplete="email"
        required
      />

      {/* Password Field */}
      <PasswordField
        label="Mật khẩu"
        placeholder="Nhập mật khẩu"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
        }}
        error={errors.password}
        disabled={isLoading}
        autoComplete="current-password"
        required
      />

      {/* Primary Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="
          w-full h-12 mt-3 rounded-xl bg-[#1F2627] text-[#F8F7F2] 
          font-semibold text-sm tracking-tight
          flex items-center justify-center gap-2
          hover:bg-[#121617] active:scale-[0.98]
          disabled:opacity-60 disabled:cursor-not-allowed
          transition-all duration-150 shadow-soft-sm cursor-pointer
        "
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-[#F8F7F2]" />
            <span>Đang xác thực bảo mật...</span>
          </>
        ) : (
          <>
            <span>Đăng nhập vào Workspace</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Link to Register page */}
      <div className="text-center pt-3 text-sm text-[#475254]">
        Chưa có tài khoản thành viên?{' '}
        <Link
          href="/register"
          className="text-[#1F2627] font-semibold underline underline-offset-4 hover:text-[#2D5A34] transition-colors"
        >
          Đăng ký ngay
        </Link>
      </div>
    </form>
  );
}
