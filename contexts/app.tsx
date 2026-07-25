"use client";
// Single context for both locale (i18n) and theme (dark/light).
// Stored in localStorage under "av-locale" and "av-theme".
// Theme is also applied as data-theme="light|dark" on <html>.

import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
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

export function AppProvider({ children }: { children: ReactNode }) {
  // Default to "fr" / "dark" — matches SSR output.
  // A useEffect applies the saved preference after hydration.
  const [locale, setLocale] = useState<Locale>("fr");
  const [theme,  setTheme]  = useState<Theme>("dark");

  useEffect(() => {
    const savedLocale = localStorage.getItem("av-locale") as Locale | null;
    const savedTheme  = localStorage.getItem("av-theme")  as Theme  | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time sync from localStorage after hydration
    if (savedLocale === "en") setLocale("en");
    if (savedTheme  === "light") {
      setTheme("light");
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale((prev) => {
      const next: Locale = prev === "fr" ? "en" : "fr";
      localStorage.setItem("av-locale", next);
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("av-theme", next);
      document.documentElement.setAttribute("data-theme",  next);
      return next;
    });
  }, []);

  return (
    <AppContext.Provider value={{ locale, theme, t: translations[locale], toggleLocale, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
