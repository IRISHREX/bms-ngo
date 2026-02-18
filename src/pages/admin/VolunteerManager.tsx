import { useQuery } from "@tanstack/react-query";
import { fetchVolunteers, formatDate } from "@/lib/api";
import { Search, Download, Eye } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  new: "default",
  contacted: "secondary",
  approved: "outline",
  rejected: "destructive",
};

export default function VolunteerManager() {
  const { data: volunteers = [], isLoading } = useQuery({ queryKey: ["volunteers"], queryFn: fetchVolunteers });
  const [search, setSearch] = useState("");

  const filtered = volunteers.filter(
    (v) => v.name.toLowerCase().includes(search.toLowerCase()) || v.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Volunteers & Contacts</h1>
          <p className="page-description">{volunteers.length} submissions</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="admin-card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="table-header text-left px-4 py-3">Name</th>
              <th className="table-header text-left px-4 py-3">Email</th>
              <th className="table-header text-left px-4 py-3">Type</th>
              <th className="table-header text-left px-4 py-3">Status</th>
              <th className="table-header text-left px-4 py-3">Date</th>
              <th className="table-header text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border"><td colSpan={6} className="px-4 py-3"><div className="h-5 bg-muted rounded animate-pulse" /></td></tr>
                ))
              : filtered.map((v) => (
                  <tr key={v.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{v.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{v.email}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs capitalize">{v.type}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={statusColors[v.status] as any} className="text-xs capitalize">{v.status}</Badge></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(v.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
