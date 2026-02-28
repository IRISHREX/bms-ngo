import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchThemeState, updateTheme } from "@/lib/api";
import { applyTheme, isThemeKey } from "@/lib/theme";
import { toast } from "@/hooks/use-toast";
import {
  Check,
  ChevronDown,
  Cpu,
  Flame,
  Leaf,
  Moon,
  Palette,
  Snowflake,
  Sparkles,
  Sun,
  Sunset,
  Zap,
} from "lucide-react";

const THEME_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  hot: Flame,
  cyberpunk: Cpu,
  retro: Sunset,
  "golden-dark": Sparkles,
  "golden-silver": Sun,
  desart: Sun,
  forest: Leaf,
  snow: Snowflake,
  dark: Moon,
  blackpink: Zap,
};

export function ThemeStudioDropdown() {
  const queryClient = useQueryClient();

  const { data: themeState } = useQuery({
    queryKey: ["theme-state"],
    queryFn: fetchThemeState,
  });

  const themeMutation = useMutation({
    mutationFn: updateTheme,
    onSuccess: async (_data, themeKey) => {
      if (isThemeKey(themeKey)) {
        applyTheme(themeKey);
        localStorage.setItem("ngo_theme_key", themeKey);
      }
      await queryClient.invalidateQueries({ queryKey: ["theme-state"] });
      toast({ title: "Theme updated", description: `Applied ${themeKey}` });
    },
    onError: (error: Error) => {
      toast({ title: "Theme update failed", description: error.message, variant: "destructive" });
    },
  });

  const currentTheme = themeState?.themes.find((theme) => theme.themeKey === themeState.currentThemeKey);
  const CurrentIcon = THEME_ICONS[currentTheme?.themeKey || ""] || Palette;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-52 justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <CurrentIcon className="h-4 w-4 shrink-0" />
            <span className="truncate text-sm font-medium">{currentTheme?.label ?? "Theme Studio"}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Theme Studio</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(themeState?.themes || []).map((theme) => {
          const active = themeState?.currentThemeKey === theme.themeKey;
          const ThemeIcon = THEME_ICONS[theme.themeKey] || Palette;
          return (
            <DropdownMenuItem
              key={theme.themeKey}
              onClick={() => themeMutation.mutate(theme.themeKey)}
              disabled={themeMutation.isPending}
              className="flex items-center justify-between gap-2 py-2"
            >
              <span className="flex min-w-0 items-center gap-2">
                <ThemeIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">{theme.label}</span>
              </span>
              {active && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
