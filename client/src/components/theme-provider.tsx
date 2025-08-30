import React, { createContext, useContext, useEffect, useState } from "react";
import { applyTheme, getTheme, setTheme as setStoredTheme } from "@/lib/themes";

type ThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<string>(getTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleSetTheme = (newTheme: string) => {
    setTheme(newTheme);
    setStoredTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
