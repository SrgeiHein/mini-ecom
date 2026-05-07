import { apiFetch } from '@/lib/api-client';
import type { AuthUser } from './store';

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
}

export const login = (email: string, password: string) =>
  apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
    skipRefresh: true,
  });

export const refresh = () =>
  apiFetch<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    auth: false,
    skipRefresh: true,
  });

export const logout = () =>
  apiFetch<{ ok: true }>('/auth/logout', {
    method: 'POST',
    auth: false,
    skipRefresh: true,
  });

export const me = () => apiFetch<AuthUser>('/auth/me');
