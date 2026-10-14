export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  title?: string | null;
  total_annotated: number;
  accuracy_rate: number;
  is_admin: boolean;
  is_active: boolean;
  cvat_user_id?: number | null;
  cvat_username?: string | null;
  cvat_email?: string | null;
  cvat_first_name?: string | null;
  cvat_last_name?: string | null;
  cvat_groups?: string[] | null;
  cvat_is_staff?: boolean;
  is_first_login?: boolean;
  last_login_at?: string | null;
}

export interface TokenData {
  access_token: string;
  refresh_token?: string | null;
  token_type: string;
  expires_in: number;
  requires_otp: boolean;
  message: string;
  user?: UserProfile | null;
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
  cvat_email?: string | null;
  cvat_first_name?: string | null;
  cvat_last_name?: string | null;
  cvat_groups?: string[] | null;
  cvat_is_staff?: boolean;
  cvat_is_superuser?: boolean;
  cvat_date_joined?: string | null;
  cvat_last_login?: string | null;
  message: string;
}

export interface FirstLoginStatusResponse {
  is_first_login: boolean;
  cvat_connected: boolean;
  cvat_user_id?: number | null;
  cvat_username?: string | null;
  cvat_email?: string | null;
  cvat_first_name?: string | null;
  cvat_last_name?: string | null;
  cvat_groups?: string[] | null;
  cvat_is_staff?: boolean;
  requires_onboarding: boolean;
}

export interface CvatDetailedProfileResponse {
  connected: boolean;
  cvat_user_id?: number | null;
  cvat_username?: string | null;
  cvat_email?: string | null;
  cvat_first_name?: string | null;
  cvat_last_name?: string | null;
  cvat_groups?: string[];
  cvat_is_staff?: boolean;
  cvat_is_superuser?: boolean;
  cvat_is_active?: boolean;
  cvat_date_joined?: string | null;
  cvat_last_login?: string | null;
  cvat_url?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface OtpVerificationPayload {
  email: string;
  otp: string;
}

export interface UserSession {
  id: string;
  ip_address?: string | null;
  user_agent?: string | null;
  is_current: boolean;
  created_at: string;
  expires_at: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  title?: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  title?: string;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}

export type AuthMode = 'login' | 'register';

export interface CvatTokenCheckResponse {
  valid: boolean;
  cvat_user_id: number;
  cvat_username: string;
  cvat_email?: string | null;
  cvat_first_name?: string | null;
  cvat_last_name?: string | null;
  is_same_account: boolean;
  is_linked_to_other: boolean;
  linked_by_email?: string | null;
  message: string;
}

export interface CvatTokenPingResponse {
  active: boolean;
  cvat_user_id?: number | null;
  cvat_username?: string | null;
  latency_ms?: number | null;
  message: string;
}

