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
    if (storedToken && storedUser) {
      const parsed = JSON.parse(storedUser) as User;
      setToken(storedToken);
      setUser(parsed);

      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      // Refresh user profile + credits in parallel
      fetch(`${apiBase}/auth/me`, { headers: { Authorization: `Bearer ${storedToken}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.user) {
            const updated = { ...parsed, ...data.user };
            localStorage.setItem('auth_user', JSON.stringify(updated));
            setUser(updated);
          }
        })
        .catch(() => {});

      // Fetch live credits
      fetch(`${apiBase}/payments/credits`, { headers: { Authorization: `Bearer ${storedToken}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.credits !== undefined) {
            setUser(prev => prev ? { ...prev, credits: data.credits } : prev);
          }
        })
        .catch(() => {});
    }
    setIsLoading(false);
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
