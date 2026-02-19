import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteGalleryItem, fetchGallery, updateGalleryItem, uploadGalleryPhotos, type GalleryItem } from "@/lib/api";
import { Upload, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const categories = [
  { label: "All", value: "all" },
  { label: "Events", value: "events" },
  { label: "Beneficiaries", value: "beneficiaries" },
  { label: "Volunteers", value: "volunteers" },
  { label: "Field Visits", value: "field-visits" },
] as const;

const categoryLabel = (value: string) => categories.find((c) => c.value === value)?.label || value;

const emptyItem: Partial<GalleryItem> = { caption: "", category: "events" };

export default function GalleryManager() {
  const queryClient = useQueryClient();
  const { data: galleryItems = [], isLoading } = useQuery({ queryKey: ["gallery"], queryFn: fetchGallery });

  const [activeCategory, setActiveCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<GalleryItem>>(emptyItem);
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const filtered = activeCategory === "all" ? galleryItems : galleryItems.filter((g) => g.category === activeCategory);

  const uploadMutation = useMutation({
    mutationFn: ({ files, category, caption }: { files: File[]; category: string; caption: string }) => uploadGalleryPhotos(files, category, caption),
    onSuccess: async (_, vars) => {
      await queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast({ title: "Photos uploaded", description: `${vars.files.length} photo(s) uploaded.` });
      setDialogOpen(false);
      setSelectedFiles([]);
    },
    onError: (error: Error) => toast({ title: "Upload failed", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, caption, category }: { id: string; caption: string; category: string }) => updateGalleryItem(id, { caption, category }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast({ title: "Photo updated", description: `"${editing.caption}" saved.` });
      setDialogOpen(false);
    },
    onError: (error: Error) => toast({ title: "Update failed", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGalleryItem(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast({ title: "Photo deleted", description: `"${deleteTarget?.caption}" removed.` });
      setDeleteOpen(false);
    },
    onError: (error: Error) => toast({ title: "Delete failed", description: error.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setEditing({ ...emptyItem });
    setSelectedFiles([]);
    setDialogOpen(true);
  };

  const openEdit = (item: GalleryItem) => {
    setEditing({ ...item });
    setSelectedFiles([]);
    setDialogOpen(true);
  };

  const openDelete = (item: GalleryItem) => {
    setDeleteTarget(item);
    setDeleteOpen(true);
  };

  const handleSave = () => {
    const caption = (editing.caption || "").trim();
    const category = editing.category || "events";

    if (editing.id) {
      updateMutation.mutate({ id: editing.id, caption, category });
      return;
    }

    if (selectedFiles.length === 0) {
      toast({ title: "No files selected", description: "Select at least one photo to upload.", variant: "destructive" });
      return;
    }

    uploadMutation.mutate({ files: selectedFiles, category, caption });
  };

  const handleDelete = () => {
    if (!deleteTarget?.id) return;
    deleteMutation.mutate(deleteTarget.id);
  };

  const busy = uploadMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Gallery Manager</h1>
          <p className="page-description">{galleryItems.length} photos across {categories.length - 1} categories</p>
        </div>
        <Button className="gap-2" onClick={openCreate}><Upload className="w-4 h-4" /> Upload Photos</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${activeCategory === cat.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="admin-card p-0 overflow-hidden animate-pulse"><div className="aspect-video bg-muted" /></div>
        )) : filtered.map((item) => (
          <div key={item.id} className="admin-card p-0 overflow-hidden group">
            <div className="aspect-video bg-muted relative">
              <img src={item.url} alt={item.caption || "Gallery image"} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}><Edit className="w-3.5 h-3.5" /></Button>
                <Button variant="secondary" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => openDelete(item)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
            <div className="p-3 space-y-1">
              <p className="text-sm font-medium">{item.caption || "Untitled"}</p>
              <Badge variant="outline" className="text-xs">{categoryLabel(item.category)}</Badge>
            </div>
          </div>
        ))}

        <button onClick={openCreate} className="border-2 border-dashed border-border rounded-lg aspect-video flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <Plus className="w-8 h-8" /><span className="text-sm">Add Photos</span>
        </button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing.id ? "Edit Photo" : "Upload Photo"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {!editing.id && (
              <div className="space-y-2"><Label>Photo(s)</Label><Input type="file" accept="image/*" multiple onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))} /></div>
            )}
            <div className="space-y-2"><Label>Caption</Label><Input value={editing.caption ?? ""} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} placeholder="Photo caption" /></div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={editing.category ?? "events"} onValueChange={(v) => setEditing({ ...editing, category: v as GalleryItem["category"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.filter((c) => c.value !== "all").map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={handleSave} disabled={busy}>{editing.id ? "Update" : "Upload"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{deleteTarget?.caption}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
