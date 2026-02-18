import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { logout, getUser } from "@/lib/auth";
import {
  LayoutDashboard, FolderOpen, Image, Megaphone, FileText, Briefcase, Users, IndianRupee, Shield,
  ChevronLeft, ChevronRight, Heart, LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "File Manager", url: "/admin/files", icon: FolderOpen },
  { title: "Gallery", url: "/admin/gallery", icon: Image },
  { title: "Notices", url: "/admin/notices", icon: Megaphone },
  { title: "Blog", url: "/admin/blog", icon: FileText },
  { title: "Projects", url: "/admin/projects", icon: Briefcase },
  { title: "Volunteers", url: "/admin/volunteers", icon: Users },
  { title: "Donations", url: "/admin/donations", icon: IndianRupee },
  { title: "Users & Roles", url: "/admin/users", icon: Shield },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside className={cn("flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 sticky top-0", collapsed ? "w-16" : "w-64")}>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <Heart className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-sidebar-accent-foreground truncate">NGO Admin</h1>
            <p className="text-xs text-sidebar-muted truncate">{user?.name ?? "Dashboard"}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.url} to={item.url} end={item.url === "/admin"}
            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", collapsed && "justify-center px-2")}
            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button onClick={handleLogout} className={cn("flex items-center gap-3 mx-2 mb-2 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors", collapsed && "justify-center px-2")}>
        <LogOut className="w-4 h-4 flex-shrink-0" />
        {!collapsed && <span>Logout</span>}
      </button>

      <button onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-accent-foreground transition-colors">
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
