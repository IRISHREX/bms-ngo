import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchNotices, formatDate, type Notice } from "@/lib/api";
import { Pin, Plus, Edit, Trash2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const emptyNotice: Partial<Notice> = { title: "", description: "", publishDate: new Date().toISOString().split("T")[0], pinned: false, status: "draft" };

export default function NoticeManager() {
  const { data: notices = [], isLoading } = useQuery({ queryKey: ["notices"], queryFn: fetchNotices });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Notice>>(emptyNotice);
  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null);

  const openCreate = () => { setEditing({ ...emptyNotice }); setDialogOpen(true); };
  const openEdit = (n: Notice) => { setEditing({ ...n }); setDialogOpen(true); };
  const openDelete = (n: Notice) => { setDeleteTarget(n); setDeleteOpen(true); };

  const handleSave = () => {
    toast({ title: editing.id ? "Notice updated" : "Notice created", description: `"${editing.title}" saved successfully.` });
    setDialogOpen(false);
  };

  const handleDelete = () => {
    toast({ title: "Notice deleted", description: `"${deleteTarget?.title}" has been removed.` });
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Notices & Announcements</h1>
          <p className="page-description">{notices.length} notices published</p>
        </div>
        <Button className="gap-2" onClick={openCreate}><Plus className="w-4 h-4" /> New Notice</Button>
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="admin-card animate-pulse"><div className="h-16 bg-muted rounded" /></div>)
          : notices.map((notice) => (
              <div key={notice.id} className="admin-card flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {notice.pinned && <Pin className="w-3.5 h-3.5 text-primary" />}
                    <h3 className="text-sm font-semibold">{notice.title}</h3>
                    <Badge variant={notice.status === "active" ? "default" : "secondary"} className="text-xs">{notice.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{notice.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Published: {formatDate(notice.publishDate)}</span>
                    {notice.expiryDate && <span>Expires: {formatDate(notice.expiryDate)}</span>}
                    {notice.attachmentUrl && <span className="flex items-center gap-1"><Paperclip className="w-3 h-3" /> Attachment</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(notice)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDelete(notice)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing.id ? "Edit Notice" : "New Notice"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Title</Label><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Notice title" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Describe the notice…" rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Publish Date</Label><Input type="date" value={editing.publishDate ?? ""} onChange={(e) => setEditing({ ...editing, publishDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>Expiry Date</Label><Input type="date" value={editing.expiryDate ?? ""} onChange={(e) => setEditing({ ...editing, expiryDate: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editing.status ?? "draft"} onValueChange={(v) => setEditing({ ...editing, status: v as Notice["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="expired">Expired</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={editing.pinned ?? false} onCheckedChange={(v) => setEditing({ ...editing, pinned: v })} />
                <Label>Pin Notice</Label>
              </div>
            </div>
            <div className="space-y-2"><Label>Attachment</Label><Input type="file" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing.id ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notice</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.</AlertDialogDescription>
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
