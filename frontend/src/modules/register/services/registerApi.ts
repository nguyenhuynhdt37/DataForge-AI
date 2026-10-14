import { apiClient } from '@/shared/lib/apiClient';
import { RegisterPayload, RegisteredUser } from '../types';

export const registerApi = {
  register: (payload: RegisterPayload) => {
    return apiClient.post<RegisteredUser>('/auth/register', payload, { requiresAuth: false });
  },
};
