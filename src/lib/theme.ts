export type ThemeKey =
  | "hot"
  | "cyberpunk"
  | "retro"
  | "golden-dark"
  | "golden-silver"
  | "desart"
  | "forest"
  | "snow"
  | "dark"
  | "blackpink";

type ThemeVars = Record<string, string>;

const BASE: ThemeVars = {
  "--background": "0 0% 98%",
  "--foreground": "222 47% 11%",
  "--card": "0 0% 100%",
  "--card-foreground": "222 47% 11%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "222 47% 11%",
  "--primary": "160 84% 39%",
  "--primary-foreground": "0 0% 100%",
  "--secondary": "210 20% 95%",
  "--secondary-foreground": "222 47% 11%",
  "--muted": "210 20% 96%",
  "--muted-foreground": "215 16% 47%",
  "--accent": "160 84% 39%",
  "--accent-foreground": "0 0% 100%",
  "--destructive": "0 84% 60%",
  "--destructive-foreground": "0 0% 100%",
  "--border": "214 20% 90%",
  "--input": "214 20% 90%",
  "--ring": "160 84% 39%",
  "--sidebar-background": "222 47% 7%",
  "--sidebar-foreground": "210 20% 80%",
  "--sidebar-primary": "160 84% 45%",
  "--sidebar-primary-foreground": "0 0% 100%",
  "--sidebar-accent": "222 30% 14%",
  "--sidebar-accent-foreground": "210 20% 90%",
  "--sidebar-border": "222 30% 16%",
  "--sidebar-ring": "160 84% 39%",
  "--sidebar-muted": "215 16% 47%",
  "--chart-emerald": "160 84% 39%",
  "--chart-blue": "217 91% 60%",
  "--chart-amber": "38 92% 50%",
  "--chart-rose": "0 84% 60%",
  "--chart-violet": "263 70% 50%",
  "--stat-up": "160 84% 39%",
  "--stat-down": "0 84% 60%",
};

const PRESETS: Record<ThemeKey, Partial<ThemeVars>> = {
  hot: {
    "--primary": "8 92% 58%",
    "--accent": "24 95% 53%",
    "--ring": "8 92% 58%",
    "--chart-rose": "8 92% 58%",
    "--chart-amber": "32 95% 53%",
  },
  cyberpunk: {
    "--background": "242 35% 8%",
    "--foreground": "185 85% 92%",
    "--card": "242 30% 12%",
    "--card-foreground": "185 85% 92%",
    "--primary": "189 100% 50%",
    "--primary-foreground": "0 0% 100%",
    "--accent": "316 100% 58%",
    "--accent-foreground": "0 0% 100%",
    "--border": "252 40% 22%",
    "--input": "252 40% 22%",
    "--ring": "189 100% 50%",
    "--chart-blue": "189 100% 50%",
    "--chart-violet": "316 100% 58%",
    "--chart-amber": "48 100% 55%",
  },
  retro: {
    "--background": "45 46% 94%",
    "--foreground": "18 25% 20%",
    "--card": "42 55% 97%",
    "--card-foreground": "18 25% 20%",
    "--primary": "15 65% 45%",
    "--primary-foreground": "0 0% 100%",
    "--accent": "185 54% 39%",
    "--accent-foreground": "0 0% 100%",
    "--muted": "40 36% 88%",
    "--border": "30 30% 80%",
    "--input": "30 30% 80%",
    "--ring": "15 65% 45%",
    "--chart-amber": "28 75% 48%",
    "--chart-blue": "185 54% 39%",
  },
  "golden-dark": {
    "--background": "30 22% 8%",
    "--foreground": "43 70% 90%",
    "--card": "28 20% 12%",
    "--card-foreground": "43 70% 90%",
    "--primary": "45 88% 52%",
    "--primary-foreground": "30 30% 10%",
    "--accent": "37 78% 58%",
    "--accent-foreground": "30 30% 10%",
    "--secondary": "30 16% 18%",
    "--secondary-foreground": "43 70% 90%",
    "--muted": "30 16% 18%",
    "--muted-foreground": "42 30% 70%",
    "--border": "34 25% 24%",
    "--input": "34 25% 24%",
    "--ring": "45 88% 52%",
    "--chart-amber": "45 88% 52%",
    "--chart-rose": "15 75% 58%",
  },
  "golden-silver": {
    "--background": "210 14% 96%",
    "--foreground": "224 10% 18%",
    "--card": "210 16% 99%",
    "--card-foreground": "224 10% 18%",
    "--primary": "44 92% 48%",
    "--primary-foreground": "224 10% 18%",
    "--accent": "220 9% 62%",
    "--accent-foreground": "0 0% 100%",
    "--secondary": "210 14% 90%",
    "--muted": "210 14% 92%",
    "--border": "215 12% 82%",
    "--input": "215 12% 82%",
    "--ring": "44 92% 48%",
    "--chart-amber": "44 92% 48%",
    "--chart-blue": "220 9% 62%",
  },
  desart: {
    "--background": "36 42% 95%",
    "--card": "34 45% 98%",
    "--primary": "28 68% 43%",
    "--accent": "19 62% 55%",
    "--ring": "28 68% 43%",
    "--muted": "36 24% 90%",
  },
  forest: {
    "--background": "140 24% 97%",
    "--card": "140 22% 99%",
    "--primary": "142 57% 33%",
    "--accent": "150 47% 39%",
    "--ring": "142 57% 33%",
    "--chart-emerald": "142 57% 33%",
  },
  snow: {
    "--background": "210 35% 99%",
    "--card": "210 45% 100%",
    "--primary": "200 84% 48%",
    "--accent": "214 92% 57%",
    "--ring": "200 84% 48%",
    "--muted": "210 30% 95%",
  },
  dark: {
    "--background": "222 47% 7%",
    "--foreground": "210 20% 95%",
    "--card": "222 30% 11%",
    "--card-foreground": "210 20% 95%",
    "--popover": "222 30% 11%",
    "--popover-foreground": "210 20% 95%",
    "--primary": "160 84% 45%",
    "--secondary": "222 30% 16%",
    "--secondary-foreground": "210 20% 90%",
    "--muted": "222 30% 16%",
    "--muted-foreground": "215 16% 55%",
    "--accent": "222 30% 16%",
    "--accent-foreground": "210 20% 90%",
    "--border": "222 30% 18%",
    "--input": "222 30% 18%",
    "--ring": "160 84% 45%",
  },
  blackpink: {
    "--background": "330 12% 7%",
    "--foreground": "330 12% 96%",
    "--card": "330 10% 12%",
    "--card-foreground": "330 12% 96%",
    "--popover": "330 10% 12%",
    "--popover-foreground": "330 12% 96%",
    "--primary": "328 94% 58%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "330 8% 18%",
    "--secondary-foreground": "330 12% 92%",
    "--accent": "328 94% 58%",
    "--accent-foreground": "0 0% 100%",
    "--border": "330 8% 22%",
    "--input": "330 8% 22%",
    "--ring": "328 94% 58%",
  },
};

export function applyTheme(themeKey: ThemeKey) {
  const root = document.documentElement;
  const merged = { ...BASE, ...(PRESETS[themeKey] || {}) };
  Object.entries(merged).forEach(([key, value]) => root.style.setProperty(key, value));
  root.setAttribute("data-theme-key", themeKey);
}

export function isThemeKey(value: string): value is ThemeKey {
  return Object.prototype.hasOwnProperty.call(PRESETS, value);
}
