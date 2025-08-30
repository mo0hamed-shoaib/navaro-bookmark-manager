import themeData from "@assets/themes_1756537767262.json";

export type OriginalTheme = {
  name: string;
  Colors: {
    "Background color": string;
    "Text color": string;
    "Muted background color": string;
    "Muted text color": string;
  };
  Typography: {
    "Sans-serif font": string;
    "Serif font": string;
    "Monospace font": string;
  };
  "Shape & Spacing": {
    "Border radius": string;
  };
  Components: {
    Actions: {
      "Primary background": string;
      "Primary text": string;
      "Secondary background": string;
      "Secondary text": string;
      "Accent background": string;
      "Accent text": string;
      "Destructive background": string;
      "Destructive text": string;
    };
    Forms: {
      Input: string;
      Border: string;
      "Focus Border": string;
    };
    Containers: {
      "Card background": string;
      "Card text": string;
      "Popover background": string;
      "Popover text": string;
    };
    Charts: {
      "Chart 1": string;
      "Chart 2": string;
      "Chart 3": string;
      "Chart 4": string;
      "Chart 5": string;
    };
  };
};

export type ConvertedTheme = {
  name: string;
  tokens: Record<string, string>;
};

// Convert original theme format to shadcn/ui compatible CSS custom properties
function convertTheme(originalTheme: OriginalTheme): ConvertedTheme {
  const tokens: Record<string, string> = {
    // Basic colors
    "--background": originalTheme.Colors["Background color"],
    "--foreground": originalTheme.Colors["Text color"],
    "--muted": originalTheme.Colors["Muted background color"],
    "--muted-foreground": originalTheme.Colors["Muted text color"],
    
    // Card colors
    "--card": originalTheme.Components.Containers["Card background"],
    "--card-foreground": originalTheme.Components.Containers["Card text"],
    
    // Popover colors
    "--popover": originalTheme.Components.Containers["Popover background"],
    "--popover-foreground": originalTheme.Components.Containers["Popover text"],
    
    // Action colors
    "--primary": originalTheme.Components.Actions["Primary background"],
    "--primary-foreground": originalTheme.Components.Actions["Primary text"],
    "--primary-hover": originalTheme.Components.Actions["Primary background"], // Using same for now
    
    "--secondary": originalTheme.Components.Actions["Secondary background"],
    "--secondary-foreground": originalTheme.Components.Actions["Secondary text"],
    "--secondary-hover": originalTheme.Components.Actions["Secondary background"], // Using same for now
    
    "--accent": originalTheme.Components.Actions["Accent background"],
    "--accent-foreground": originalTheme.Components.Actions["Accent text"],
    
    "--destructive": originalTheme.Components.Actions["Destructive background"],
    "--destructive-foreground": originalTheme.Components.Actions["Destructive text"],
    
    // Form colors
    "--border": originalTheme.Components.Forms["Border"],
    "--input": originalTheme.Components.Forms["Input"],
    "--ring": originalTheme.Components.Forms["Focus Border"],
    "--link": originalTheme.Components.Actions["Primary background"],
    
    // Chart colors
    "--chart-1": originalTheme.Components.Charts["Chart 1"],
    "--chart-2": originalTheme.Components.Charts["Chart 2"],
    "--chart-3": originalTheme.Components.Charts["Chart 3"],
    "--chart-4": originalTheme.Components.Charts["Chart 4"],
    "--chart-5": originalTheme.Components.Charts["Chart 5"],
    
    // Typography
    "--font-sans": originalTheme.Typography["Sans-serif font"],
    "--font-serif": originalTheme.Typography["Serif font"],
    "--font-mono": originalTheme.Typography["Monospace font"],
    
    // Spacing
    "--radius": originalTheme["Shape & Spacing"]["Border radius"],
  };
  
  return {
    name: originalTheme.name,
    tokens
  };
}

// Convert all themes
const originalThemes: OriginalTheme[] = themeData.Themes;
export const themes: Record<string, ConvertedTheme> = {};

originalThemes.forEach(theme => {
  const converted = convertTheme(theme);
  themes[theme.name.toLowerCase().replace(/\s+/g, '-')] = converted;
});

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
