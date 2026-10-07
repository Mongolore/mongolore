"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { PageTranslator, type TranslatorError, type TranslatorStatus } from "./translator";
import { storedValue } from "./storage";

export type Lang = "mn" | "en";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  status: TranslatorStatus;
  error?: TranslatorError;
  /** Resolves once on-screen text is in the current language. */
  whenReady: () => Promise<void>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const langStore = storedValue("mongolore:lang", "mn");

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(langStore.subscribe, langStore.get, langStore.getServer) as Lang;
  const [status, setStatus] = useState<TranslatorStatus>("idle");
  const [error, setError] = useState<TranslatorError>();
  const translator = useRef<PageTranslator | null>(null);

  useEffect(() => {
    const t = new PageTranslator();
    translator.current = t;
    const unsubscribe = t.subscribe((next, err) => {
      setStatus(next);
      setError(next === "error" ? err : undefined);
    });
    return () => {
      unsubscribe();
      t.stop();
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    if (lang === "en") translator.current?.start();
    else translator.current?.stop();
  }, [lang]);

  const setLang = useCallback((next: Lang) => langStore.set(next), []);

  const toggle = useCallback(() => setLang(lang === "mn" ? "en" : "mn"), [lang, setLang]);
  const whenReady = useCallback(() => translator.current?.whenIdle() ?? Promise.resolve(), []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, status, error, whenReady }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
