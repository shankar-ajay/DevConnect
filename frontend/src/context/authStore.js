import { create } from 'zustand';
import { authAPI } from '../api/client';

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setTokens: (access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  },

  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  login: async (credentials) => {
    const { data } = await authAPI.login(credentials);
    get().setTokens(data.access_token, data.refresh_token);
    const me = await authAPI.me();
    set({ user: me.data, isAuthenticated: true });
    return me.data;
  },

  register: async (payload) => {
    const { data } = await authAPI.register(payload);
    get().setTokens(data.access_token, data.refresh_token);
    const me = await authAPI.me();
    set({ user: me.data, isAuthenticated: true });
    return me.data;
  },

  loginWithTokens: async (access, refresh) => {
    get().setTokens(access, refresh);
    const me = await authAPI.me();
    set({ user: me.data, isAuthenticated: true });
    return me.data;
  },

  logout: async () => {
    try { await authAPI.logout(); } catch (_) {}
    get().clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { data } = await authAPI.me();
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      get().clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),
}));

export default useAuthStore;
