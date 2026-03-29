import { create } from 'zustand';
import type { User } from '@mocktrade/shared';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  updateUser: (user: User) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,

  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isHydrated: true });
  },

  updateUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set((state) => ({
      user,
      token: state.token,
      isAuthenticated: !!state.token,
      isHydrated: true,
    }));
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false, isHydrated: true });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, token, isAuthenticated: true, isHydrated: true });
        return;
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false, isHydrated: true });
  },
}));
