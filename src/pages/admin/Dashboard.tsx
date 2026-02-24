import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearRecentActivity,
  deleteRecentActivityItem,
  fetchDashboardStats,
  fetchRecentActivity,
  fetchThemeState,
  formatCurrency,
  updateTheme,
} from "@/lib/api";
import { applyTheme, isThemeKey } from "@/lib/theme";
import {
  IndianRupee,
  Users,
  Image,
  Megaphone,
  FileText,
  Briefcase,
  GraduationCap,
  UtensilsCrossed,
  MapPin,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: string;
}

function StatCard({ title, value, icon: Icon, description, trend }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold font-mono-stat text-foreground">{value}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-3 text-xs text-stat-up">
          <TrendingUp className="w-3 h-3" />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(
  dateStr: string,
  t: (key: string, vars?: Record<string, string | number>) => string,
) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return t("time.justNow");
  if (diffMin < 60) return t("time.minAgo", { count: diffMin });

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return t("time.hourAgo", { count: diffHours });

  const diffDays = Math.floor(diffHours / 24);
  return t("time.dayAgo", { count: diffDays });
}

export default function Dashboard() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  });

  const { data: recentActivity = [], isLoading: isActivityLoading } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: fetchRecentActivity,
  });

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

  const clearActivityMutation = useMutation({
    mutationFn: clearRecentActivity,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
      toast({ title: "Recent activity cleared" });
    },
    onError: (error: Error) => {
      toast({ title: "Clear failed", description: error.message, variant: "destructive" });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: (key: string) => deleteRecentActivityItem(key),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
      toast({ title: "Activity removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-header">{t("dashboard.title")}</h1>
          <p className="page-description">{t("dashboard.subtitle")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-header">{t("dashboard.title")}</h1>
        <p className="page-description">{t("dashboard.subtitle")}</p>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">{t("dashboard.platform")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title={t("dashboard.stat.totalDonations")} value={stats?.totalDonations.toLocaleString() ?? "0"} icon={IndianRupee} trend={t("dashboard.trend.donationsMonth")} />
          <StatCard title={t("dashboard.stat.volunteers")} value={stats?.totalVolunteers ?? 0} icon={Users} trend={t("dashboard.trend.volunteersWeek")} />
          <StatCard title={t("dashboard.stat.photos")} value={stats?.totalPhotos ?? 0} icon={Image} />
          <StatCard title={t("dashboard.stat.notices")} value={stats?.totalNotices ?? 0} icon={Megaphone} />
          <StatCard title={t("dashboard.stat.blogPosts")} value={stats?.totalBlogPosts ?? 0} icon={FileText} />
          <StatCard title={t("dashboard.stat.projects")} value={stats?.totalProjects ?? 0} icon={Briefcase} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">{t("dashboard.impact")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title={t("dashboard.stat.donationAmount")} value={formatCurrency(stats?.donationAmount ?? 0)} icon={IndianRupee} description={t("dashboard.desc.totalFunds")} trend={t("dashboard.trend.quarter")} />
          <StatCard title={t("home.stats.students")} value={(stats?.studentsHelped ?? 0).toLocaleString()} icon={GraduationCap} description={t("dashboard.desc.education")} />
          <StatCard title={t("home.stats.meals")} value={(stats?.mealsServed ?? 0).toLocaleString()} icon={UtensilsCrossed} description={t("dashboard.desc.food")} />
          <StatCard title={t("home.stats.villages")} value={stats?.villagesReached ?? 0} icon={MapPin} description={t("dashboard.desc.states")} />
        </div>
      </div>

      <div className="admin-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t("dashboard.themeStudio")}</h2>
          <p className="text-xs text-muted-foreground">{t("dashboard.themeDesc")}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {(themeState?.themes || []).map((theme) => {
            const active = themeState?.currentThemeKey === theme.themeKey;
            return (
              <Button
                key={theme.themeKey}
                variant={active ? "default" : "outline"}
                className="justify-start"
                onClick={() => themeMutation.mutate(theme.themeKey)}
                disabled={themeMutation.isPending}
              >
                {theme.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="admin-card">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="text-lg font-semibold">{t("dashboard.recentActivity")}</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearActivityMutation.mutate()}
            disabled={clearActivityMutation.isPending || isActivityLoading || recentActivity.length === 0}
          >
            Clear All
          </Button>
        </div>
        <div className="space-y-3">
          {isActivityLoading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="py-2 border-b border-border last:border-0">
              <div className="h-4 bg-muted rounded animate-pulse w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse w-24" />
            </div>
          ))}

          {!isActivityLoading && recentActivity.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-3">
              <p className="text-sm text-foreground">{item.text}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">{formatRelativeTime(item.createdAt, t)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => deleteActivityMutation.mutate(item.key)}
                  disabled={deleteActivityMutation.isPending}
                  aria-label="Delete activity"
                  title="Delete activity"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {!isActivityLoading && recentActivity.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">{t("dashboard.noActivity")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
