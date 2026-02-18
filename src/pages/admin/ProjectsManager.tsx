import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProjects, formatCurrency, type Project } from "@/lib/api";
import { Plus, Edit, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const emptyProject: Partial<Project> = { title: "", description: "", location: "", budget: 0, fundsUsed: 0, status: "planned" };

export default function ProjectsManager() {
  const { data: projects = [], isLoading } = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Project>>(emptyProject);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const openCreate = () => { setEditing({ ...emptyProject }); setDialogOpen(true); };
  const openEdit = (p: Project) => { setEditing({ ...p }); setDialogOpen(true); };
  const openDelete = (p: Project) => { setDeleteTarget(p); setDeleteOpen(true); };

  const handleSave = () => {
    toast({ title: editing.id ? "Project updated" : "Project created", description: `"${editing.title}" saved.` });
    setDialogOpen(false);
  };

  const handleDelete = () => {
    toast({ title: "Project deleted", description: `"${deleteTarget?.title}" removed.` });
    setDeleteOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Projects</h1>
          <p className="page-description">{projects.length} projects &middot; {projects.filter(p => p.status === "ongoing").length} ongoing</p>
        </div>
        <Button className="gap-2" onClick={openCreate}><Plus className="w-4 h-4" /> New Project</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="admin-card animate-pulse"><div className="h-36 bg-muted rounded" /></div>)
          : projects.map((project) => {
              const progress = Math.round((project.fundsUsed / project.budget) * 100);
              return (
                <div key={project.id} className="admin-card space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">{project.title}</h3>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" /> {project.location}</div>
                    </div>
                    <Badge variant={project.status === "ongoing" ? "default" : project.status === "completed" ? "secondary" : "outline"} className="text-xs">{project.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Budget utilization</span><span className="font-mono-stat font-medium">{progress}%</span></div>
                    <Progress value={progress} className="h-1.5" />
                    <div className="flex justify-between text-xs text-muted-foreground"><span>{formatCurrency(project.fundsUsed)} used</span><span>{formatCurrency(project.budget)} total</span></div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => openEdit(project)}><Edit className="w-3.5 h-3.5" /> Edit</Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDelete(project)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              );
            })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing.id ? "Edit Project" : "New Project"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Title</Label><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Project name" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Location</Label><Input value={editing.location ?? ""} onChange={(e) => setEditing({ ...editing, location: e.target.value })} placeholder="e.g. West Bengal" /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editing.status ?? "planned"} onValueChange={(v) => setEditing({ ...editing, status: v as Project["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="planned">Planned</SelectItem><SelectItem value="ongoing">Ongoing</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Budget (₹)</Label><Input type="number" value={editing.budget ?? 0} onChange={(e) => setEditing({ ...editing, budget: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Funds Used (₹)</Label><Input type="number" value={editing.fundsUsed ?? 0} onChange={(e) => setEditing({ ...editing, fundsUsed: Number(e.target.value) })} /></div>
            </div>
            <div className="space-y-2"><Label>Photos</Label><Input type="file" accept="image/*" multiple /></div>
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
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{deleteTarget?.title}"? All associated files will also be removed.</AlertDialogDescription>
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
