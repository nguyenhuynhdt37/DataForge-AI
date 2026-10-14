"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { 
  User, 
  Camera, 
  Check, 
  RotateCcw, 
  Briefcase, 
  Mail, 
  ShieldCheck, 
  Upload, 
  AlertCircle,
  Zap,
  Cpu
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../services/authApi';
import { Button } from '@/shared/components/ui/Button';
import { FormField } from './FormField';
import { compressAvatarImage, formatBytes } from '@/shared/utils';

export const ProfileInfoSection: React.FC = () => {
  const { user, updateUser } = useAuthStore();

  // State thông tin form
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [title, setTitle] = useState(user?.title || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  // State Avatar & Preview & Compression
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    savedPercentage: number;
    dimensions: string;
  } | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarErrorMessage, setAvatarErrorMessage] = useState<string | null>(null);
  const [avatarSuccessMessage, setAvatarSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Đồng bộ state khi store user thay đổi
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setTitle(user.title || '');
    }
  }, [user]);

  // Giải phóng URL preview khi component unmount hoặc thay đổi ảnh
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // Tính toán Initials viết tắt tên
  const initials = useMemo(() => {
    if (!user) return 'DF';
    if (user.full_name) {
      const parts = user.full_name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'DF';
  }, [user]);

  // Kiểm tra Dirty State (phát hiện form có thay đổi so với dữ liệu gốc)
  const isDirty = useMemo(() => {
    const originalFullName = user?.full_name || '';
    const originalTitle = user?.title || '';
    return fullName.trim() !== originalFullName.trim() || title.trim() !== originalTitle.trim();
  }, [fullName, title, user]);

  const isFormValid = useMemo(() => {
    return fullName.trim().length >= 2;
  }, [fullName]);

  // Reset form về trạng thái ban đầu
  const handleResetForm = () => {
    setFullName(user?.full_name || '');
    setTitle(user?.title || '');
    setFormErrorMessage(null);
    setFormSuccessMessage(null);
  };

  // Xử lý chọn file ảnh mới và tự động nén tối ưu ở Client
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarErrorMessage(null);
    setAvatarSuccessMessage(null);
    setCompressionStats(null);

    // Validate MIME types
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.type.startsWith('image/')) {
      setAvatarErrorMessage('Định dạng ảnh không hỗ trợ. Vui lòng tải file định dạng .JPG, .PNG hoặc .WEBP.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Bắt đầu quy trình nén ảnh tự động bằng HTML5 Canvas Client-side
    setIsCompressing(true);
    try {
      const result = await compressAvatarImage(file, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.85,
        format: 'image/webp',
        cropSquare: true,
      });

      // Giải phóng blob URL cũ nếu có
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }

      setAvatarFile(result.file);
      setAvatarPreview(result.previewUrl);
      setCompressionStats({
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        savedPercentage: result.savedPercentage,
        dimensions: `${result.width}x${result.height}px`,
      });
    } catch (err: any) {
      console.error('Lỗi khi nén ảnh client-side:', err);
      setAvatarErrorMessage(
        err?.message || 'Không thể xử lý hoặc nén ảnh trên thiết bị của bạn. Vui lòng thử lại với ảnh khác.'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsCompressing(false);
    }
  };

  // Hủy ảnh đang preview
  const handleCancelAvatarPreview = () => {
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setCompressionStats(null);
    setAvatarErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload Avatar lên MinIO S3 qua API
  const handleUploadAvatar = async () => {
    if (!avatarFile) return;

    setIsUploadingAvatar(true);
    setAvatarErrorMessage(null);
    setAvatarSuccessMessage(null);

    try {
      const res = await authApi.uploadAvatar(avatarFile);
      if (res.data) {
        // Cập nhật store ngay lập tức để AppHeader & UserMenuDropdown đồng bộ
        updateUser({
          avatar_url: res.data.avatar_url,
        });
        setAvatarSuccessMessage('Ảnh đại diện đã được cập nhật và lưu trữ thành công trên MinIO S3.');
        // Dọn dẹp preview
        if (avatarPreview && avatarPreview.startsWith('blob:')) {
          URL.revokeObjectURL(avatarPreview);
        }
        setAvatarFile(null);
        setAvatarPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Lỗi tải ảnh đại diện:', err);
      setAvatarErrorMessage(
        err?.message || 'Không thể tải ảnh đại diện lên máy chủ. Vui lòng thử lại sau.'
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Submit cập nhật thông tin họ tên & chức vụ
  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty || !isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setFormErrorMessage(null);
    setFormSuccessMessage(null);

    try {
      const res = await authApi.updateProfile({
        full_name: fullName.trim(),
        title: title.trim() || undefined,
      });

      if (res.data) {
        updateUser({
          full_name: res.data.full_name,
          title: res.data.title,
        });
        setFormSuccessMessage('Hồ sơ cá nhân đã được lưu thành công.');
      }
    } catch (err: any) {
      console.error('Lỗi cập nhật hồ sơ:', err);
      setFormErrorMessage(
        err?.message || 'Không thể cập nhật hồ sơ cá nhân. Vui lòng kiểm tra lại kết nối.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDisplayAvatar = avatarPreview || user?.avatar_url;

  return (
    <div className="space-y-6">
      {/* KHỐI 1: AVATAR UPLOADER */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#FDFCFA] border border-[#E5E3DC] shadow-soft-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-[#ECEAE2]">
          <div className="flex items-center gap-5">
            {/* Vùng hiển thị Avatar */}
            <div className="relative group shrink-0">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-[#E5E3DC] bg-[#FAF9F5] shadow-soft flex items-center justify-center">
                {currentDisplayAvatar ? (
                  <Image
                    src={currentDisplayAvatar}
                    alt={user?.full_name || 'Avatar'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold font-editorial text-[#2D5A34]">
                    {initials}
                  </span>
                )}
              </div>

              {/* Nút bấm Camera Overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-[#2D5A34] text-white hover:bg-[#234629] border-2 border-white shadow-soft transition-all duration-150 cursor-pointer disabled:opacity-50"
                title="Thay đổi ảnh đại diện"
                aria-label="Thay đổi ảnh đại diện"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-[#1F2627] font-editorial">
                    Ảnh đại diện cá nhân
                  </h3>
                  {isCompressing && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <Cpu className="w-3 h-3 animate-spin" />
                      ĐANG NÉN & TỐI ƯU...
                    </span>
                  )}
                  {avatarPreview && !isCompressing && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#FAF2E8] text-[#8C6239] border border-[#EEDFCD]">
                      BẢN XEM TRƯỚC
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#5A6466] leading-relaxed max-w-sm">
                  Ảnh được nén và cắt vuông 512x512 tự động bằng HTML5 Canvas trước khi tải lên máy chủ MinIO S3.
                </p>

                {/* Badge Thống kê tối ưu hóa dung lượng */}
                {compressionStats && (
                  <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1]">
                      <Zap className="w-3 h-3" />
                      <span>{formatBytes(compressionStats.originalSize)}</span>
                      <span>→</span>
                      <span className="font-bold">{formatBytes(compressionStats.compressedSize)}</span>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-[#2D5A34] text-white">
                        -{compressionStats.savedPercentage}%
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Hành động khi có Preview ảnh mới */}
            {avatarPreview && (
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="editorial"
                  size="sm"
                  onClick={handleCancelAvatarPreview}
                  disabled={isUploadingAvatar || isCompressing}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleUploadAvatar}
                  disabled={isCompressing}
                  isLoading={isUploadingAvatar}
                  icon={<Upload className="w-3.5 h-3.5" />}
                >
                  {compressionStats
                    ? `Tải lên S3 (${formatBytes(compressionStats.compressedSize)})`
                    : 'Tải lên S3'}
                </Button>
              </div>
            )}
          </div>

        {/* Thông báo trạng thái Avatar */}
        {avatarErrorMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{avatarErrorMessage}</span>
          </div>
        )}
        {avatarSuccessMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[#E8F0EA] border border-[#CDE0D1] text-xs text-[#2D5A34] flex items-center gap-2.5">
            <Check className="w-4 h-4 shrink-0 font-bold" />
            <span>{avatarSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* KHỐI 2: FORM THÔNG TIN HỌ TÊN, EMAIL & CHỨC VỤ */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#FDFCFA] border border-[#E5E3DC] shadow-soft-sm">
        <div className="mb-6 pb-4 border-b border-[#ECEAE2]">
          <h3 className="text-base font-bold text-[#1F2627] font-editorial">
            Thông tin định danh & Chức vụ
          </h3>
          <p className="text-xs text-[#5A6466] mt-0.5">
            Các trường thông tin sẽ hiển thị công khai trên giao diện gán nhãn HITL Studio và báo cáo dự án.
          </p>
        </div>

        <form onSubmit={handleSubmitProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Họ và tên */}
            <FormField
              label="Họ và tên đầy đủ"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setFormSuccessMessage(null);
              }}
              placeholder="Ví dụ: Nguyễn Văn A"
              icon={<User className="w-4 h-4" />}
              error={
                fullName.trim().length > 0 && fullName.trim().length < 2
                  ? 'Họ và tên tối thiểu 2 ký tự'
                  : undefined
              }
            />

            {/* Chức danh công việc */}
            <FormField
              label="Chức danh / Vị trí đảm nhiệm"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setFormSuccessMessage(null);
              }}
              placeholder="Ví dụ: AI Engineer / Senior Annotator"
              icon={<Briefcase className="w-4 h-4" />}
            />
          </div>

          {/* Email (Read-only có badge Verified) */}
          <div className="flex flex-col gap-2 w-full text-left">
            <label className="text-sm font-semibold text-[#1F2627] tracking-tight flex items-center justify-between">
              <span>Địa chỉ Email tài khoản</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1]">
                <ShieldCheck className="w-3 h-3" />
                ĐÃ XÁC THỰC OTP
              </span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-[#5A6466] pointer-events-none flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                disabled
                className="w-full h-12 rounded-xl bg-[#FAF9F5] border border-[#E5E3DC] pl-11 pr-4 text-sm font-mono text-[#5A6466] cursor-not-allowed select-all"
              />
            </div>
            <p className="text-[11px] text-[#5A6466]/80 font-mono">
              Email dùng làm tài khoản đăng nhập chính thức và không thể thay đổi trực tiếp.
            </p>
          </div>

          {/* Thông báo lỗi / thành công form */}
          {formErrorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formErrorMessage}</span>
            </div>
          )}
          {formSuccessMessage && (
            <div className="p-3.5 rounded-2xl bg-[#E8F0EA] border border-[#CDE0D1] text-xs text-[#2D5A34] flex items-center gap-2.5">
              <Check className="w-4 h-4 shrink-0 font-bold" />
              <span>{formSuccessMessage}</span>
            </div>
          )}

          {/* Thanh hành động (Dirty State Detection) */}
          <div className="flex items-center justify-between pt-4 border-t border-[#ECEAE2]">
            <div className="text-xs font-mono text-[#5A6466]">
              {isDirty ? (
                <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
                  Có thay đổi chưa lưu
                </span>
              ) : (
                <span className="text-[#7FA086] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#7FA086] inline-block" />
                  Dữ liệu đã đồng bộ
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isDirty && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetForm}
                  disabled={isSubmitting}
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Khôi phục
                </Button>
              )}

              <Button
                type="submit"
                variant="secondary"
                size="md"
                disabled={!isDirty || !isFormValid || isSubmitting}
                isLoading={isSubmitting}
                icon={<Check className="w-4 h-4" />}
              >
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
