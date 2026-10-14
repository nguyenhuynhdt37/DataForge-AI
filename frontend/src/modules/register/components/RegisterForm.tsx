"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { registerApi } from '../services/registerApi';

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      errors.fullName = 'Vui lòng nhập họ và tên của bạn.';
    } else if (trimmedName.length < 2) {
      errors.fullName = 'Họ và tên phải có ít nhất 2 ký tự.';
    }

    if (!trimmedEmail) {
      errors.email = 'Vui lòng nhập địa chỉ email.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = 'Địa chỉ email không đúng định dạng hợp lệ.';
      }
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu.';
    } else if (password.length < 8) {
      errors.password = 'Mật khẩu phải chứa ít nhất 8 ký tự.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerApi.register({
        full_name: fullName.trim(),
        email: email.trim(),
        password: password,
        title: 'Chuyên viên Gán nhãn & MLOps',
      });

      console.log('✅ [FE API SUCCESS] Đăng ký thành công:', res);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 1800);
    } catch (err: any) {
      console.error('❌ [FE API ERROR] Lỗi đăng ký:', err);
      setApiError(err.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="py-10 text-center space-y-4 animate-in fade-in duration-300">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#E8F0EA] border border-[#CDE0D1] flex items-center justify-center text-[#2D5A34] shadow-soft-sm">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-[#1F2627] font-editorial">
            Khởi tạo Tài khoản Hoàn tất
          </h3>
          <p className="text-sm text-[#475254] max-w-sm mx-auto leading-relaxed">
            Tài khoản <span className="font-semibold text-[#1F2627]">{email}</span> đã được ghi nhận vào hệ thống. Đang chuyển hướng bạn tới trang đăng nhập...
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#2D5A34] hover:underline"
          >
            <span>Đến trang Đăng nhập ngay</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full" noValidate>
      {/* API Error Banner */}
      {apiError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in font-semibold">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1 leading-relaxed">{apiError}</div>
        </div>
      )}

      {/* Full Name Field */}
      <div className="space-y-1.5 text-left">
        <label className="text-sm font-semibold text-[#1F2627] flex items-center justify-between">
          <span>Họ và tên</span>
          <span className="text-rose-600 text-sm font-bold">*</span>
        </label>
        <div className="relative flex items-center">
          <User className="absolute left-3.5 h-4 w-4 text-[#475254] pointer-events-none" />
          <input
            type="text"
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
            }}
            disabled={isLoading}
            autoComplete="name"
            className={`w-full h-12 pl-11 pr-4 rounded-xl bg-white border text-sm font-medium text-[#1F2627] placeholder:text-[#5A6466]/70 transition-all outline-none focus:ring-4 ${
              fieldErrors.fullName
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-[#D5D2C8] focus:border-[#7FA086] focus:ring-[#7FA086]/20'
            }`}
          />
        </div>
        {fieldErrors.fullName && (
          <p className="text-xs text-rose-600 font-medium pl-1">{fieldErrors.fullName}</p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-1.5 text-left">
        <label className="text-sm font-semibold text-[#1F2627] flex items-center justify-between">
          <span>Địa chỉ Email</span>
          <span className="text-rose-600 text-sm font-bold">*</span>
        </label>
        <div className="relative flex items-center">
          <Mail className="absolute left-3.5 h-4 w-4 text-[#475254] pointer-events-none" />
          <input
            type="email"
            placeholder="tenban@greensm.vn"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            disabled={isLoading}
            autoComplete="email"
            className={`w-full h-12 pl-11 pr-4 rounded-xl bg-white border text-sm font-medium text-[#1F2627] placeholder:text-[#5A6466]/70 transition-all outline-none focus:ring-4 ${
              fieldErrors.email
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-[#D5D2C8] focus:border-[#7FA086] focus:ring-[#7FA086]/20'
            }`}
          />
        </div>
        {fieldErrors.email && (
          <p className="text-xs text-rose-600 font-medium pl-1">{fieldErrors.email}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-1.5 text-left">
        <label className="text-sm font-semibold text-[#1F2627] flex items-center justify-between">
          <span>Mật khẩu</span>
          <span className="text-rose-600 text-sm font-bold">*</span>
        </label>
        <div className="relative flex items-center">
          <Lock className="absolute left-3.5 h-4 w-4 text-[#475254] pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Tối thiểu 8 ký tự"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            disabled={isLoading}
            autoComplete="new-password"
            className={`w-full h-12 pl-11 pr-11 rounded-xl bg-white border text-sm font-medium text-[#1F2627] placeholder:text-[#5A6466]/70 transition-all outline-none focus:ring-4 ${
              fieldErrors.password
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-[#D5D2C8] focus:border-[#7FA086] focus:ring-[#7FA086]/20'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3.5 p-1 rounded text-[#475254] hover:text-[#1F2627] transition-colors cursor-pointer"
            tabIndex={-1}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="text-xs text-rose-600 font-medium pl-1">{fieldErrors.password}</p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-1.5 text-left">
        <label className="text-sm font-semibold text-[#1F2627] flex items-center justify-between">
          <span>Xác nhận mật khẩu</span>
          <span className="text-rose-600 text-sm font-bold">*</span>
        </label>
        <div className="relative flex items-center">
          <Lock className="absolute left-3.5 h-4 w-4 text-[#475254] pointer-events-none" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            disabled={isLoading}
            autoComplete="new-password"
            className={`w-full h-12 pl-11 pr-11 rounded-xl bg-white border text-sm font-medium text-[#1F2627] placeholder:text-[#5A6466]/70 transition-all outline-none focus:ring-4 ${
              fieldErrors.confirmPassword
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-[#D5D2C8] focus:border-[#7FA086] focus:ring-[#7FA086]/20'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3.5 p-1 rounded text-[#475254] hover:text-[#1F2627] transition-colors cursor-pointer"
            tabIndex={-1}
            aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiển thị mật khẩu xác nhận'}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p className="text-xs text-rose-600 font-medium pl-1">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      {/* Primary Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="
          w-full h-12 mt-2 rounded-xl bg-[#1F2627] text-[#F8F7F2] 
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
            <span>Đang gửi yêu cầu đăng ký...</span>
          </>
        ) : (
          <>
            <span>Tạo tài khoản DataForge AI</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Switch to Login link */}
      <div className="text-center pt-2 text-sm text-[#475254]">
        Đã có tài khoản thành viên?{' '}
        <Link
          href="/login"
          className="text-[#1F2627] font-semibold underline underline-offset-4 hover:text-[#2D5A34] transition-colors"
        >
          Đăng nhập ngay
        </Link>
      </div>
    </form>
  );
}
