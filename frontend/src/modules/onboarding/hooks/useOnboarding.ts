"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/shared/lib/authStore';
import { onboardingApi } from '../services/onboardingApi';
import { OnboardingTab, CvatTokenResponse } from '../types';
import { triggerConfettiFireworks } from '@/shared/lib/confetti';

export function useOnboarding() {
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<OnboardingTab>('credentials');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasCheckedRef = useRef(false);

  // Tự động kiểm tra trạng thái đăng nhập đầu tiên & mở Modal nếu người dùng cần Onboarding
  useEffect(() => {
    if (!isAuthenticated || !user || hasCheckedRef.current) return;

    // Nếu cờ is_first_login là true hoặc chưa liên kết CVAT ở lần đầu
    if (user.is_first_login) {
      hasCheckedRef.current = true;
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);

      return () => clearTimeout(timer);
    }

    // Nếu không có thông tin is_first_login trong store, gọi endpoint chuyên biệt xác thực
    let isSubscribed = true;
    const verifyStatus = async () => {
      try {
        const response = await onboardingApi.getFirstLoginStatus();
        if (!isSubscribed) return;

        if (response.success && response.data) {
          hasCheckedRef.current = true;
          // Đồng bộ lại cờ với user profile trong store
          if (response.data.is_first_login !== user.is_first_login) {
            updateUser({
              is_first_login: response.data.is_first_login,
              cvat_user_id: response.data.cvat_user_id,
              cvat_username: response.data.cvat_username,
            });
          }

          if (response.data.requires_onboarding) {
            const timer = setTimeout(() => {
              if (isSubscribed) {
                setIsOpen(true);
              }
            }, 1200);
            return () => clearTimeout(timer);
          }
        }
      } catch (err) {
        // Ghi log nhẹ nhàng và không làm crash giao diện
        console.warn("Không thể tải first-login-status từ máy chủ:", err);
      }
    };

    verifyStatus();

    return () => {
      isSubscribed = false;
    };
  }, [isAuthenticated, user, updateUser]);

  const openModal = useCallback(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  // Xử lý khi người dùng bấm "Thiết lập sau" hoặc bấm "X" đóng modal
  const handleDismiss = useCallback(async () => {
    closeModal();
    if (user?.is_first_login) {
      // Đánh dấu hoàn tất Onboarding vào backend để không bao giờ hiện lại ở các phiên sau
      updateUser({ is_first_login: false });
      try {
        await onboardingApi.completeOnboarding();
      } catch (err) {
        console.warn("Lỗi khi ghi nhận completeOnboarding:", err);
      }
    }
  }, [closeModal, user, updateUser]);

  // Đăng nhập CVAT bằng Username & Password
  const handleLoginWithCredentials = useCallback(async (username: string, pass: string): Promise<boolean> => {
    if (!username.trim() || !pass) {
      setErrorMessage("Vui lòng nhập đầy đủ tên tài khoản và mật khẩu CVAT.");
      return false;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await onboardingApi.loginWithCvatCredentials({
        username: username.trim(),
        password: pass,
      });

      if (response.success && response.data) {
        const info = response.data;
        setSuccessMessage(`Đã liên kết thành công với tài khoản CVAT: @${info.cvat_username} (#${info.cvat_user_id})`);
        
        // Kích hoạt chùm pháo hoa chào mừng nhiều tầng theo chuẩn StudyNest
        triggerConfettiFireworks();

        updateUser({
          cvat_user_id: info.cvat_user_id,
          cvat_username: info.cvat_username,
          is_first_login: false,
        });

        // Tự động đóng modal sau khi pháo hoa kết thúc
        setTimeout(() => {
          closeModal();
        }, 2200);

        return true;
      } else {
        setErrorMessage(response.message || "Không thể xác thực với máy chủ CVAT.");
        return false;
      }
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.message || "Tài khoản hoặc mật khẩu CVAT không chính xác.";
      setErrorMessage(apiMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [closeModal, updateUser]);

  // Liên kết bằng Personal Access Token (PAT)
  const handleConnectWithToken = useCallback(async (patToken: string): Promise<boolean> => {
    if (!patToken.trim()) {
      setErrorMessage("Vui lòng dán Personal Access Token (PAT) từ CVAT.");
      return false;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await onboardingApi.updateCvatToken({
        cvat_token: patToken.trim(),
      });

      if (response.success && response.data) {
        const info = response.data;
        setSuccessMessage(`Đã liên kết thành công với tài khoản CVAT: @${info.cvat_username} (#${info.cvat_user_id})`);
        
        // Kích hoạt chùm pháo hoa chào mừng nhiều tầng theo chuẩn StudyNest
        triggerConfettiFireworks();

        updateUser({
          cvat_user_id: info.cvat_user_id,
          cvat_username: info.cvat_username,
          is_first_login: false,
        });

        // Tự động đóng modal sau khi pháo hoa kết thúc
        setTimeout(() => {
          closeModal();
        }, 2200);

        return true;
      } else {
        setErrorMessage(response.message || "Token CVAT không hợp lệ.");
        return false;
      }
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.message || "Token CVAT không hợp lệ hoặc đã hết hạn.";
      setErrorMessage(apiMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [closeModal, updateUser]);

  // Hủy liên kết CVAT Host
  const handleDisconnect = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setErrorMessage(null);

    try {
      await onboardingApi.removeCvatToken();
      setSuccessMessage("Đã hủy liên kết tài khoản CVAT thành công.");
      updateUser({
        cvat_user_id: null,
        cvat_username: null,
      });

      setTimeout(() => {
        closeModal();
      }, 1000);

      return true;
    } catch (err: any) {
      setErrorMessage("Không thể hủy liên kết. Vui lòng thử lại sau.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [closeModal, updateUser]);

  return {
    isOpen,
    activeTab,
    loading,
    errorMessage,
    successMessage,
    currentUser: user,
    isAlreadyConnected: Boolean(user?.cvat_user_id),
    setActiveTab,
    openModal,
    closeModal,
    handleDismiss,
    handleLoginWithCredentials,
    handleConnectWithToken,
    handleDisconnect,
    clearMessage: () => {
      setErrorMessage(null);
      setSuccessMessage(null);
    },
  };
}
