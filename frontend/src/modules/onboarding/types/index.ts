/**
 * Types & Schema cho Feature Onboarding & Liên kết CVAT Host
 * Tuân thủ tài liệu đặc tả kỹ thuật: docs/api-specs/CVAT_ONBOARDING_API_SPECIFICATION.md
 */

import { UserProfile } from '@/modules/auth/types';

export interface FirstLoginStatus {
  is_first_login: boolean;
  cvat_connected: boolean;
  cvat_user_id: number | null;
  cvat_username: string | null;
  requires_onboarding: boolean;
}

export interface CvatLoginPayload {
  username: string;
  password: string;
}

export interface CvatTokenPayload {
  cvat_token: string;
}

export interface CvatTokenResponse {
  cvat_user_id: number;
  cvat_username: string;
  message: string;
}

export type OnboardingTab = 'credentials' | 'token';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  onSuccess?: (info: CvatTokenResponse) => void;
  isDark?: boolean;
}

