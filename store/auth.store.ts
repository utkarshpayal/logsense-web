import { create } from "zustand";

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User | null, token: string | null, refreshToken?: string | null) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: (user, token, refreshToken) => {
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("user", JSON.stringify(user));
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }
      } else {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("refreshToken");
      }
    }
    set({ user, token, refreshToken: refreshToken || null, isAuthenticated: !!token, isLoading: false });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("refreshToken");
    }
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
  },
  initialize: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      const userStr = localStorage.getItem("user");
      let user = null;
      try {
        user = userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        // ignore
      }
      set({ user, token, refreshToken, isAuthenticated: !!token, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  }
}));
