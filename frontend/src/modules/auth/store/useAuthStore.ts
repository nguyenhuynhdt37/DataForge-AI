"use client";

import { create } from 'zustand';
import { UserProfile, TokenData } from '../types';
import { authApi } from '../services/authApi';
import { 
  getStoredAccessToken, 
  getStoredRefreshToken, 
  getStoredUser, 
  setStoredAuth, 
  clearStoredAuth 
} from '@/shared/lib/apiClient';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresOtp: boolean;
  pendingEmail: string;
  error: string | null;

  // Actions
  initializeAuth: () => void;
  login: (email: string, password: string) => Promise<{ requiresOtp: boolean }>;
  register: (payload: { email: string; password: string; full_name: string; title?: string }) => Promise<UserProfile>;
  verifyOtp: (otp: string) => Promise<boolean>;
  resendOtp: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  setPendingEmail: (email: string) => void;
  cancelOtp: () => void;
  updateUser: (partialUser: Partial<UserProfile>) => void;
  fetchUserProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  requiresOtp: false,
  pendingEmail: '',
  error: null,

  initializeAuth: () => {
    const token = getStoredAccessToken();
    const user = getStoredUser();
    const refreshToken = getStoredRefreshToken();

    if (token && user) {
      set({
        accessToken: token,
        refreshToken,
        user,
        isAuthenticated: true,
      });
    }
  },

  clearError: () => set({ error: null }),
  setPendingEmail: (email: string) => set({ pendingEmail: email }),
  cancelOtp: () => set({ requiresOtp: false, pendingEmail: '', error: null }),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login({ email, password });

      if (res.data.requires_otp) {
        set({
          isLoading: false,
          requiresOtp: true,
          pendingEmail: email,
        });
        return { requiresOtp: true };
      }

      const { access_token, refresh_token, user } = res.data;
      setStoredAuth(access_token, refresh_token, user);

      set({
        user: user || null,
        accessToken: access_token,
        refreshToken: refresh_token || null,
        isAuthenticated: true,
        isLoading: false,
        requiresOtp: false,
        pendingEmail: '',
      });

      return { requiresOtp: false };
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại.',
      });
      throw err;
    }
  },

  register: async (payload: { email: string; password: string; full_name: string; title?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.register(payload);
      set({ isLoading: false });
      return res.data;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Đăng ký tài khoản không thành công. Vui lòng thử lại.',
      });
      throw err;
    }
  },

  verifyOtp: async (otp: string) => {
    const { pendingEmail } = get();
    if (!pendingEmail) {
      set({ error: 'Không tìm thấy thông tin email đăng nhập.' });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      const res = await authApi.verifyOtp({ email: pendingEmail, otp });
      const { access_token, refresh_token, user } = res.data;
      setStoredAuth(access_token, refresh_token, user);

      set({
        user: user || null,
        accessToken: access_token,
        refreshToken: refresh_token || null,
        isAuthenticated: true,
        isLoading: false,
        requiresOtp: false,
        pendingEmail: '',
      });

      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.',
      });
      throw err;
    }
  },

  resendOtp: async () => {
    const { pendingEmail } = get();
    if (!pendingEmail) return false;

    set({ isLoading: true, error: null });
    try {
      await authApi.resendOtp(pendingEmail);
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.',
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Lỗi khi gọi API logout:', err);
    } finally {
      clearStoredAuth();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        requiresOtp: false,
        pendingEmail: '',
        error: null,
      });
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  },

  updateUser: (partialUser: Partial<UserProfile>) => {
    const { user, accessToken, refreshToken } = get();
    if (!user) return;

    const updatedUser = { ...user, ...partialUser };
    if (accessToken) {
      setStoredAuth(accessToken, refreshToken, updatedUser);
    }
    set({ user: updatedUser });
  },

  fetchUserProfile: async () => {
    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        const { accessToken, refreshToken } = get();
        if (accessToken) {
          setStoredAuth(accessToken, refreshToken, res.data);
        }
        set({ user: res.data });
      }
    } catch (err) {
      console.warn("Không thể đồng bộ hồ sơ người dùng:", err);
    }
  },
}));
