import themeData from "@assets/theme-sheet_1756536822604.json";

export type Theme = {
  name: string;
  tokens: Record<string, string>;
};

export const themes: Record<string, Theme> = themeData.themes;

export const themeNames = Object.keys(themes);

export function applyTheme(themeName: string) {
  const theme = themes[themeName];
  if (!theme) return;

  const root = document.documentElement;
  Object.entries(theme.tokens).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export function getTheme(): string {
  return localStorage.getItem("toby-theme") || "nomad";
}

export function setTheme(themeName: string) {
  localStorage.setItem("toby-theme", themeName);
  applyTheme(themeName);
}
