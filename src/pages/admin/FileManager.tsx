import { useQuery } from "@tanstack/react-query";
import { fetchFiles, formatFileSize, formatDate } from "@/lib/api";
import { FolderOpen, FileText, Image, Film, Upload, Trash2, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const folderIcons: Record<string, React.ElementType> = {
  gallery: Image,
  reports: FileText,
  certificates: FileText,
  notices: FileText,
  blog: FileText,
  videos: Film,
};

export default function FileManager() {
  const { data: files = [], isLoading } = useQuery({ queryKey: ["files"], queryFn: fetchFiles });
  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  const folders = [...new Set(files.map((f) => f.folder))];
  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesFolder = !activeFolder || f.folder === activeFolder;
    return matchesSearch && matchesFolder;
  });

  const folderCounts = folders.reduce((acc, folder) => {
    acc[folder] = files.filter((f) => f.folder === folder).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">File Manager</h1>
          <p className="page-description">{files.length} files across {folders.length} folders</p>
        </div>
        <Button className="gap-2">
          <Upload className="w-4 h-4" /> Upload Files
        </Button>
      </div>

      {/* Folder chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFolder(null)}
          className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
            !activeFolder ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
          }`}
        >
          All ({files.length})
        </button>
        {folders.map((folder) => {
          const Icon = folderIcons[folder] || FolderOpen;
          return (
            <button
              key={folder}
              onClick={() => setActiveFolder(folder === activeFolder ? null : folder)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                activeFolder === folder ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {folder} ({folderCounts[folder]})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* File table */}
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
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={6} className="px-4 py-3"><div className="h-5 bg-muted rounded animate-pulse" /></td>
                </tr>
              ))
            ) : filteredFiles.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No files found</td></tr>
            ) : (
              filteredFiles.map((file) => {
                const Icon = file.type === "image" ? Image : FileText;
                return (
                  <tr key={file.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">{file.folder}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono-stat">{formatFileSize(file.size)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{file.usedIn}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(file.uploadedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
