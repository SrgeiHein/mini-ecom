import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (accessToken: string, user: AuthUser) => void;
  setAccessToken: (accessToken: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setSession: (accessToken, user) => set({ accessToken, user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clear: () => set({ accessToken: null, user: null }),
}));

export const getAccessToken = () => useAuthStore.getState().accessToken;
export const setAccessTokenDirect = (token: string | null) =>
  useAuthStore.setState({ accessToken: token });
export const clearSession = () => useAuthStore.getState().clear();
