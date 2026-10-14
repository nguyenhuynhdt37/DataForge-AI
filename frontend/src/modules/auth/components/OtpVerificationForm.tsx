"use client";

import React, { useState, useEffect, useRef } from 'react';
import { KeyRound, ArrowRight, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface OtpVerificationFormProps {
  onSuccess: () => void;
}

export function OtpVerificationForm({ onSuccess }: OtpVerificationFormProps) {
  const { 
    verifyOtp, 
    resendOtp, 
    isLoading, 
    pendingEmail, 
    clearError, 
    cancelOtp 
  } = useAuthStore();

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setTimeout(() => {
      otpRefs.current[0]?.focus();
    }, 150);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    const digit = cleanVal.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pasted.length, 5);
    otpRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) return;

    try {
      const success = await verifyOtp(fullOtp);
      if (success) {
        onSuccess();
      }
    } catch {
      // Caught in store
    }
  };

  const handleResend = async () => {
    if (!canResend || isLoading) return;
    setResendSuccess(false);
    clearError();
    const success = await resendOtp();
    if (success) {
      setResendSuccess(true);
      setCanResend(false);
      setCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      setTimeout(() => setResendSuccess(false), 5000);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {/* Thông tin thiết bị mới */}
      <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E3DC] flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-[#E8F0EA] flex items-center justify-center text-[#4E7756] shrink-0">
          <KeyRound className="h-4 w-4" />
        </div>
        <div className="text-xs overflow-hidden">
          <div className="text-[#6B7677]">Mã xác thực gửi về hòm thư:</div>
          <div className="font-semibold text-[#303A3B] truncate">{pendingEmail}</div>
        </div>
      </div>

      {resendSuccess && (
        <div className="p-3 rounded-xl bg-[#E8F0EA] border border-[#D5E4D8] text-xs text-[#4E7756] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Mã OTP mới đã được gửi về hòm thư của bạn!</span>
        </div>
      )}

      {/* 6 Ô OTP Inputs Soft Editorial */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#1F2627] block text-center">
          Nhập mã xác thực gồm 6 số:
        </label>
        
        <div className="flex justify-between gap-2 pt-1" onPaste={handleOtpPaste}>
          {otpDigits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { otpRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(idx, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
              className={`w-12 h-14 sm:w-13 sm:h-16 text-center font-mono text-2xl font-bold rounded-xl border transition-all focus:outline-none ${
                digit 
                  ? 'border-[#7FA086] bg-[#E8F0EA] text-[#1F2627] shadow-soft-sm' 
                  : 'border-[#D5D2C8] bg-white text-[#1F2627] focus:border-[#7FA086] focus:ring-4 focus:ring-[#7FA086]/20'
              }`}
            />
          ))}
        </div>

        <p className="text-xs text-[#475254] text-center mt-2 font-medium">
          Mã xác thực có hiệu lực trong vòng 5 phút.
        </p>
      </div>

      <button 
        type="submit"
        disabled={isLoading || otpDigits.join('').length < 6}
        className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1F2627] hover:bg-[#121617] px-6 text-sm font-semibold text-[#F8F7F2] shadow-soft-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isLoading ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin text-[#F8F7F2]" />
            <span>Đang xác nhận mã OTP...</span>
          </>
        ) : (
          <>
            <span>Xác nhận & Vào hệ thống</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-2 text-xs">
        <button
          type="button"
          onClick={cancelOtp}
          className="text-[#475254] hover:text-[#1F2627] flex items-center gap-1.5 transition-colors cursor-pointer font-medium py-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Đổi tài khoản khác
        </button>

        <button
          type="button"
          disabled={!canResend || isLoading}
          onClick={handleResend}
          className="text-[#2D5A34] hover:underline disabled:text-[#475254]/50 disabled:cursor-not-allowed transition-colors cursor-pointer font-semibold py-1"
        >
          {canResend ? (
            "Gửi lại mã OTP"
          ) : (
            `Gửi lại sau (${countdown}s)`
          )}
        </button>
      </div>
    </form>
  );
}
