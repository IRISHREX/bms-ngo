import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFiles, formatFileSize, formatDate, type FileItem } from "@/lib/api";
import { FolderOpen, FileText, Image, Film, Upload, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const folderIcons: Record<string, React.ElementType> = { gallery: Image, reports: FileText, certificates: FileText, notices: FileText, blog: FileText, videos: Film };
const folderOptions = ["gallery", "reports", "certificates", "notices", "blog", "videos"];

export default function FileManager() {
  const { data: files = [], isLoading } = useQuery({ queryKey: ["files"], queryFn: fetchFiles });
  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
  const [uploadFolder, setUploadFolder] = useState("gallery");

  const folders = [...new Set(files.map((f) => f.folder))];
  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesFolder = !activeFolder || f.folder === activeFolder;
    return matchesSearch && matchesFolder;
  });

  const folderCounts = folders.reduce((acc, folder) => { acc[folder] = files.filter((f) => f.folder === folder).length; return acc; }, {} as Record<string, number>);

  const openDelete = (f: FileItem) => { setDeleteTarget(f); setDeleteOpen(true); };

  const handleUpload = () => {
    toast({ title: "File uploaded", description: `File uploaded to /${uploadFolder}` });
    setUploadOpen(false);
  };

  const handleDelete = () => {
    toast({ title: "File deleted", description: `"${deleteTarget?.name}" removed. It was used in: ${deleteTarget?.usedIn}` });
    setDeleteOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">File Manager</h1>
          <p className="page-description">{files.length} files across {folders.length} folders</p>
        </div>
        <Button className="gap-2" onClick={() => setUploadOpen(true)}><Upload className="w-4 h-4" /> Upload Files</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveFolder(null)} className={`px-3 py-1.5 rounded-md text-sm transition-colors ${!activeFolder ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>All ({files.length})</button>
        {folders.map((folder) => {
          const Icon = folderIcons[folder] || FolderOpen;
          return (
            <button key={folder} onClick={() => setActiveFolder(folder === activeFolder ? null : folder)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${activeFolder === folder ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>
              <Icon className="w-3.5 h-3.5" />{folder} ({folderCounts[folder]})
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="admin-card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="table-header text-left px-4 py-3">Name</th>
              <th className="table-header text-left px-4 py-3">Folder</th>
              <th className="table-header text-left px-4 py-3">Size</th>
              <th className="table-header text-left px-4 py-3">Used In</th>
              <th className="table-header text-left px-4 py-3">Uploaded</th>
              <th className="table-header text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <tr key={i} className="border-b border-border"><td colSpan={6} className="px-4 py-3"><div className="h-5 bg-muted rounded animate-pulse" /></td></tr>)
            ) : filteredFiles.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No files found</td></tr>
            ) : (
              filteredFiles.map((file) => {
                const Icon = file.type === "image" ? Image : FileText;
                return (
                  <tr key={file.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><Icon className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium">{file.name}</span></div></td>
                    <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{file.folder}</Badge></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono-stat">{formatFileSize(file.size)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{file.usedIn}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(file.uploadedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDelete(file)}><Trash2 className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Upload Files</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Files</Label><Input type="file" multiple /></div>
            <div className="space-y-2">
              <Label>Destination Folder</Label>
              <Select value={uploadFolder} onValueChange={setUploadFolder}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{folderOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Used In Section</Label>
              <Select defaultValue="Gallery">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Gallery", "Blog", "Projects", "Notices", "About Us", "Financial Transparency"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete with usage warning */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"?
              {deleteTarget?.usedIn && <><br /><br /><strong className="text-foreground">⚠ This file is currently used in: {deleteTarget.usedIn}</strong><br />Deleting it may cause broken images or missing documents on the site.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
