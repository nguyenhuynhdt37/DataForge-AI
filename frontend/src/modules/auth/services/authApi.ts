import { apiClient } from '@/shared/lib/apiClient';
import { ApiResponse } from '@/shared/types/common';
import { 
  LoginCredentials, 
  OtpVerificationPayload, 
  RegisterPayload,
  UpdateProfilePayload,
  ChangePasswordPayload,
  TokenData, 
  UserProfile, 
  UserSession,
  CvatLoginPayload,
  CvatTokenPayload,
  CvatTokenResponse,
  FirstLoginStatusResponse,
  CvatDetailedProfileResponse,
  CvatTokenCheckResponse,
  CvatTokenPingResponse
} from '../types';

export const authApi = {
  register: (payload: RegisterPayload) => {
    return apiClient.post<UserProfile>('/auth/register', payload, { requiresAuth: false });
  },

  login: (credentials: LoginCredentials) => {
    return apiClient.post<TokenData>('/auth/login', credentials, { requiresAuth: false });
  },

  verifyOtp: (payload: OtpVerificationPayload) => {
    return apiClient.post<TokenData>('/auth/verify-otp', payload, { requiresAuth: false });
  },

  resendOtp: (email: string) => {
    return apiClient.post<{ success: boolean }>('/auth/resend-otp', { email }, { requiresAuth: false });
  },

  refresh: (refreshToken: string) => {
    return apiClient.post<TokenData>('/auth/refresh', { refresh_token: refreshToken }, { requiresAuth: false });
  },

  logout: () => {
    return apiClient.post<{ success: boolean }>('/auth/logout');
  },

  getMe: () => {
    return apiClient.get<UserProfile>('/auth/me');
  },

  updateProfile: (payload: UpdateProfilePayload) => {
    return apiClient.put<UserProfile>('/auth/me', payload);
  },

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<UserProfile>('/auth/me/avatar', formData);
  },

  changePassword: (payload: ChangePasswordPayload) => {
    return apiClient.put<{ success: boolean }>('/auth/me/password', payload);
  },

  getSessions: () => {
    return apiClient.get<UserSession[]>('/auth/me/sessions');
  },

  revokeSession: (sessionId: string) => {
    return apiClient.delete<{ success: boolean }>(`/auth/me/sessions/${sessionId}`);
  },

  loginWithCvatCredentials: (payload: CvatLoginPayload) => {
    return apiClient.post<CvatTokenResponse>('/auth/me/cvat-login', payload);
  },

  updateCvatToken: (payload: CvatTokenPayload) => {
    return apiClient.put<CvatTokenResponse>('/auth/me/cvat-token', payload);
  },

  removeCvatToken: () => {
    return apiClient.delete<{ success: boolean }>('/auth/me/cvat-token');
  },

  completeOnboarding: () => {
    return apiClient.post<UserProfile>('/auth/me/complete-onboarding');
  },

  getFirstLoginStatus: () => {
    return apiClient.get<FirstLoginStatusResponse>('/auth/me/first-login-status');
  },

  getCvatProfile: () => {
    return apiClient.get<CvatDetailedProfileResponse>('/auth/me/cvat-profile');
  },

  checkCvatToken: (payload: CvatTokenPayload) => {
    return apiClient.post<CvatTokenCheckResponse>('/auth/me/cvat-token/check', payload);
  },

  pingCvatToken: () => {
    return apiClient.post<CvatTokenPingResponse>('/auth/me/cvat-token/ping');
  },
};
