'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loginPartner, getPartnerMe } from '@/lib/api/partner';
import { ssoExchange } from '@/lib/api/sso';
import type { Partner } from '@/types/partner';

type AuthContextType = {
  token: string | null;
  partner: Partner | null;
  loading: boolean;
  ready: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    setToken(null);
    setPartner(null);
    localStorage.removeItem('partner-auth');
    try {
      fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('partner-auth');
    if (saved) {
      const obj = JSON.parse(saved);
      if (obj?.token) setToken(obj.token);
      setReady(true);
    }
    if (!saved) {
      setReady(false);
      ssoExchange()
        .then((res) => {
          if (res?.token) {
            setToken(res.token);
            setPartner(res.partner);
            localStorage.setItem('partner-auth', JSON.stringify({ token: res.token }));
          }
        })
        .catch(() => {})
        .finally(() => {
          setReady(true);
        });
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function fetchMe() {
      if (!token) {
        setPartner(null);
        return;
      }
      try {
        const me = await getPartnerMe(token);
        if (active) setPartner(me);
      } catch (err) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : "";
        if (msg === "unauthorized" || msg === "forbidden_role") {
          logout();
          return;
        }
        setPartner(null);
      }
    }
    fetchMe();
    return () => {
      active = false;
    };
  }, [token, logout]);

  const login = async (email: string, password: string, remember?: boolean) => {
    setLoading(true);
    try {
      const res = await loginPartner(email.trim().toLowerCase(), password);
      setToken(res.token);
      setPartner(res.partner);
      try {
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: res.token, remember: !!remember }),
        });
      } catch {}
      if (remember) {
        localStorage.setItem('partner-auth', JSON.stringify({ token: res.token }));
      }
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({ token, partner, loading, ready, login, logout }),
    [token, partner, loading, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext not found');
  return ctx;
}
