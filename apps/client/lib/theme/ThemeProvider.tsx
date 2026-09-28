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

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "auxio-theme";

/**
 * Runs before first paint (injected in <head>) so the correct palette is on
 * <html> immediately and the page never flashes the wrong theme.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");var d=p==="dark"||((!p||p==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

type ThemeContextValue = {
  preference: ThemePreference;
  theme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  // Suppress per-element transitions for one frame so the swap is instant
  // and uniform rather than a staggered colour wash.
  root.classList.add("theme-switching");
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  window.setTimeout(() => root.classList.remove("theme-switching"), 60);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [theme, setTheme] = useState<ResolvedTheme>("light");

  // Hydrate from storage after mount; the head script already painted correctly.
  useEffect(() => {
    const stored = readPreference();
    setPreferenceState(stored);
    setTheme(stored === "system" ? systemTheme() : stored);
  }, []);

  // Follow the OS only while the preference is "system".
  useEffect(() => {
    if (preference !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = query.matches ? "dark" : "light";
      setTheme(next);
      applyTheme(next);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    const resolved = next === "system" ? systemTheme() : next;
    setPreferenceState(next);
    setTheme(resolved);
    applyTheme(resolved);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
  }, []);

  const toggle = useCallback(() => {
    setPreference(theme === "dark" ? "light" : "dark");
  }, [setPreference, theme]);

  const value = useMemo(
    () => ({ preference, theme, setPreference, toggle }),
    [preference, theme, setPreference, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
