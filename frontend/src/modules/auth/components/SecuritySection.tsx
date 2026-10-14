"use client";

import React, { useState, useMemo } from 'react';
import { 
  KeyRound, 
  Check, 
  ShieldAlert, 
  ShieldCheck, 
  AlertCircle, 
  Lock 
} from 'lucide-react';
import { authApi } from '../services/authApi';
import { Button } from '@/shared/components/ui/Button';
import { PasswordField } from './PasswordField';

export const SecuritySection: React.FC = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Đánh giá độ mạnh mật khẩu nhẹ nhàng
  const passwordStrength = useMemo(() => {
    if (!newPassword) return null;
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (newPassword.length >= 12) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 2) return { label: 'Yếu', color: 'bg-rose-500', text: 'text-rose-600', percent: '33%' };
    if (score <= 3) return { label: 'Trung bình', color: 'bg-amber-500', text: 'text-amber-700', percent: '66%' };
    return { label: 'Mạnh mẽ', color: 'bg-[#2D5A34]', text: 'text-[#2D5A34]', percent: '100%' };
  }, [newPassword]);

  // Kiểm tra tính hợp lệ
  const isFormValid = useMemo(() => {
    const isOldValid = oldPassword.trim().length > 0;
    const isNewValid = newPassword.length >= 8;
    const isMatch = newPassword === confirmPassword;
    return isOldValid && isNewValid && isMatch;
  }, [oldPassword, newPassword, confirmPassword]);

  // Xử lý gửi form đổi mật khẩu
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    if (newPassword === oldPassword) {
      setErrorMessage('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await authApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });

      if (res.data?.success) {
        setSuccessMessage('Đổi mật khẩu thành công. Các phiên làm việc khác trên các thiết bị đã được thu hồi an toàn.');
        // Xóa trắng form sau khi đổi thành công
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      console.error('Lỗi đổi mật khẩu:', err);
      setErrorMessage(
        err?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 sm:p-7 rounded-3xl bg-[#FDFCFA] border border-[#E5E3DC] shadow-soft-sm">
        <div className="flex items-start justify-between pb-6 border-b border-[#ECEAE2]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1]">
                BẢO MẬT TÀI KHOẢN
              </span>
            </div>
            <h3 className="text-base font-bold text-[#1F2627] font-editorial">
              Đổi mật khẩu đăng nhập
            </h3>
            <p className="text-xs text-[#5A6466] leading-relaxed max-w-lg">
              Mật khẩu cần tối thiểu 8 ký tự. Để đảm bảo an toàn tuyệt đối, sau khi đổi mật khẩu, hệ thống sẽ tự động thu hồi phiên đăng nhập trên các thiết bị khác.
            </p>
          </div>

          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DC] text-[#2D5A34] shrink-0">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="mt-6 space-y-5">
          {/* Mật khẩu hiện tại */}
          <PasswordField
            label="Mật khẩu hiện tại"
            required
            value={oldPassword}
            onChange={(e) => {
              setOldPassword(e.target.value);
              setErrorMessage(null);
            }}
            placeholder="Nhập mật khẩu đang dùng"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Mật khẩu mới */}
            <div className="space-y-2">
              <PasswordField
                label="Mật khẩu mới (tối thiểu 8 ký tự)"
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Nhập mật khẩu mới"
                error={
                  newPassword.length > 0 && newPassword.length < 8
                    ? 'Mật khẩu mới phải có ít nhất 8 ký tự'
                    : undefined
                }
              />

              {/* Password Strength Indicator */}
              {passwordStrength && (
                <div className="pt-1 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#5A6466]">Độ bảo mật:</span>
                    <span className={`font-bold ${passwordStrength.text}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#ECEAE2] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: passwordStrength.percent }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div>
              <PasswordField
                label="Xác nhận mật khẩu mới"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Nhập lại mật khẩu mới"
                error={
                  confirmPassword.length > 0 && confirmPassword !== newPassword
                    ? 'Mật khẩu xác nhận không trùng khớp'
                    : undefined
                }
              />
              {confirmPassword.length > 0 && confirmPassword === newPassword && (
                <p className="text-xs text-[#2D5A34] font-medium tracking-tight mt-1.5 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Mật khẩu khớp chính xác
                </p>
              )}
            </div>
          </div>

          {/* Thông báo trạng thái */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-[#E8F0EA] border border-[#CDE0D1] text-xs text-[#2D5A34] flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 font-bold" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Nút hành động */}
          <div className="flex items-center justify-end pt-4 border-t border-[#ECEAE2]">
            <Button
              type="submit"
              variant="secondary"
              size="md"
              disabled={!isFormValid || isSubmitting}
              isLoading={isSubmitting}
              icon={<KeyRound className="w-4 h-4" />}
            >
              Cập nhật mật khẩu
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
