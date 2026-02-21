export type ThemeKey =
  | "hot"
  | "cool"
  | "rainy.green"
  | "desart"
  | "forest"
  | "glass"
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
  cool: {
    "--primary": "206 89% 52%",
    "--accent": "193 95% 43%",
    "--ring": "206 89% 52%",
    "--chart-blue": "206 89% 52%",
    "--chart-violet": "225 84% 58%",
  },
  "rainy.green": {
    "--background": "150 20% 96%",
    "--card": "150 18% 98%",
    "--primary": "152 33% 39%",
    "--accent": "145 28% 45%",
    "--ring": "152 33% 39%",
    "--muted": "150 16% 92%",
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
  glass: {
    "--background": "210 28% 97%",
    "--card": "210 40% 99%",
    "--primary": "206 82% 46%",
    "--accent": "190 72% 48%",
    "--ring": "206 82% 46%",
    "--border": "210 32% 86%",
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
