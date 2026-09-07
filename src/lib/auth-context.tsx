"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface VionUser {
  name: string;
  handle: string;
  email: string;
  avatar?: string;
  banner?: string;
  bio?: string;
}

interface AuthValue {
  user: VionUser | null;
  ready: boolean;
  signIn: (email: string) => void;
  signUp: (name: string, email: string) => void;
  signOut: () => void;
  updateUser: (patch: Partial<VionUser>) => void;
}

const STORAGE_KEY = "vion.user";
const AuthContext = createContext<AuthValue | null>(null);

/** Derive an @handle from a name or email. */
function handleFrom(seed: string) {
  const base = seed.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return base || "vionaut";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<VionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as VionUser);
    } catch {
      /* ignore unavailable storage */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: VionUser | null) => {
    setUser(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const signIn = useCallback(
    (email: string) => {
      const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      persist({ name: name || "Vion User", handle: handleFrom(email), email });
    },
    [persist],
  );

  const signUp = useCallback(
    (name: string, email: string) => {
      persist({ name: name || "Vion User", handle: handleFrom(name || email), email });
    },
    [persist],
  );

  const signOut = useCallback(() => persist(null), [persist]);

  const updateUser = useCallback(
    (patch: Partial<VionUser>) =>
      setUser((current) => {
        if (!current) return current;
        const next = { ...current, ...patch };
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      }),
    [],
  );

  const value = useMemo(
    () => ({ user, ready, signIn, signUp, signOut, updateUser }),
    [user, ready, signIn, signUp, signOut, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
