/**
 * Onboarding & CVAT Integration API Service
 * Tuân thủ tài liệu đặc tả kỹ thuật: docs/api-specs/CVAT_ONBOARDING_API_SPECIFICATION.md
 */

import { apiClient } from '@/shared/lib/apiClient';
import { ApiResponse } from '@/shared/types/common';
import { UserProfile } from '@/modules/auth/types';
import { 
  FirstLoginStatus, 
  CvatLoginPayload, 
  CvatTokenPayload, 
  CvatTokenResponse 
} from '../types';

export const onboardingApi = {
  /**
   * API 1: Kiểm tra trạng thái đăng nhập đầu tiên & xem có cần kích hoạt Onboarding hay không
   * GET /api/v1/auth/me/first-login-status
   */
  getFirstLoginStatus: (): Promise<ApiResponse<FirstLoginStatus>> => {
    return apiClient.get<FirstLoginStatus>('/auth/me/first-login-status');
  },

  /**
   * API 2: Đăng nhập trực tiếp bằng Username & Password của tài khoản CVAT Host
   * POST /api/v1/auth/me/cvat-login
   */
  loginWithCvatCredentials: (payload: CvatLoginPayload): Promise<ApiResponse<CvatTokenResponse>> => {
    return apiClient.post<CvatTokenResponse>('/auth/me/cvat-login', payload);
  },

  /**
   * API 3: Cài đặt Token PAT CVAT thủ công
   * PUT /api/v1/auth/me/cvat-token
   */
  updateCvatToken: (payload: CvatTokenPayload): Promise<ApiResponse<CvatTokenResponse>> => {
    return apiClient.put<CvatTokenResponse>('/auth/me/cvat-token', payload);
  },

  /**
   * API 4: Hoàn tất Onboarding (đánh dấu is_first_login = false khi người dùng hoàn thành hoặc bấm bỏ qua)
   * POST /api/v1/auth/me/complete-onboarding
   */
  completeOnboarding: (): Promise<ApiResponse<UserProfile>> => {
    return apiClient.post<UserProfile>('/auth/me/complete-onboarding');
  },

  /**
   * API 5: Hủy liên kết tài khoản CVAT
   * DELETE /api/v1/auth/me/cvat-token
   */
  removeCvatToken: (): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiClient.delete<{ success: boolean; message: string }>('/auth/me/cvat-token');
  },
};
