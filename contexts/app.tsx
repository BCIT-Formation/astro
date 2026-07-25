"use client";
// Single context for both locale (i18n) and theme (dark/light).
// Stored in localStorage under "av-locale" and "av-theme".
// Theme is also applied as data-theme="light|dark" on <html>.

import {
  createContext, useContext, useState, useEffect, useCallback,
  useSyncExternalStore, type ReactNode,
} from "react";
import { type Locale, translations } from "@/lib/i18n";

type Theme = "dark" | "light";

interface AppContextValue {
  locale:       Locale;
  theme:        Theme;
  t:            typeof translations["fr"];
  toggleLocale: () => void;
  toggleTheme:  () => void;
}

const AppContext = createContext<AppContextValue>({
  locale:       "fr",
  theme:        "dark",
  t:            translations.fr,
  toggleLocale: () => {},
  toggleTheme:  () => {},
});

// Hydration gate: false during SSR/hydration, true on the client afterwards.
const emptySubscribe = () => () => {};
const useIsHydrated = () =>
  useSyncExternalStore(emptySubscribe, () => true, () => false);

export function AppProvider({ children }: { children: ReactNode }) {
  // SSR renders the "fr" / "dark" defaults; after hydration the saved
  // preference is read from localStorage until the user toggles.
  const isHydrated = useIsHydrated();
  const [localeOverride, setLocaleOverride] = useState<Locale | null>(null);
  const [themeOverride,  setThemeOverride]  = useState<Theme  | null>(null);

  const savedLocale = isHydrated ? localStorage.getItem("av-locale") : null;
  const savedTheme  = isHydrated ? localStorage.getItem("av-theme")  : null;

  const locale: Locale = localeOverride ?? (savedLocale === "en"    ? "en"    : "fr");
  const theme:  Theme  = themeOverride  ?? (savedTheme  === "light" ? "light" : "dark");

  // Keep the <html data-theme> attribute in sync with the current theme.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleLocale = useCallback(() => {
    const next: Locale = locale === "fr" ? "en" : "fr";
    localStorage.setItem("av-locale", next);
    setLocaleOverride(next);
  }, [locale]);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("av-theme", next);
    setThemeOverride(next);
  }, [theme]);

  return (
    <AppContext.Provider value={{ locale, theme, t: translations[locale], toggleLocale, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
