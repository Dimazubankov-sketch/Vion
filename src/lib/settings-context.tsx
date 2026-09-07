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
import { translate, type Lang, type TranslationKey } from "./i18n";

interface Toggles {
  push: boolean;
  sounds: boolean;
  readReceipts: boolean;
}

interface SettingsValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
  toggles: Toggles;
  setToggle: (key: keyof Toggles, value: boolean) => void;
}

const STORAGE_KEY = "vion.settings";
const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [toggles, setToggles] = useState<Toggles>({
    push: true,
    sounds: true,
    readReceipts: true,
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { lang?: Lang; toggles?: Toggles };
        if (saved.lang) setLangState(saved.lang);
        if (saved.toggles) setToggles(saved.toggles);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: { lang: Lang; toggles: Toggles }) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l);
      persist({ lang: l, toggles });
    },
    [persist, toggles],
  );

  const setToggle = useCallback(
    (key: keyof Toggles, value: boolean) => {
      const next = { ...toggles, [key]: value };
      setToggles(next);
      persist({ lang, toggles: next });
    },
    [lang, persist, toggles],
  );

  const t = useCallback((key: TranslationKey) => translate(lang, key), [lang]);

  const value = useMemo(
    () => ({ lang, setLang, t, toggles, setToggle }),
    [lang, setLang, t, toggles, setToggle],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within <SettingsProvider>");
  return ctx;
}

/** Shorthand for components that only need the translator. */
export function useT() {
  return useSettings().t;
}
