import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchVolunteers, formatDate, updateVolunteerStatus, type Volunteer } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import { Search, Download, Eye } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const statusColors: Record<Volunteer["status"], "default" | "secondary" | "outline" | "destructive"> = {
  new: "default",
  contacted: "secondary",
  approved: "outline",
  rejected: "destructive",
};

export default function VolunteerManager() {
  const queryClient = useQueryClient();
  const { data: volunteers = [], isLoading } = useQuery({ queryKey: ["volunteers"], queryFn: fetchVolunteers });
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Volunteer["status"] }) => updateVolunteerStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      toast({ title: "Status updated" });
      setUpdatingId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      setUpdatingId(null);
    },
  });

  const filtered = volunteers.filter(
    (v) => v.name.toLowerCase().includes(search.toLowerCase()) || v.email.toLowerCase().includes(search.toLowerCase())
  );

  const exportCsv = async () => {
    try {
      const base = import.meta.env.VITE_API_URL || "/api";
      const res = await fetch(`${base}/volunteers/export`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "volunteers.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed";
      toast({ title: "Export failed", description: message, variant: "destructive" });
    }
  };

  const handleStatusChange = (id: string, status: Volunteer["status"]) => {
    setUpdatingId(id);
    updateStatusMutation.mutate({ id, status });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Volunteers & Contacts</h1>
          <p className="page-description">{volunteers.length} submissions</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={exportCsv}>
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
                    <td className="px-4 py-3">
                      <Select value={v.status} onValueChange={(val) => handleStatusChange(v.id, val as Volunteer["status"])}>
                        <SelectTrigger className="h-8 w-[130px]" disabled={updatingId === v.id}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">new</SelectItem>
                          <SelectItem value="contacted">contacted</SelectItem>
                          <SelectItem value="approved">approved</SelectItem>
                          <SelectItem value="rejected">rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(v.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={statusColors[v.status]} className="text-xs capitalize">
                        <Eye className="w-3 h-3 mr-1" />
                        {v.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
