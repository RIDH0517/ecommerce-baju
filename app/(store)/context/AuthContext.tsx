"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  role: "CUSTOMER" | "ADMIN";
  createdAt: string;
}

export type AuthStatus = "loading" | "authenticated" | "guest";

interface AuthContextType {
  user: AuthUser | null;
  status: AuthStatus;
  isLoggedIn: boolean;
  refresh: () => Promise<AuthUser | null>;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const setUser = useCallback((nextUser: AuthUser | null) => {
    setUserState(nextUser);
    setStatus(nextUser ? "authenticated" : "guest");
  }, []);

  const refresh = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        setUserState(null);
        setStatus("guest");
        return null;
      }
      const data = await res.json();
      const loadedUser = (data?.user ?? null) as AuthUser | null;
      setUserState(loadedUser);
      setStatus(loadedUser ? "authenticated" : "guest");
      return loadedUser;
    } catch {
      setUserState(null);
      setStatus("guest");
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUserState(null);
      setStatus("guest");
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.removeItem("urbankamen_logged_in");
      localStorage.removeItem("urbankamen_user_email");
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }

    let active = true;
    fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        return (data?.user ?? null) as AuthUser | null;
      })
      .catch(() => null)
      .then((loadedUser) => {
        if (!active) return;
        setUserState(loadedUser);
        setStatus(loadedUser ? "authenticated" : "guest");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isLoggedIn: status === "authenticated" && user !== null,
        refresh,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth wajib digunakan di dalam AuthProvider");
  }
  return ctx;
}
