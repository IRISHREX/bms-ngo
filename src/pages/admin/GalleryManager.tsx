import { useState } from "react";
import { Upload, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const categories = ["All", "Events", "Beneficiaries", "Volunteers", "Field Visits"];

interface GalleryItem { id: string; caption: string; category: string; }

const mockGalleryItems: GalleryItem[] = [
  { id: "1", caption: "Medical camp in Sundarbans", category: "Events" },
  { id: "2", caption: "Students receiving books", category: "Beneficiaries" },
  { id: "3", caption: "Volunteer orientation day", category: "Volunteers" },
  { id: "4", caption: "Village survey - Bihar", category: "Field Visits" },
  { id: "5", caption: "Food distribution drive", category: "Events" },
  { id: "6", caption: "Women empowerment workshop", category: "Events" },
];

const emptyItem: Partial<GalleryItem> = { caption: "", category: "Events" };

export default function GalleryManager() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<GalleryItem>>(emptyItem);
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);

  const filtered = activeCategory === "All" ? mockGalleryItems : mockGalleryItems.filter(g => g.category === activeCategory);

  const openCreate = () => { setEditing({ ...emptyItem }); setDialogOpen(true); };
  const openEdit = (item: GalleryItem) => { setEditing({ ...item }); setDialogOpen(true); };
  const openDelete = (item: GalleryItem) => { setDeleteTarget(item); setDeleteOpen(true); };

  const handleSave = () => {
    toast({ title: editing.id ? "Photo updated" : "Photo uploaded", description: `"${editing.caption}" saved.` });
    setDialogOpen(false);
  };

  const handleDelete = () => {
    toast({ title: "Photo deleted", description: `"${deleteTarget?.caption}" removed.` });
    setDeleteOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Gallery Manager</h1>
          <p className="page-description">{mockGalleryItems.length} photos across {categories.length - 1} categories</p>
        </div>
        <Button className="gap-2" onClick={openCreate}><Upload className="w-4 h-4" /> Upload Photos</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div key={item.id} className="admin-card p-0 overflow-hidden group">
            <div className="aspect-video bg-muted flex items-center justify-center relative">
              <span className="text-muted-foreground text-sm">Photo placeholder</span>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}><Edit className="w-3.5 h-3.5" /></Button>
                <Button variant="secondary" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => openDelete(item)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
            <div className="p-3 space-y-1">
              <p className="text-sm font-medium">{item.caption}</p>
              <Badge variant="outline" className="text-xs">{item.category}</Badge>
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
            <div className="space-y-2"><Label>Photo</Label><Input type="file" accept="image/*" /></div>
            <div className="space-y-2"><Label>Caption</Label><Input value={editing.caption ?? ""} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} placeholder="Photo caption" /></div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={editing.category ?? "Events"} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.filter(c => c !== "All").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing.id ? "Update" : "Upload"}</Button>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
