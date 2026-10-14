"use client";

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ExternalLink, 
  Unlink, 
  Check, 
  AlertCircle, 
  User, 
  Server, 
  ShieldCheck, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Info,
  HelpCircle,
  Mail,
  Shield,
  Calendar,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../services/authApi';
import { CvatDetailedProfileResponse, CvatTokenCheckResponse } from '../types';
import { Button } from '@/shared/components/ui/Button';
import { Modal } from '@/shared/components/ui/Modal';
import { FormField } from './FormField';
import { PasswordField } from './PasswordField';
import { triggerConfettiFireworks } from '@/shared/utils';
import { CVAT_CONFIG } from '@/shared/lib/constants';

type CvatConnectMethod = 'credentials' | 'token';

export const CvatIntegrationSection: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const cvatBaseUrl = CVAT_CONFIG.BASE_URL;

  // Tab phương thức liên kết
  const [connectMethod, setConnectMethod] = useState<CvatConnectMethod>('credentials');

  // State phương thức 1: Đăng nhập Username & Password
  const [cvatUsername, setCvatUsername] = useState('');
  const [cvatPassword, setCvatPassword] = useState('');
  const [isConnectingCreds, setIsConnectingCreds] = useState(false);

  // State phương thức 2: Personal Access Token (PAT)
  const [cvatToken, setCvatToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isConnectingToken, setIsConnectingToken] = useState(false);

  // State thông báo chung
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State Modal hủy liên kết
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Dữ liệu chi tiết tài khoản CVAT Host (Realtime hoặc Cache)
  const [cvatDetail, setCvatDetail] = useState<CvatDetailedProfileResponse | null>(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);

  // Trạng thái kiểm tra (Ping) token hiện tại
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ active: boolean; message: string; latency_ms?: number | null } | null>(null);

  // Trạng thái cập nhật Token mới (Rotate Token)
  const [showRotateForm, setShowRotateForm] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [showNewToken, setShowNewToken] = useState(false);
  const [checkingNewToken, setCheckingNewToken] = useState(false);
  const [savingNewToken, setSavingNewToken] = useState(false);
  const [checkResult, setCheckResult] = useState<CvatTokenCheckResponse | null>(null);
  const [rotateError, setRotateError] = useState<string | null>(null);
  const [rotateSuccess, setRotateSuccess] = useState<string | null>(null);

  const isConnected = Boolean(user?.cvat_username || user?.cvat_user_id);

  // Tự động tải thông tin chi tiết thời gian thực từ CVAT Host
  const fetchCvatLiveProfile = async () => {
    if (!isConnected) return;
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
    if (isConnected) {
      fetchCvatLiveProfile();
    }
  }, [user?.cvat_user_id, isConnected]);

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

  // Kiểm tra token mới trước khi lưu (Kiểm tra xem có cùng tài khoản không)
  const handleCheckNewToken = async () => {
    const val = newToken.trim();
    if (!val) return;
    setCheckingNewToken(true);
    setCheckResult(null);
    setRotateError(null);
    setRotateSuccess(null);

    try {
      const res = await authApi.checkCvatToken({ cvat_token: val });
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
    const val = newToken.trim();
    if (!val || savingNewToken) return;

    setSavingNewToken(true);
    setRotateError(null);
    setRotateSuccess(null);

    try {
      const res = await authApi.updateCvatToken({ cvat_token: val });
      setRotateSuccess(res.message || "Đã cập nhật mã Token mới thành công!");
      
      // Cập nhật lại store
      updateUser({
        cvat_username: res.data.cvat_username,
        cvat_user_id: res.data.cvat_user_id,
        cvat_email: res.data.cvat_email,
        cvat_first_name: res.data.cvat_first_name,
        cvat_last_name: res.data.cvat_last_name,
        cvat_groups: res.data.cvat_groups,
        cvat_is_staff: res.data.cvat_is_staff,
        is_first_login: false,
      });

      triggerConfettiFireworks();

      // Tải lại realtime profile
      await fetchCvatLiveProfile();
      
      setTimeout(() => {
        setShowRotateForm(false);
        setNewToken('');
        setCheckResult(null);
        setRotateSuccess(null);
      }, 2000);
    } catch (err: any) {
      setRotateError(err.message || "Không thể cập nhật token mới");
    } finally {
      setSavingNewToken(false);
    }
  };

  // 1. Xử lý kết nối CVAT bằng tài khoản & mật khẩu
  const handleConnectCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvatUsername.trim() || !cvatPassword || isConnectingCreds) return;

    setIsConnectingCreds(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await authApi.loginWithCvatCredentials({
        username: cvatUsername.trim(),
        password: cvatPassword,
      });

      if (res.data) {
        updateUser({
          cvat_username: res.data.cvat_username,
          cvat_user_id: res.data.cvat_user_id,
          cvat_email: res.data.cvat_email,
          cvat_first_name: res.data.cvat_first_name,
          cvat_last_name: res.data.cvat_last_name,
          cvat_groups: res.data.cvat_groups,
          cvat_is_staff: res.data.cvat_is_staff,
          is_first_login: false,
        });

        // Bắn pháo hoa ăn mừng kết nối thành công
        triggerConfettiFireworks();

        setSuccessMessage(
          `Đã liên kết thành công với tài khoản CVAT: @${res.data.cvat_username} (#${res.data.cvat_user_id})`
        );
        setCvatUsername('');
        setCvatPassword('');
        await fetchCvatLiveProfile();
      }
    } catch (err: any) {
      console.error('Lỗi liên kết CVAT bằng tài khoản:', err);
      setErrorMessage(
        err?.message || 'Không thể liên kết với máy chủ CVAT. Vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setIsConnectingCreds(false);
    }
  };

  // 2. Xử lý kết nối CVAT bằng Personal Access Token (PAT)
  const handleConnectToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const tokenVal = cvatToken.trim();
    if (!tokenVal || isConnectingToken) return;

    if (tokenVal.length < 10) {
      setErrorMessage('Mã Personal Access Token phải có độ dài tối thiểu 10 ký tự.');
      return;
    }

    setIsConnectingToken(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await authApi.updateCvatToken({
        cvat_token: tokenVal,
      });

      if (res.data) {
        updateUser({
          cvat_username: res.data.cvat_username,
          cvat_user_id: res.data.cvat_user_id,
          cvat_email: res.data.cvat_email,
          cvat_first_name: res.data.cvat_first_name,
          cvat_last_name: res.data.cvat_last_name,
          cvat_groups: res.data.cvat_groups,
          cvat_is_staff: res.data.cvat_is_staff,
          is_first_login: false,
        });

        // Bắn pháo hoa ăn mừng kết nối thành công
        triggerConfettiFireworks();

        setSuccessMessage(
          `Đã xác thực và liên kết thành công Token CVAT: @${res.data.cvat_username} (#${res.data.cvat_user_id})`
        );
        setCvatToken('');
        await fetchCvatLiveProfile();
      }
    } catch (err: any) {
      console.error('Lỗi liên kết CVAT bằng Token:', err);
      setErrorMessage(
        err?.message || 'Không thể xác thực Personal Access Token này với máy chủ CVAT. Vui lòng kiểm tra lại token.'
      );
    } finally {
      setIsConnectingToken(false);
    }
  };

  // 3. Xử lý hủy liên kết tài khoản CVAT
  const handleConfirmDisconnect = async () => {
    setIsDisconnecting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await authApi.removeCvatToken();
      updateUser({
        cvat_username: null,
        cvat_user_id: null,
        cvat_email: null,
        cvat_first_name: null,
        cvat_last_name: null,
        cvat_groups: null,
        cvat_is_staff: false,
      });
      setCvatDetail(null);
      setPingResult(null);
      setSuccessMessage('Đã hủy liên kết tài khoản CVAT thành công.');
      setShowDisconnectModal(false);
    } catch (err: any) {
      console.error('Lỗi hủy liên kết CVAT:', err);
      setErrorMessage(
        err?.message || 'Không thể hủy liên kết tài khoản CVAT. Vui lòng thử lại sau.'
      );
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Trích xuất dữ liệu ưu tiên: Realtime > Cached user
  const username = cvatDetail?.cvat_username || user?.cvat_username || "annotator";
  const userId = cvatDetail?.cvat_user_id ?? user?.cvat_user_id ?? "--";
  const email = cvatDetail?.cvat_email || user?.cvat_email || "Chưa thiết lập";
  const firstName = cvatDetail?.cvat_first_name || user?.cvat_first_name || "";
  const lastName = cvatDetail?.cvat_last_name || user?.cvat_last_name || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || user?.full_name || username;
  const isStaff = cvatDetail?.cvat_is_staff ?? user?.cvat_is_staff ?? false;
  const isSuperuser = cvatDetail?.cvat_is_superuser ?? false;
  const groups = (cvatDetail?.cvat_groups && cvatDetail.cvat_groups.length > 0)
    ? cvatDetail.cvat_groups 
    : (user?.cvat_groups || ["user"]);

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
    <div className="space-y-6">
      <div className="p-6 sm:p-7 rounded-3xl bg-[#FDFCFA] border border-[#E5E3DC] shadow-soft-sm">
        {/* Header Mục CVAT */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#ECEAE2]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1]">
                TÍCH HỢP KHO DỮ LIỆU
              </span>
            </div>
            <h3 className="text-base font-bold text-[#1F2627] font-editorial">
              Liên kết Kho Gán nhãn CVAT Host
            </h3>
            <p className="text-xs text-[#5A6466] leading-relaxed max-w-lg">
              Kết nối với máy chủ CVAT Enterprise ({cvatBaseUrl}) để đồng bộ nhãn, bounding box và nhiệm vụ gán nhãn tự động cho quy trình Active Mining.
            </p>
          </div>

          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DC] text-[#2D5A34] shrink-0">
            <Database className="w-5 h-5" />
          </div>
        </div>

        {/* Thông báo kết quả */}
        {errorMessage && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Lỗi liên kết:</span>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}
        {successMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[#E8F0EA] border border-[#CDE0D1] text-xs text-[#2D5A34] flex items-center gap-2.5">
            <Check className="w-4 h-4 shrink-0 font-bold" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TRẠNG THÁI 1: ĐÃ KẾT NỐI CVAT */}
        {isConnected ? (
          <div className="mt-6 space-y-5">
            {/* Thẻ Header Kết Nối Xanh Diệp Lục Soft Editorial */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF9F5] border border-[#CDE0D1] space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#2D5A34] text-white flex items-center justify-center font-bold text-base shadow-soft-sm shrink-0">
                    {username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-[#1F2627] font-editorial">
                        @{username}
                      </span>
                      <span className="text-xs font-mono text-[#5A6466] bg-white px-2 py-0.5 rounded-md border border-[#E5E3DC]">
                        ID: #{userId}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A34] animate-pulse inline-block" />
                        ĐANG KẾT NỐI HOẠT ĐỘNG
                      </span>
                      {fetchingDetail && (
                        <span className="flex items-center gap-1 text-[11px] font-mono text-[#5A6466]">
                          <Loader2 className="w-3 h-3 animate-spin text-[#2D5A34]" />
                          Đang đồng bộ...
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-[#5A6466] flex items-center gap-1.5">
                      <span>Máy chủ đích:</span>
                      <span className="text-[#2D5A34] font-semibold">{cvatBaseUrl}</span>
                    </div>
                  </div>
                </div>

                {/* Nút hành động */}
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  <button
                    type="button"
                    onClick={handlePingToken}
                    disabled={pinging}
                    title="Kiểm tra trực tiếp kết nối và tình trạng sống của token trên máy chủ CVAT"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#F2EFE8] text-[#2D5A34] border border-[#CDE0D1] shadow-soft-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${pinging ? 'animate-spin' : ''}`} />
                    <span>{pinging ? 'Đang kiểm tra...' : 'Kiểm tra Token'}</span>
                  </button>

                  <a
                    href={cvatBaseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF9F5] hover:bg-[#F2EFE8] text-[#1F2627] border border-[#E5E3DC] hover:border-[#B7CDBB] shadow-soft-sm transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#2D5A34]" />
                    <span>Mở CVAT Host</span>
                  </a>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisconnectModal(true)}
                    className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                    icon={<Unlink className="w-3.5 h-3.5" />}
                  >
                    Hủy liên kết
                  </Button>
                </div>
              </div>

              {/* Thông báo kết quả Ping Token */}
              {pingResult && (
                <div className={`p-3 rounded-xl text-xs font-mono flex items-center justify-between border ${
                  pingResult.active 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <span className="flex items-center gap-2">
                    {pingResult.active ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{pingResult.message}</span>
                  </span>
                  {pingResult.latency_ms && (
                    <span className="font-bold px-2 py-0.5 bg-white/70 rounded-md border border-emerald-200 text-[#2D5A34] shrink-0">
                      {pingResult.latency_ms} ms
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* THẺ MA TRẬN HỒ SƠ CHI TIẾT (CVAT DETAILED PROFILE MATRIX) */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5E3DC] shadow-soft-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#2D5A34]" />
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1F2627]">
                    Thông tin tài khoản trên CVAT Host
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-[#2D5A34] font-semibold bg-[#E8F0EA] px-2.5 py-0.5 rounded-full border border-[#CDE0D1]">
                  {CVAT_CONFIG.HOSTNAME}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Họ và Tên CVAT */}
                <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#ECEAE2] flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white border border-[#E5E3DC] text-[#2D5A34] shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] text-[#5A6466] font-medium block">
                      Họ và Tên CVAT
                    </span>
                    <span className="text-sm font-bold text-[#1F2627] truncate block mt-0.5">
                      {fullName}
                    </span>
                    <span className="text-[10px] font-mono text-[#7FA086] block mt-0.5">
                      Tên người dùng: @{username}
                    </span>
                  </div>
                </div>

                {/* 2. Email Tài Khoản CVAT */}
                <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#ECEAE2] flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white border border-[#E5E3DC] text-[#2D5A34] shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] text-[#5A6466] font-medium block">
                      Email Liên Kết CVAT
                    </span>
                    <span className="text-sm font-mono font-bold text-[#1F2627] truncate block mt-0.5">
                      {email}
                    </span>
                    <span className="text-[10px] font-mono text-[#7FA086] block mt-0.5">
                      Xác thực qua CVAT OAuth/PAT
                    </span>
                  </div>
                </div>

                {/* 3. Phân Quyền & Vai Trò */}
                <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#ECEAE2] flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white border border-[#E5E3DC] text-[#2D5A34] shrink-0 mt-0.5">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] text-[#5A6466] font-medium block">
                      Phân Quyền / Vai Trò
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-[#E8F0EA] text-[#2D5A34] font-bold text-[11px] font-mono border border-[#CDE0D1]">
                        {isSuperuser ? "Superuser" : isStaff ? "Staff Admin" : "Annotator"}
                      </span>
                      {groups.map((grp) => (
                        <span key={grp} className="px-2 py-0.5 rounded-md bg-white text-[#5A6466] text-[11px] font-mono border border-[#E5E3DC]">
                          group:{grp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Lần Đăng Nhập Gần Nhất */}
                <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#ECEAE2] flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white border border-[#E5E3DC] text-[#2D5A34] shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] text-[#5A6466] font-medium block">
                      Đăng Nhập Gần Nhất
                    </span>
                    <span className="text-xs font-mono font-bold text-[#1F2627] truncate block mt-0.5">
                      {formattedLastLogin || "Đang trực tuyến"}
                    </span>
                    {formattedDateJoined && (
                      <span className="text-[10px] font-mono text-[#5A6466] block mt-0.5">
                        Ngày tạo tài khoản: {formattedDateJoined}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Banner Bảo mật & Độc quyền */}
              <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#CDE0D1] text-xs text-[#5A6466] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#2D5A34] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Tài khoản CVAT này được bảo mật và liên kết độc quyền với tài khoản GreenSM của bạn. Mọi tác vụ Active Mining, lọc dữ liệu biên và bài tập gán nhãn HITL sẽ tự động phân bổ đến tài khoản này.
                </p>
              </div>
            </div>

            {/* KHU VỰC CẬP NHẬT / THAY ĐỔI MÃ TOKEN MỚI (ROTATE TOKEN ACCORDION) */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5E3DC] shadow-soft-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-[#1F2627] flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#2D5A34]" />
                    <span>Cập nhật mã Personal Access Token mới (Token Rotation)</span>
                  </h4>
                  <p className="text-xs text-[#5A6466]">
                    Khi bạn tạo mã Token mới trên CVAT Host, hãy dán vào đây để làm mới chuỗi xác thực mà không làm gián đoạn tài khoản.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowRotateForm(!showRotateForm);
                    setCheckResult(null);
                    setRotateError(null);
                    setRotateSuccess(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#2D5A34] bg-[#E8F0EA] hover:bg-[#D5E5D8] border border-[#CDE0D1] transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>{showRotateForm ? 'Thu gọn' : 'Đổi Token'}</span>
                  {showRotateForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {showRotateForm && (
                <form onSubmit={handleSaveNewToken} className="space-y-4 pt-3 border-t border-[#ECEAE2] animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E3DC] text-xs text-[#5A6466] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#1F2627]">
                      <Info className="w-3.5 h-3.5 text-[#2D5A34]" />
                      <span>Quy tắc bảo mật xoay vòng Token:</span>
                    </div>
                    <p>
                      Token mới bắt buộc phải được tạo từ cùng tài khoản CVAT <strong>@{username} (ID: #{userId})</strong>. Hệ thống sẽ từ chối nếu token thuộc về người dùng khác.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#1F2627] block">
                      Mã Personal Access Token (PAT) Mới
                    </label>

                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-[#7FA086] pointer-events-none flex items-center justify-center">
                        <KeyRound className="w-4 h-4" />
                      </div>

                      <input
                        type={showNewToken ? 'text' : 'password'}
                        value={newToken}
                        onChange={(e) => {
                          setNewToken(e.target.value);
                          setCheckResult(null);
                          setRotateError(null);
                          setRotateSuccess(null);
                        }}
                        placeholder="Dán mã Token mới (Ví dụ: Yn27Ucr0.TAI1R4FNF6GF9ZjI...)"
                        className="w-full h-11 rounded-xl bg-[#FAF9F5] border border-[#D5D2C8] focus:border-[#7FA086] focus:ring-[#7FA086]/25 pl-10 pr-11 text-xs font-mono text-[#1F2627] placeholder:text-[#5A6466]/60 transition-all outline-none focus:ring-4"
                        required
                      />

                      <button
                        type="button"
                        onClick={() => setShowNewToken((prev) => !prev)}
                        className="absolute right-3.5 p-1 rounded-md text-[#777B78] hover:text-[#30383A] transition-colors focus:outline-none"
                        title={showNewToken ? 'Ẩn token' : 'Hiện token'}
                      >
                        {showNewToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Kết quả Kiểm tra Token Mới */}
                  {checkResult && (
                    <div className={`p-3 rounded-xl text-xs font-mono border ${
                      checkResult.valid && checkResult.is_same_account
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : checkResult.is_linked_to_other
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}>
                      <div className="flex items-start gap-2">
                        {checkResult.valid && checkResult.is_same_account ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div className="leading-relaxed">
                          <strong>{checkResult.message}</strong>
                          {checkResult.valid && (
                            <div className="text-[11px] mt-1 opacity-90">
                              Chủ sở hữu token: @{checkResult.cvat_username} (#{checkResult.cvat_user_id}) — {checkResult.cvat_email}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {rotateError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{rotateError}</span>
                    </div>
                  )}

                  {rotateSuccess && (
                    <div className="p-3 rounded-xl bg-[#E8F0EA] border border-[#CDE0D1] text-[#2D5A34] text-xs font-mono flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0 font-bold" />
                      <span>{rotateSuccess}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <Button
                      type="button"
                      variant="editorial"
                      size="sm"
                      onClick={handleCheckNewToken}
                      disabled={!newToken.trim() || checkingNewToken || savingNewToken}
                      isLoading={checkingNewToken}
                      icon={<ShieldCheck className="w-3.5 h-3.5" />}
                    >
                      Kiểm tra trước
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={!newToken.trim() || savingNewToken || (checkResult !== null && !checkResult.valid)}
                      isLoading={savingNewToken}
                      icon={<KeyRound className="w-3.5 h-3.5" />}
                    >
                      Lưu Token mới
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* TRẠNG THÁI 2: CHƯA KẾT NỐI (LỰA CHỌN USERNAME/PASSWORD HOẶC TOKEN) */
          <div className="mt-6 space-y-6">
            {/* Thanh Tab chuyển đổi phương thức kết nối */}
            <div className="flex items-center p-1.5 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DC] w-full sm:w-fit gap-1">
              <button
                type="button"
                onClick={() => {
                  setConnectMethod('credentials');
                  setErrorMessage(null);
                }}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  connectMethod === 'credentials'
                    ? 'bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1] shadow-soft-sm'
                    : 'text-[#5A6466] hover:text-[#1F2627] hover:bg-white/50 border border-transparent'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Đăng nhập tài khoản</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setConnectMethod('token');
                  setErrorMessage(null);
                }}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  connectMethod === 'token'
                    ? 'bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1] shadow-soft-sm'
                    : 'text-[#5A6466] hover:text-[#1F2627] hover:bg-white/50 border border-transparent'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Personal Access Token</span>
              </button>
            </div>

            {/* PHƯƠNG THỨC 1: ĐĂNG NHẬP NHANH BẰNG USERNAME / PASSWORD */}
            {connectMethod === 'credentials' && (
              <form onSubmit={handleConnectCredentials} className="space-y-5 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DC] text-xs text-[#5A6466] flex items-start gap-3">
                  <Server className="w-4 h-4 text-[#7FA086] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-[#1F2627]">
                      Kết nối nhanh bằng thông tin đăng nhập CVAT
                    </p>
                    <p>
                      Nhập tài khoản và mật khẩu của bạn trên máy chủ ({cvatBaseUrl}). Hệ thống sẽ tự động xác thực và nhận diện ID tài khoản độc quyền của bạn.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    label="Tên đăng nhập CVAT"
                    required
                    value={cvatUsername}
                    onChange={(e) => {
                      setCvatUsername(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Ví dụ: green_annotator_01"
                    icon={<User className="w-4 h-4" />}
                  />

                  <PasswordField
                    label="Mật khẩu tài khoản CVAT"
                    required
                    value={cvatPassword}
                    onChange={(e) => {
                      setCvatPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Nhập mật khẩu CVAT của bạn"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#ECEAE2]">
                  <a
                    href={`${cvatBaseUrl}/auth/register`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-[#2D5A34] hover:underline flex items-center gap-1"
                  >
                    <span>Chưa có tài khoản CVAT? Đăng ký tại đây</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <Button
                    type="submit"
                    variant="secondary"
                    size="md"
                    disabled={!cvatUsername.trim() || !cvatPassword || isConnectingCreds}
                    isLoading={isConnectingCreds}
                    icon={<Database className="w-4 h-4" />}
                  >
                    Liên kết ngay
                  </Button>
                </div>
              </form>
            )}

            {/* PHƯƠNG THỨC 2: NHẬP PERSONAL ACCESS TOKEN (PAT) */}
            {connectMethod === 'token' && (
              <form onSubmit={handleConnectToken} className="space-y-5 animate-in fade-in duration-200">
                {/* Hướng dẫn lấy Token chi tiết */}
                <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DC] text-xs text-[#5A6466] space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-[#1F2627]">
                    <Info className="w-4 h-4 text-[#7FA086]" />
                    <span>Cách lấy Personal Access Token từ CVAT Host:</span>
                  </div>
                  <ol className="list-decimal pl-5 space-y-1 text-[#5A6466]">
                    <li>
                      Đăng nhập vào máy chủ{' '}
                      <a
                        href={cvatBaseUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#2D5A34] font-semibold underline"
                      >
                        {cvatBaseUrl}
                      </a>
                    </li>
                    <li>Bấm vào biểu tượng ảnh đại diện ở góc phải trên cùng → chọn <strong>Profile</strong>.</li>
                    <li>Chuyển sang mục <strong>Personal Access Tokens</strong> và bấm <strong>Create Token</strong>.</li>
                    <li>Sao chép chuỗi mã Token vừa tạo và dán vào ô bên dưới.</li>
                  </ol>
                </div>

                {/* Ô nhập Token */}
                <div className="flex flex-col gap-2 w-full text-left">
                  <label className="text-sm font-semibold text-[#1F2627] tracking-tight flex items-center justify-between">
                    <span>Personal Access Token (PAT)</span>
                    <span className="text-rose-600 font-bold text-sm">*</span>
                  </label>

                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-[#475254] pointer-events-none flex items-center justify-center">
                      <KeyRound className="w-4 h-4" />
                    </div>

                    <input
                      type={showToken ? 'text' : 'password'}
                      value={cvatToken}
                      onChange={(e) => {
                        setCvatToken(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="Dán token CVAT của bạn vào đây (ví dụ: Yn27Ucr0.TAI1...)"
                      className="w-full h-12 rounded-xl bg-white border border-[#D5D2C8] focus:border-[#7FA086] focus:ring-[#7FA086]/25 pl-11 pr-11 text-sm font-mono text-[#1F2627] placeholder:text-[#5A6466]/70 transition-all outline-none focus:ring-4"
                    />

                    <button
                      type="button"
                      onClick={() => setShowToken((prev) => !prev)}
                      className="absolute right-3.5 p-1 rounded-md text-[#777B78] hover:text-[#30383A] hover:bg-[#F3EACB]/50 transition-colors focus:outline-none"
                      title={showToken ? 'Ẩn token' : 'Hiện token'}
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-[#5A6466]">
                    Token cá nhân sẽ được hệ thống kiểm tra trực tiếp và lưu trữ bảo mật bằng cơ chế mã hóa.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#ECEAE2]">
                  <span className="text-xs text-[#5A6466] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2D5A34]" />
                    Chỉ cấp quyền cho một tài khoản duy nhất
                  </span>

                  <Button
                    type="submit"
                    variant="secondary"
                    size="md"
                    disabled={!cvatToken.trim() || cvatToken.trim().length < 10 || isConnectingToken}
                    isLoading={isConnectingToken}
                    icon={<KeyRound className="w-4 h-4" />}
                  >
                    Xác thực & Lưu Token
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* MODAL XÁC NHẬN HỦY LIÊN KẾT CVAT */}
      <Modal
        isOpen={showDisconnectModal}
        onClose={() => !isDisconnecting && setShowDisconnectModal(false)}
        title="Xác nhận hủy liên kết CVAT Host"
        description="Bạn có chắc chắn muốn ngắt kết nối với tài khoản gán nhãn CVAT hiện tại?"
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DC] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#5A6466]">Tài khoản CVAT:</span>
              <span className="font-bold text-[#1F2627]">@{username}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#5A6466]">User ID:</span>
              <span className="font-mono text-[#1F2627]">#{userId}</span>
            </div>
            {email && email !== "Chưa thiết lập" && (
              <div className="flex items-center justify-between">
                <span className="text-[#5A6466]">Email liên kết:</span>
                <span className="font-mono text-[#1F2627]">{email}</span>
              </div>
            )}
            <p className="text-[#5A6466] pt-1 border-t border-[#ECEAE2]">
              Lưu ý: Sau khi hủy liên kết, các tác vụ đồng bộ nhãn tự động từ hệ thống sang CVAT sẽ tạm dừng cho đến khi bạn kết nối lại.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECEAE2]">
            <Button
              type="button"
              variant="editorial"
              size="sm"
              onClick={() => setShowDisconnectModal(false)}
              disabled={isDisconnecting}
            >
              Giữ kết nối
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleConfirmDisconnect}
              isLoading={isDisconnecting}
              icon={<Unlink className="w-3.5 h-3.5" />}
            >
              Xác nhận hủy liên kết
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
