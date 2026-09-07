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
  user: VionUser | null;
  ready: boolean;
  /** Sign in with an email or a phone number — whichever the user gave. */
  signIn: (identifier: { email?: string; phone?: string }) => void;
  signUp: (name: string, email: string, phone: string) => void;
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
      if (raw) {
        // Sessions saved before these fields existed still need sane numbers.
        const saved = JSON.parse(raw) as Partial<VionUser>;
        setUser({
          following: 394,
          followers: 28300,
          ...saved,
        } as VionUser);
      }
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
    ({ email, phone }: { email?: string; phone?: string }) => {
      const seed = email ?? phone ?? "";
      const name = email
        ? email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "Vion User";
      persist({
        name,
        handle: handleFrom(seed),
        email: email ?? "",
        phone,
        following: 394,
        followers: 28300,
      });
    },
    [persist],
  );

  const signUp = useCallback(
    (name: string, email: string, phone: string) => {
      persist({
        name: name || "Vion User",
        handle: handleFrom(name || email),
        email,
        phone,
        following: 0,
        followers: 0,
      });
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
