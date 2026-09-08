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
import { emailFor, normalizeUsername } from "./accounts";

export interface VoyzenUser {
  name: string;
  handle: string;
  email: string;
  phone?: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  location?: string;
  website?: string;
  following: number;
  followers: number;
}

interface AuthValue {
  user: VoyzenUser | null;
  ready: boolean;
  /** Drop straight into the app with an already-verified account. */
  signIn: (account: { username: string; name: string; phone?: string }) => void;
  signUp: (name: string, username: string, phone: string) => void;
  signOut: () => void;
  updateUser: (patch: Partial<VoyzenUser>) => void;
}

const STORAGE_KEY = "voyzen.user";
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<VoyzenUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // Sessions saved before these fields existed still need sane numbers.
        const saved = JSON.parse(raw) as Partial<VoyzenUser>;
        setUser({
          following: 394,
          followers: 28300,
          ...saved,
        } as VoyzenUser);
      }
    } catch {
      /* ignore unavailable storage */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: VoyzenUser | null) => {
    setUser(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const signIn = useCallback(
    ({ username, name, phone }: { username: string; name: string; phone?: string }) => {
      persist({
        name: name || "Voyzen User",
        handle: normalizeUsername(username),
        email: emailFor(username),
        phone,
        following: 394,
        followers: 28300,
      });
    },
    [persist],
  );

  const signUp = useCallback(
    (name: string, username: string, phone: string) => {
      persist({
        name: name || "Voyzen User",
        handle: normalizeUsername(username),
        email: emailFor(username),
        phone,
        following: 0,
        followers: 0,
      });
    },
    [persist],
  );

  const signOut = useCallback(() => persist(null), [persist]);

  const updateUser = useCallback(
    (patch: Partial<VoyzenUser>) =>
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
