"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, apiPost } from "@/lib/api";
import {
  deleteCookie,
  getCookie,
  ROLE_COOKIE,
  setCookie,
  TOKEN_COOKIE,
} from "@/lib/cookies";
import type { User } from "@/lib/types";

export interface RegisterPayload {
  email: string;
  username: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function persistSession(token: string, user: User) {
  setCookie(TOKEN_COOKIE, token, 7);
  setCookie(ROLE_COOKIE, user.role, 7);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getCookie(TOKEN_COOKIE);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api<{ user: User }>("/user/profile");
      setUser(data.user);
      setCookie(ROLE_COOKIE, data.user.role, 7);
    } catch {
      deleteCookie(TOKEN_COOKIE);
      deleteCookie(ROLE_COOKIE);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const data = await apiPost<{ user: User; token: string }>(
        "/auth/login",
        { identifier, password }
      );
      persistSession(data.token, data.user);
      setUser(data.user);
      return data.user;
    },
    []
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await apiPost<{ user: User; token: string }>(
      "/auth/register",
      payload
    );
    persistSession(data.token, data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    deleteCookie(TOKEN_COOKIE);
    deleteCookie(ROLE_COOKIE);
    setUser(null);
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refresh, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Post-login destination by role. */
export function homeForRole(role: string) {
  return role === "admin" ? "/admin" : "/dashboard";
}
