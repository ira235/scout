"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { THEMES, themeStyleVars, type ThemeName } from "@/lib/themes";

interface Ctx {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}
const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({
  children,
  initialTheme = "sage",
}: {
  children: ReactNode;
  initialTheme?: ThemeName;
}) {
  const [theme, setThemeState] = useState<ThemeName>(initialTheme);

  useEffect(() => {
    const stored = (typeof window !== "undefined" ? localStorage.getItem("scout-theme") : null) as ThemeName | null;
    if (stored && THEMES[stored]) setThemeState(stored);
  }, []);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    try {
      localStorage.setItem("scout-theme", t);
    } catch {}
  };

  const vars = themeStyleVars(theme);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div style={{ ...vars, minHeight: "100vh", background: "var(--bg)" }}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme outside ThemeProvider");
  return ctx;
}
