import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBlogPosts, formatDate, type BlogPost } from "@/lib/api";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const emptyPost: Partial<BlogPost> = { title: "", content: "", status: "draft", tags: [] };

export default function BlogManager() {
  const { data: posts = [], isLoading } = useQuery({ queryKey: ["blog-posts"], queryFn: fetchBlogPosts });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<BlogPost>>(emptyPost);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [tagInput, setTagInput] = useState("");

  const openCreate = () => { setEditing({ ...emptyPost }); setTagInput(""); setDialogOpen(true); };
  const openEdit = (p: BlogPost) => { setEditing({ ...p }); setTagInput(p.tags.join(", ")); setDialogOpen(true); };
  const openDelete = (p: BlogPost) => { setDeleteTarget(p); setDeleteOpen(true); };

  const handleSave = () => {
    const tags = tagInput.split(",").map(t => t.trim()).filter(Boolean);
    toast({ title: editing.id ? "Post updated" : "Post created", description: `"${editing.title}" saved.` });
    setDialogOpen(false);
  };

  const handleDelete = () => {
    toast({ title: "Post deleted", description: `"${deleteTarget?.title}" removed.` });
    setDeleteOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Blog Manager</h1>
          <p className="page-description">{posts.length} posts &middot; {posts.filter(p => p.status === "published").length} published</p>
        </div>
        <Button className="gap-2" onClick={openCreate}><Plus className="w-4 h-4" /> New Post</Button>
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
                    <td className="px-4 py-3"><Badge variant={post.status === "published" ? "default" : "secondary"} className="text-xs">{post.status}</Badge></td>
                    <td className="px-4 py-3"><div className="flex gap-1">{post.tags.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}</div></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(post.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(post)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDelete(post)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing.id ? "Edit Post" : "New Post"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Title</Label><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Post title" /></div>
            <div className="space-y-2"><Label>Content</Label><Textarea value={editing.content ?? ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} placeholder="Write your blog post…" rows={6} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editing.status ?? "draft"} onValueChange={(v) => setEditing({ ...editing, status: v as BlogPost["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Cover Image</Label><Input type="file" accept="image/*" /></div>
            </div>
            <div className="space-y-2"><Label>Tags (comma-separated)</Label><Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="education, impact, report" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing.id ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{deleteTarget?.title}"? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
