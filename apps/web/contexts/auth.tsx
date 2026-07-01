"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  credits?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCredits = useCallback(async () => {
    if (!localStorage.getItem('auth_token')) return;
    try {
      const { credits } = await api.payments.getCredits();
      setUser(prev => prev ? { ...prev, credits } : prev);
    } catch {
      // ignore — not critical
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (!storedToken || !storedUser) {
      // No stored session — resolve immediately
      setIsLoading(false);
      return;
    }

    const parsed = JSON.parse(storedUser) as User;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    // Validate the stored token with the server before marking auth as resolved.
    // This prevents ProtectedLayout from briefly seeing a stale logged-in state.
    fetch(`${apiBase}/auth/me`, { headers: { Authorization: `Bearer ${storedToken}` } })
      .then(r => {
        if (r.status === 401) {
          // Token expired or revoked — discard the stale session entirely
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          return null;
        }
        if (r.ok) {
          // Token valid — seed state from localStorage immediately so UI is instant,
          // then overwrite with fresh server data once the JSON parses
          setToken(storedToken);
          setUser(parsed);
          return r.json();
        }
        return null;
      })
      .then(data => {
        if (data?.user) {
          const updated = { ...parsed, ...data.user };
          localStorage.setItem('auth_user', JSON.stringify(updated));
          setUser(updated);
        }
      })
      .catch(() => {
        // Network error — keep localStorage state so the app works offline-ish
        setToken(storedToken);
        setUser(parsed);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Fetch live credits in parallel (non-blocking, doesn't affect isLoading)
    fetch(`${apiBase}/payments/credits`, { headers: { Authorization: `Bearer ${storedToken}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.credits !== undefined) {
          setUser(prev => prev ? { ...prev, credits: data.credits } : prev);
        }
      })
      .catch(() => {});
  }, []);

  function login(newToken: string, newUser: User) {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    // Fetch credits after login
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    fetch(`${apiBase}/payments/credits`, { headers: { Authorization: `Bearer ${newToken}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.credits !== undefined) {
          setUser(prev => prev ? { ...prev, credits: data.credits } : prev);
        }
      })
      .catch(() => {});
  }

  function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshCredits }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
