'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import {
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  persistRefreshToken,
  api,
} from './api';

type User = { id: string; email: string; name: string } | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((u: User) => setUserState(u), []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<{ user: User; accessToken: string; refreshToken: string }>(
      '/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      }
    );
    setTokens(data.accessToken, data.refreshToken);
    persistRefreshToken(data.refreshToken);
    setUserState(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const data = await api<{ user: User; accessToken: string; refreshToken: string }>(
      '/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
        skipAuth: true,
      }
    );
    setTokens(data.accessToken, data.refreshToken);
    persistRefreshToken(data.refreshToken);
    setUserState(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST', skipAuth: true });
    } finally {
      clearTokens();
      setUserState(null);
    }
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    const rt = getRefreshToken();
    if (!rt) {
      setLoading(false);
      return;
    }
    if (token) {
      api<User>('/auth/me')
        .then(setUserState)
        .catch(() => setUserState(null))
        .finally(() => setLoading(false));
      return;
    }
    api<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
      skipAuth: true,
    })
      .then((data) => {
        setTokens(data.accessToken);
        return api<User>('/auth/me');
      })
      .then(setUserState)
      .catch(() => {
        clearTokens();
        setUserState(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
