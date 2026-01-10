"use client";

import * as React from "react";

type Theme = "dark" | "light";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "light",
}: ThemeProviderProps) {
  // Initialize theme from localStorage or default, matching the script in layout
  const getInitialTheme = (): Theme => {
    if (typeof window === "undefined") return defaultTheme;
    try {
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored && (stored === "dark" || stored === "light")) {
        return stored;
      }
      // Check system preference if no stored theme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "dark" : "light";
    } catch {
      return defaultTheme;
    }
  };

  const [theme, setTheme] = React.useState<Theme>(getInitialTheme);
  const [mounted, setMounted] = React.useState(false);

  // Sync with DOM on mount (script in layout already set it, but we sync state)
  React.useEffect(() => {
    setMounted(true);
    const root = window.document.documentElement;
    const currentTheme = root.classList.contains("dark") ? "dark" : "light";
    if (currentTheme !== theme) {
      setTheme(currentTheme);
    }
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  const toggleTheme = React.useCallback(() => {
    setTheme((prev) => {
      const newTheme = prev === "dark" ? "light" : "dark";
      return newTheme;
    });
  }, []);

  // Always provide the context, even before mount
  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

