import { ApiResponse } from '@/shared/types/common';
import type { TokenData } from '@/modules/auth/types';

const getBaseUrl = (): string => {
  let envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  if (!envUrl || envUrl.trim() === '') {
    envUrl = 'http://localhost:8000';
  }
  const clean = envUrl.trim().replace(/\/+$/, '');
  if (clean.endsWith('/api/v1')) {
    return clean;
  }
  return `${clean}/api/v1`;
};

const BASE_URL = getBaseUrl();

// Token Storage Keys
const ACCESS_TOKEN_KEY = 'greensm_access_token';
const REFRESH_TOKEN_KEY = 'greensm_refresh_token';
const USER_KEY = 'greensm_user';

export const getStoredAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getStoredRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setStoredAuth = (accessToken: string, refreshToken?: string | null, user?: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const clearStoredAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

class ApiClient {
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  private subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.map((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      let cleanEndpoint = url.startsWith('/') ? url : `/${url}`;
      if (cleanEndpoint.startsWith('/api/v1/')) {
        cleanEndpoint = cleanEndpoint.substring('/api/v1'.length);
      } else if (cleanEndpoint === '/api/v1') {
        cleanEndpoint = '';
      }
      url = `${BASE_URL}${cleanEndpoint}`;
    }

    const requiresAuth = options.requiresAuth !== false;
    const headers = new Headers(options.headers || {});
    
    // Gắn Content-Type nếu không phải FormData
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Tự động gắn Bearer Token nếu yêu cầu xác thực
    if (requiresAuth) {
      const token = getStoredAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    try {
      console.log(`🌐 [API REQUEST] ${options.method || 'GET'} ${url}`, options.body);
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Xử lý khi Token hết hạn (HTTP 401)
      if (response.status === 401 && requiresAuth && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
        const refreshToken = getStoredRefreshToken();

        if (refreshToken) {
          if (!this.isRefreshing) {
            this.isRefreshing = true;
            try {
              const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
              });

              if (refreshRes.ok) {
                const refreshData: ApiResponse<TokenData> = await refreshRes.json();
                const newAccess = refreshData.data.access_token;
                const newRefresh = refreshData.data.refresh_token;
                const user = refreshData.data.user;

                setStoredAuth(newAccess, newRefresh, user);
                this.isRefreshing = false;
                this.onTokenRefreshed(newAccess);

                // Thử lại request gốc với token mới
                headers.set('Authorization', `Bearer ${newAccess}`);
                const retryRes = await fetch(url, { ...options, headers });
                const retryJson = await retryRes.json();
                console.log(`✅ [API RESPONSE RETRY] ${retryRes.status} ${url}`, retryJson);
                return retryJson;
              } else {
                // Refresh token cũng hết hạn -> Logout
                this.isRefreshing = false;
                clearStoredAuth();
                if (typeof window !== 'undefined') {
                  window.location.href = '/login';
                }
              }
            } catch (err) {
              this.isRefreshing = false;
              clearStoredAuth();
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            }
          } else {
            // Chờ quá trình refresh hoàn tất rồi retry
            return new Promise((resolve) => {
              this.subscribeTokenRefresh(async (newToken: string) => {
                headers.set('Authorization', `Bearer ${newToken}`);
                const retryRes = await fetch(url, { ...options, headers });
                resolve(await retryRes.json());
              });
            });
          }
        } else {
          clearStoredAuth();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }

      const data = await response.json();
      console.log(`📡 [API RESPONSE] ${response.status} ${url}`, data);

      if (!response.ok) {
        let errorMsg = `Lỗi yêu cầu: ${response.status}`;
        if (typeof data.detail === 'string') {
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMsg = data.detail
            .map((errItem: any) => {
              const field = Array.isArray(errItem.loc) ? errItem.loc.slice(1).join('.') : '';
              return field ? `${field}: ${errItem.msg}` : errItem.msg;
            })
            .join('; ');
        } else if (typeof data.message === 'string') {
          errorMsg = data.message;
        }
        throw new Error(errorMsg);
      }

      return data;
    } catch (error: any) {
      console.error(`❌ [API ERROR] ${options.method || 'GET'} ${url}:`, error);
      throw error;
    }
  }

  get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
