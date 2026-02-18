import { Shield, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const mockUsers = [
  { id: "1", name: "Admin User", email: "admin@ngo.org", role: "Super Admin", status: "active" },
  { id: "2", name: "Content Editor", email: "editor@ngo.org", role: "Content Manager", status: "active" },
  { id: "3", name: "Finance Lead", email: "finance@ngo.org", role: "Finance Admin", status: "active" },
];

export default function UsersRoles() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Users & Roles</h1>
          <p className="page-description">Manage admin access and permissions</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Add User
        </Button>
      </div>

      {/* Role overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { role: "Super Admin", desc: "Full access to all modules", count: 1 },
          { role: "Content Manager", desc: "Blog, Gallery, Notices", count: 1 },
          { role: "Finance Admin", desc: "Donations, Reports", count: 1 },
        ].map((r) => (
          <div key={r.role} className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold">{r.role}</p>
            </div>
            <p className="text-xs text-muted-foreground">{r.desc}</p>
            <p className="text-xs text-muted-foreground mt-2">{r.count} user(s)</p>
          </div>
        ))}
      </div>

      <div className="admin-card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="table-header text-left px-4 py-3">Name</th>
              <th className="table-header text-left px-4 py-3">Email</th>
              <th className="table-header text-left px-4 py-3">Role</th>
              <th className="table-header text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((u) => (
              <tr key={u.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium">{u.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{u.role}</Badge></td>
                <td className="px-4 py-3"><Badge variant="outline" className="text-xs capitalize">{u.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
