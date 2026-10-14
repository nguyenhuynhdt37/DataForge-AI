"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  ExternalLink, 
  Unlink, 
  Loader2, 
  AlertTriangle, 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Clock, 
  Server,
  RefreshCw,
  KeyRound,
  Check,
  X
} from 'lucide-react';
import { UserProfile, CvatDetailedProfileResponse, CvatTokenCheckResponse } from '@/modules/auth/types';
import { authApi } from '@/modules/auth/services/authApi';
import { CVAT_CONFIG } from '@/shared/lib/constants';
import { useAuthStore } from '@/shared/lib/authStore';

interface CvatConnectedViewProps {
  currentUser: UserProfile;
  onDisconnect: () => Promise<boolean>;
  onClose: () => void;
  loading: boolean;
  isDark?: boolean;
}

export const CvatConnectedView: React.FC<CvatConnectedViewProps> = ({
  currentUser,
  onDisconnect,
  onClose,
  loading,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [cvatDetail, setCvatDetail] = useState<CvatDetailedProfileResponse | null>(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);

  // Trạng thái kiểm tra (Ping) token hiện tại
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ active: boolean; message: string; latency_ms?: number | null } | null>(null);

  // Trạng thái cập nhật Token mới (Rotate Token)
  const [showRotateForm, setShowRotateForm] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [checkingNewToken, setCheckingNewToken] = useState(false);
  const [savingNewToken, setSavingNewToken] = useState(false);
  const [checkResult, setCheckResult] = useState<CvatTokenCheckResponse | null>(null);
  const [rotateError, setRotateError] = useState<string | null>(null);
  const [rotateSuccess, setRotateSuccess] = useState<string | null>(null);

  const { updateUser } = useAuthStore();

  // Tự động tải thông tin chi tiết thời gian thực từ CVAT Host
  const fetchCvatLiveProfile = async () => {
    setFetchingDetail(true);
    try {
      const res = await authApi.getCvatProfile();
      if (res.data && res.data.connected) {
        setCvatDetail(res.data);
      }
    } catch (err) {
      console.warn("Không thể đồng bộ realtime CVAT profile, sử dụng cache:", err);
    } finally {
      setFetchingDetail(false);
    }
  };

  useEffect(() => {
    fetchCvatLiveProfile();
  }, [currentUser.cvat_user_id]);

  // Kiểm tra tình trạng sống của token hiện tại
  const handlePingToken = async () => {
    setPinging(true);
    setPingResult(null);
    try {
      const res = await authApi.pingCvatToken();
      setPingResult(res.data);
    } catch (err: any) {
      setPingResult({
        active: false,
        message: err.message || "Không thể kiểm tra token với máy chủ CVAT"
      });
    } finally {
      setPinging(false);
    }
  };

  // Kiểm tra token mới trước khi lưu (Check xem có đúng cùng tài khoản không)
  const handleCheckNewToken = async () => {
    if (!newToken.trim()) return;
    setCheckingNewToken(true);
    setCheckResult(null);
    setRotateError(null);
    setRotateSuccess(null);

    try {
      const res = await authApi.checkCvatToken({ cvat_token: newToken.trim() });
      setCheckResult(res.data);
      if (!res.data.valid) {
        setRotateError(res.data.message);
      }
    } catch (err: any) {
      setRotateError(err.message || "Lỗi khi kiểm tra token mới với máy chủ CVAT");
    } finally {
      setCheckingNewToken(false);
    }
  };

  // Lưu token mới vào hệ thống
  const handleSaveNewToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToken.trim()) return;
    setSavingNewToken(true);
    setRotateError(null);
    setRotateSuccess(null);

    try {
      const res = await authApi.updateCvatToken({ cvat_token: newToken.trim() });
      setRotateSuccess(res.message || "Đã cập nhật mã Token mới thành công!");
      
      // Cập nhật lại store
      updateUser({
        cvat_user_id: res.data.cvat_user_id,
        cvat_username: res.data.cvat_username,
        cvat_email: res.data.cvat_email,
        cvat_first_name: res.data.cvat_first_name,
        cvat_last_name: res.data.cvat_last_name,
        cvat_groups: res.data.cvat_groups,
        cvat_is_staff: res.data.cvat_is_staff,
      });

      // Tải lại realtime profile
      await fetchCvatLiveProfile();
      
      setTimeout(() => {
        setShowRotateForm(false);
        setNewToken('');
        setCheckResult(null);
        setRotateSuccess(null);
      }, 1500);
    } catch (err: any) {
      setRotateError(err.message || "Không thể cập nhật token mới");
    } finally {
      setSavingNewToken(false);
    }
  };

  const handleConfirmDisconnect = async () => {
    const success = await onDisconnect();
    if (success) {
      setShowConfirm(false);
    }
  };

  // Trích xuất dữ liệu ưu tiên: Realtime > Cached currentUser
  const username = cvatDetail?.cvat_username || currentUser.cvat_username || "annotator";
  const userId = cvatDetail?.cvat_user_id ?? currentUser.cvat_user_id ?? "--";
  const email = cvatDetail?.cvat_email || currentUser.cvat_email || "Chưa thiết lập";
  const firstName = cvatDetail?.cvat_first_name || currentUser.cvat_first_name || "";
  const lastName = cvatDetail?.cvat_last_name || currentUser.cvat_last_name || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || currentUser.full_name || username;
  const isStaff = cvatDetail?.cvat_is_staff ?? currentUser.cvat_is_staff ?? false;
  const isSuperuser = cvatDetail?.cvat_is_superuser ?? false;
  const groups = cvatDetail?.cvat_groups?.length 
    ? cvatDetail.cvat_groups 
    : (currentUser.cvat_groups || ["user"]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const formattedLastLogin = formatDate(cvatDetail?.cvat_last_login);
  const formattedDateJoined = formatDate(cvatDetail?.cvat_date_joined);

  return (
    <div className="space-y-4 text-left">
      {/* Thẻ Header Kết Nối Xanh Diệp Lục Soft Pastel */}
      <div className="p-4 rounded-2xl border border-[#B7CDBB] bg-[#E8F0EA] text-[#2D5A34] shadow-soft-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D5A34] text-white flex items-center justify-center font-bold text-sm shadow-soft-sm shrink-0">
              {username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-[#1F2627]">
                  @{username}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/80 border border-[#B7CDBB] text-[#2D5A34] font-bold">
                  ID #{userId}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2D5A34]">
                  KHO GÁN NHÃN ĐANG KẾT NỐI TRỰC TIẾP
                </span>
                {fetchingDetail && <Loader2 className="w-3 h-3 animate-spin text-[#2D5A34] ml-1" />}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePingToken}
              disabled={pinging}
              title="Kiểm tra tình trạng sống của mã Token hiện tại"
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-white hover:bg-[#F2EFE9] border border-[#B7CDBB] text-[#2D5A34] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pinging ? 'animate-spin' : ''}`} />
              <span>{pinging ? 'Đang check...' : 'Kiểm tra Token'}</span>
            </button>

            <a
              href={CVAT_CONFIG.BASE_URL}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-[#2D5A34] hover:bg-[#234629] text-white shadow-soft-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>Mở Workspace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Thông báo kết quả Ping Token */}
        {pingResult && (
          <div className={`mt-3 p-2.5 rounded-xl text-xs font-mono flex items-center justify-between border ${
            pingResult.active 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50/80 border-rose-200 text-rose-800'
          }`}>
            <span className="flex items-center gap-1.5">
              {pingResult.active ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
              <span>{pingResult.message}</span>
            </span>
            {pingResult.latency_ms && (
              <span className="font-bold shrink-0">{pingResult.latency_ms}ms</span>
            )}
          </div>
        )}
      </div>

      {/* Thẻ Chi Tiết Toàn Diện Hồ Sơ CVAT (Detailed Profile Matrix) */}
      <div className="p-4 rounded-2xl border border-[#ECEAE2] bg-[#FAF9F5] space-y-3">
        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7677] flex items-center justify-between border-b border-[#ECEAE2] pb-2">
          <span className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-[#2D5A34]" />
            <span>Thông Tin Chi Tiết Trên CVAT Host</span>
          </span>
          <span className="font-mono text-[#2D5A34] font-semibold">{CVAT_CONFIG.HOSTNAME}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {/* Tên hiển thị CVAT */}
          <div className="p-2.5 rounded-xl bg-white border border-[#E5E3DC] flex items-center gap-2.5">
            <User className="w-4 h-4 text-[#7FA086] shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-[#6B7677] block font-medium">Họ và Tên CVAT</span>
              <span className="font-bold text-[#1F2627] truncate block">{fullName}</span>
            </div>
          </div>

          {/* Email CVAT */}
          <div className="p-2.5 rounded-xl bg-white border border-[#E5E3DC] flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-[#7FA086] shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-[#6B7677] block font-medium">Email Liên Kết</span>
              <span className="font-mono text-[#1F2627] truncate block">{email}</span>
            </div>
          </div>

          {/* Phân quyền & Nhóm */}
          <div className="p-2.5 rounded-xl bg-white border border-[#E5E3DC] flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-[#7FA086] shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-[#6B7677] block font-medium">Phân Quyền / Vai Trò</span>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="px-1.5 py-0.5 rounded-md bg-[#E8F0EA] text-[#2D5A34] font-bold text-[10px] font-mono">
                  {isSuperuser ? "Superuser" : isStaff ? "Staff Admin" : "Annotator"}
                </span>
                {groups.map((grp) => (
                  <span key={grp} className="px-1.5 py-0.5 rounded-md bg-[#F4F2EC] text-[#5A6466] text-[10px] font-mono">
                    {grp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Lần đăng nhập gần nhất */}
          <div className="p-2.5 rounded-xl bg-white border border-[#E5E3DC] flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-[#7FA086] shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-[#6B7677] block font-medium">Đăng Nhập Gần Nhất</span>
              <span className="font-mono text-[#1F2627] truncate block">
                {formattedLastLogin || "Đang trực tuyến"}
              </span>
            </div>
          </div>
        </div>

        {formattedDateJoined && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#6B7677] font-mono pt-1">
            <Calendar className="w-3.5 h-3.5 text-[#7FA086]" />
            <span>Ngày tạo tài khoản trên CVAT: {formattedDateJoined}</span>
          </div>
        )}
      </div>

      {/* Form Cập Nhật / Đổi Token Mới (Token Rotation Accordion) */}
      <div className="p-3.5 rounded-2xl border border-[#ECEAE2] bg-white space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setShowRotateForm(!showRotateForm);
              setCheckResult(null);
              setRotateError(null);
              setRotateSuccess(null);
            }}
            className="text-xs font-semibold text-[#1F2627] hover:text-[#2D5A34] flex items-center gap-1.5 transition cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#2D5A34]" />
            <span>Cập nhật mã Token mới (Rotate Token)?</span>
            <span className="text-[10px] font-mono text-[#5A6466]">({showRotateForm ? 'Ẩn' : 'Mở rộng'})</span>
          </button>
        </div>

        {showRotateForm && (
          <form onSubmit={handleSaveNewToken} className="space-y-3 pt-2 border-t border-[#ECEAE2]">
            <p className="text-[11px] text-[#5A6466] leading-relaxed">
              Nếu bạn vừa tạo mã Personal Access Token mới trên CVAT, hãy dán vào đây. Hệ thống sẽ kiểm tra xem token mới có cùng thuộc về tài khoản <strong>@{username} (#{userId})</strong> không trước khi cập nhật.
            </p>

            <div className="space-y-2">
              <div className="relative">
                <input
                  type="password"
                  placeholder="Dán mã Token mới (Ví dụ: Yn27Ucr0.TAI1...)"
                  value={newToken}
                  onChange={(e) => {
                    setNewToken(e.target.value);
                    setCheckResult(null);
                    setRotateError(null);
                  }}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#D5D2C8] bg-[#FAF9F5] text-xs font-mono placeholder:text-[#5A6466]/60 focus:border-[#7FA086] focus:ring-2 focus:ring-[#7FA086]/20 outline-none"
                  required
                />
              </div>

              {/* Thông báo kết quả Check Token Mới */}
              {checkResult && (
                <div className={`p-2.5 rounded-xl text-xs font-mono border ${
                  checkResult.valid && checkResult.is_same_account
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : checkResult.is_linked_to_other
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <div className="flex items-start gap-1.5">
                    {checkResult.valid && checkResult.is_same_account ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="leading-relaxed">
                      <strong>{checkResult.message}</strong>
                      {checkResult.valid && (
                        <div className="text-[10px] mt-0.5 opacity-80">
                          Chủ sở hữu token: @{checkResult.cvat_username} (#{checkResult.cvat_user_id}) — {checkResult.cvat_email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {rotateError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
                  {rotateError}
                </div>
              )}

              {rotateSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{rotateSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCheckNewToken}
                  disabled={checkingNewToken || !newToken.trim()}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F4F2EC] hover:bg-[#EAE7DF] text-[#1F2627] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {checkingNewToken && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Kiểm tra trước</span>
                </button>

                <button
                  type="submit"
                  disabled={savingNewToken || !newToken.trim()}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#2D5A34] hover:bg-[#234629] text-white shadow-soft-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingNewToken && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Lưu Token Mới</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Cảnh báo / Xác nhận hủy liên kết */}
      {showConfirm ? (
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="block font-semibold">Xác nhận ngắt kết nối CVAT?</strong>
              Hệ thống sẽ xóa mã token truy cập CVAT đã liên kết. Bạn sẽ cần nhập lại thông tin để tiếp tục đồng bộ tác vụ dán nhãn.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl hover:bg-rose-100 text-rose-700 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirmDisconnect}
              disabled={loading}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Đồng ý ngắt kết nối</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-2 border-t border-[#ECEAE2]">
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={loading}
            className="text-xs font-semibold px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Unlink className="w-3.5 h-3.5" />
            <span>Hủy liên kết tài khoản này</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-bold rounded-xl bg-[#1F2627] hover:bg-[#121617] text-[#F8F7F2] transition-all shadow-soft-sm cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  );
};
