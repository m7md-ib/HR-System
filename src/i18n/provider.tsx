"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { dirFor, type Locale } from "./config";
import type { Dictionary } from "./dictionaries/ar";

interface I18nContextValue {
  locale: Locale;
  dict: Dictionary;
  dir: "rtl" | "ltr";
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ locale, dict, dir: dirFor(locale) }), [locale, dict]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
