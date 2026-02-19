import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats, fetchRecentActivity, formatCurrency } from "@/lib/api";
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
} from "lucide-react";

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

function formatRelativeTime(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  });

  const { data: recentActivity = [], isLoading: isActivityLoading } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: fetchRecentActivity,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-header">Dashboard</h1>
          <p className="page-description">Overview of your NGO operations</p>
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
        <h1 className="page-header">Dashboard</h1>
        <p className="page-description">Overview of your NGO operations</p>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Platform</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Total Donations" value={stats?.totalDonations.toLocaleString() ?? "0"} icon={IndianRupee} trend="+12% this month" />
          <StatCard title="Volunteers" value={stats?.totalVolunteers ?? 0} icon={Users} trend="+5 this week" />
          <StatCard title="Photos" value={stats?.totalPhotos ?? 0} icon={Image} />
          <StatCard title="Notices" value={stats?.totalNotices ?? 0} icon={Megaphone} />
          <StatCard title="Blog Posts" value={stats?.totalBlogPosts ?? 0} icon={FileText} />
          <StatCard title="Projects" value={stats?.totalProjects ?? 0} icon={Briefcase} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Donation Amount" value={formatCurrency(stats?.donationAmount ?? 0)} icon={IndianRupee} description="Total funds raised" trend="+18% this quarter" />
          <StatCard title="Students Helped" value={(stats?.studentsHelped ?? 0).toLocaleString()} icon={GraduationCap} description="Through education programs" />
          <StatCard title="Meals Served" value={(stats?.mealsServed ?? 0).toLocaleString()} icon={UtensilsCrossed} description="Food distribution drives" />
          <StatCard title="Villages Reached" value={stats?.villagesReached ?? 0} icon={MapPin} description="Across 3 states" />
        </div>
      </div>

      <div className="admin-card">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {isActivityLoading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="py-2 border-b border-border last:border-0">
              <div className="h-4 bg-muted rounded animate-pulse w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse w-24" />
            </div>
          ))}

          {!isActivityLoading && recentActivity.map((item, i) => (
            <div key={`${item.type}-${i}`} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <p className="text-sm text-foreground">{item.text}</p>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{formatRelativeTime(item.createdAt)}</span>
            </div>
          ))}

          {!isActivityLoading && recentActivity.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">No recent activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
