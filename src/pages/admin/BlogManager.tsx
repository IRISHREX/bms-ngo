import { useQuery } from "@tanstack/react-query";
import { fetchBlogPosts, formatDate } from "@/lib/api";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BlogManager() {
  const { data: posts = [], isLoading } = useQuery({ queryKey: ["blog-posts"], queryFn: fetchBlogPosts });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Blog Manager</h1>
          <p className="page-description">{posts.length} posts &middot; {posts.filter(p => p.status === "published").length} published</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> New Post
        </Button>
      </div>

      <div className="admin-card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="table-header text-left px-4 py-3">Title</th>
              <th className="table-header text-left px-4 py-3">Status</th>
              <th className="table-header text-left px-4 py-3">Tags</th>
              <th className="table-header text-left px-4 py-3">Created</th>
              <th className="table-header text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border"><td colSpan={5} className="px-4 py-3"><div className="h-5 bg-muted rounded animate-pulse" /></td></tr>
                ))
              : posts.map((post) => (
                  <tr key={post.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{post.title}</td>
                    <td className="px-4 py-3">
                      <Badge variant={post.status === "published" ? "default" : "secondary"} className="text-xs">
                        {post.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">{post.tags.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(post.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
