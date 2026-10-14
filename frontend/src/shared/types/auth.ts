/**
 * Re-export auth types từ Domain Module `modules/auth` và common API Response
 * để đảm bảo Single Source of Truth và tính tương thích ngược toàn dự án.
 */
export type { 
  UserProfile, 
  TokenData, 
  UserSession, 
  LoginCredentials, 
  OtpVerificationPayload, 
  RegisterPayload, 
  UpdateProfilePayload,
  ChangePasswordPayload,
  AuthMode 
} from '@/modules/auth/types';

export type { ApiResponse } from './common';
