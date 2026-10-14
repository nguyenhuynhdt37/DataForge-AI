"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Laptop, 
  Smartphone, 
  Globe, 
  ShieldCheck, 
  LogOut, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  MapPin, 
  AlertCircle, 
  Check 
} from 'lucide-react';
import { UserSession } from '../types';
import { authApi } from '../services/authApi';
import { Button } from '@/shared/components/ui/Button';
import { Modal } from '@/shared/components/ui/Modal';
import { Skeleton } from '@/shared/components/ui/Skeleton';

export const SessionManagementSection: React.FC = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State Modal xác nhận thu hồi
  const [sessionToRevoke, setSessionToRevoke] = useState<UserSession | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Fetch danh sách phiên làm việc
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authApi.getSessions();
      if (res.data) {
        setSessions(res.data);
      }
    } catch (err: any) {
      console.error('Lỗi lấy danh sách phiên:', err);
      setErrorMessage(
        err?.message || 'Không thể tải danh sách phiên đăng nhập. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Phân tích User-Agent để lấy thông tin thiết bị và hệ điều hành
  const parseUserAgent = (uaString?: string | null) => {
    if (!uaString) {
      return {
        deviceType: 'desktop',
        browser: 'Trình duyệt Web',
        os: 'Hệ điều hành không xác định',
      };
    }

    const isMobile = /mobile|android|iphone|ipad|ipod/i.test(uaString);
    let browser = 'Trình duyệt Web';
    if (/edg/i.test(uaString)) browser = 'Microsoft Edge';
    else if (/chrome|crios/i.test(uaString)) browser = 'Google Chrome';
    else if (/firefox|fxios/i.test(uaString)) browser = 'Mozilla Firefox';
    else if (/safari/i.test(uaString)) browser = 'Apple Safari';
    else if (/opera|opr/i.test(uaString)) browser = 'Opera';

    let os = 'Hệ điều hành';
    if (/macintosh|mac os x/i.test(uaString)) os = 'macOS';
    else if (/windows/i.test(uaString)) os = 'Windows';
    else if (/linux/i.test(uaString)) os = 'Linux';
    else if (/android/i.test(uaString)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(uaString)) os = 'iOS';

    return {
      deviceType: isMobile ? 'mobile' : 'desktop',
      browser,
      os,
    };
  };

  // Định dạng ngày giờ chuẩn tiếng Việt
  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return 'Gần đây';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // Thực hiện thu hồi phiên làm việc
  const handleConfirmRevoke = async () => {
    if (!sessionToRevoke) return;

    setIsRevoking(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await authApi.revokeSession(sessionToRevoke.id);
      setSessions((prev) => prev.filter((s) => s.id !== sessionToRevoke.id));
      setSuccessMessage('Đã thu hồi phiên đăng nhập thành công. Thiết bị đó sẽ bị ngắt kết nối ngay lập tức.');
      setSessionToRevoke(null);
    } catch (err: any) {
      console.error('Lỗi thu hồi phiên:', err);
      setErrorMessage(
        err?.message || 'Không thể thu hồi phiên làm việc. Vui lòng thử lại sau.'
      );
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 sm:p-7 rounded-3xl bg-[#FDFCFA] border border-[#E5E3DC] shadow-soft-sm">
        {/* Header Mục Quản Lý Phiên */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#ECEAE2]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1]">
                QUẢN LÝ PHIÊN LÀM VIỆC
              </span>
            </div>
            <h3 className="text-base font-bold text-[#1F2627] font-editorial">
              Thiết bị & Phiên đăng nhập đang hoạt động
            </h3>
            <p className="text-xs text-[#5A6466] leading-relaxed max-w-lg">
              Theo dõi tất cả các thiết bị đang đăng nhập tài khoản của bạn. Bạn có thể chủ động thu hồi phiên làm việc của các thiết bị lạ từ xa.
            </p>
          </div>

          <Button
            type="button"
            variant="editorial"
            size="sm"
            onClick={fetchSessions}
            disabled={isLoading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Làm mới
          </Button>
        </div>

        {/* Thông báo kết quả */}
        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[#E8F0EA] border border-[#CDE0D1] text-xs text-[#2D5A34] flex items-center gap-2.5">
            <Check className="w-4 h-4 shrink-0 font-bold" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Danh sách các phiên đăng nhập */}
        <div className="mt-6 space-y-3.5">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl border border-[#ECEAE2] bg-[#FAF9F5] flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="w-40 h-4 rounded" />
                      <Skeleton className="w-28 h-3 rounded" />
                    </div>
                  </div>
                  <Skeleton className="w-24 h-8 rounded-xl" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-[#D5D2C8] bg-[#FAF9F5] text-xs text-[#5A6466]">
              Không tìm thấy phiên làm việc nào đang hoạt động.
            </div>
          ) : (
            sessions.map((session, index) => {
              const { deviceType, browser, os } = parseUserAgent(session.user_agent);
              // Phiên hiện tại là session.is_current hoặc session đầu tiên nếu chưa set
              const isCurrentSession = Boolean(session.is_current || index === 0);

              return (
                <div
                  key={session.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isCurrentSession
                      ? 'bg-[#FAF9F5] border-[#CDE0D1] shadow-soft-sm'
                      : 'bg-white border-[#E5E3DC] hover:border-[#B7CDBB]'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 border ${
                        isCurrentSession
                          ? 'bg-[#E8F0EA] text-[#2D5A34] border-[#CDE0D1]'
                          : 'bg-[#FAF9F5] text-[#5A6466] border-[#ECEAE2]'
                      }`}
                    >
                      {deviceType === 'mobile' ? (
                        <Smartphone className="w-5 h-5" />
                      ) : (
                        <Laptop className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#1F2627]">
                          {browser} trên {os}
                        </span>
                        {isCurrentSession && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A34] animate-pulse inline-block" />
                            PHIÊN HIỆN TẠI NÀY
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono text-[#5A6466] flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#7FA086]" />
                          IP: {session.ip_address || 'Địa chỉ cục bộ'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#7FA086]" />
                          Đăng nhập: {formatDateTime(session.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hành động */}
                  <div>
                    {isCurrentSession ? (
                      <span className="text-xs font-mono text-[#2D5A34] font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E8F0EA]/70">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Đang bảo vệ
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSessionToRevoke(session)}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                        icon={<LogOut className="w-3.5 h-3.5" />}
                      >
                        Thu hồi phiên
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL XÁC NHẬN THU HỒI PHIÊN */}
      <Modal
        isOpen={Boolean(sessionToRevoke)}
        onClose={() => !isRevoking && setSessionToRevoke(null)}
        title="Xác nhận thu hồi phiên làm việc"
        description="Thiết bị này sẽ bị đăng xuất ngay lập tức và không còn quyền truy cập dữ liệu."
      >
        {sessionToRevoke && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DC] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#5A6466]">Thiết bị:</span>
                <span className="font-bold text-[#1F2627]">
                  {parseUserAgent(sessionToRevoke.user_agent).browser} trên{' '}
                  {parseUserAgent(sessionToRevoke.user_agent).os}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5A6466]">Địa chỉ IP:</span>
                <span className="font-mono text-[#1F2627]">
                  {sessionToRevoke.ip_address || 'Không xác định'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5A6466]">Thời gian đăng nhập:</span>
                <span className="font-mono text-[#1F2627]">
                  {formatDateTime(sessionToRevoke.created_at)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECEAE2]">
              <Button
                type="button"
                variant="editorial"
                size="sm"
                onClick={() => setSessionToRevoke(null)}
                disabled={isRevoking}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleConfirmRevoke}
                isLoading={isRevoking}
                icon={<LogOut className="w-3.5 h-3.5" />}
              >
                Xác nhận thu hồi
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
