import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Sliders, CheckCircle2, Pencil, Sparkles } from "lucide-react";
import { fetchHeroSlides, uploadHeroSlide, updateHeroSlide, deleteHeroSlide, HeroSlide } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileUploadWithPreview } from "@/components/ui/FileUploadWithPreview";
import { WordCounter } from "@/components/ui/WordCounter";
import { toast } from "@/hooks/use-toast";
import heroDefaultImage from "@/assets/hero-image.jpg";

export function HeroCarouselManager() {
  const queryClient = useQueryClient();
  const { data: slides = [], isLoading } = useQuery({
    queryKey: ["hero-slides"],
    queryFn: fetchHeroSlides,
  });

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newBadge, setNewBadge] = useState("");

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HeroSlide | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");
  const [editBadge, setEditBadge] = useState("");

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HeroSlide | null>(null);

  const resetUploadForm = () => {
    setSelectedFiles([]);
    setUploadProgress(null);
    setNewTitle("");
    setNewSubtitle("");
    setNewBadge("");
  };

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return uploadHeroSlide(
        file,
        {
          title: newTitle.trim() || undefined,
          subtitle: newSubtitle.trim() || undefined,
          badge: newBadge.trim() || undefined,
        },
        (pct) => setUploadProgress(pct)
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast({ title: "Hero slide added", description: "The slide image and dynamic text have been saved." });
      setUploadOpen(false);
      resetUploadForm();
    },
    onError: (err: Error) => {
      setUploadProgress(null);
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editTarget) return;
      return updateHeroSlide(editTarget.id, {
        title: editTitle.trim() || null,
        subtitle: editSubtitle.trim() || null,
        badge: editBadge.trim() || null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast({ title: "Slide updated", description: "Dynamic slide details updated successfully." });
      setEditOpen(false);
      setEditTarget(null);
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHeroSlide(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast({ title: "Slide deleted", description: "Image removed from the hero carousel." });
      setDeleteOpen(false);
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const handleUploadSubmit = () => {
    if (!selectedFiles.length) {
      toast({ title: "No file selected", description: "Please choose an image to upload.", variant: "destructive" });
      return;
    }
    if (slides.length >= 5) {
      toast({ title: "Limit reached", description: "Maximum 5 pictures allowed. Delete one before uploading.", variant: "destructive" });
      return;
    }
    uploadMutation.mutate(selectedFiles[0]);
  };

  const openEditDialog = (slide: HeroSlide) => {
    setEditTarget(slide);
    setEditTitle(slide.title || "");
    setEditSubtitle(slide.subtitle || "");
    setEditBadge(slide.badge || "");
    setEditOpen(true);
  };

  const openDeleteDialog = (slide: HeroSlide) => {
    setDeleteTarget(slide);
    setDeleteOpen(true);
  };

  const isMaxReached = slides.length >= 5;

  return (
    <div className="admin-card space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Home Hero Carousel</h2>
            <Badge variant={isMaxReached ? "destructive" : "secondary"} className="text-xs">
              {slides.length} / 5 Images
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage banner photos and their dynamic headings, descriptions, and badges. Max 5 pictures (Min 0).
          </p>
        </div>

        <Button
          onClick={() => {
            resetUploadForm();
            setUploadOpen(true);
          }}
          disabled={isMaxReached || uploadMutation.isPending}
          className="gap-2 self-start sm:self-auto"
          size="sm"
        >
          <Plus className="w-4 h-4" /> Add Carousel Image
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-video bg-muted rounded-md animate-pulse" />
          ))}
        </div>
      ) : slides.length === 0 ? (
        /* Zero slides: Default image fallback banner */
        <div className="border border-dashed border-primary/40 bg-primary/5 rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-32 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0 relative border shadow-sm">
            <img src={heroDefaultImage} alt="Default Hero" className="w-full h-full object-cover" />
            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
              Default
            </span>
          </div>
          <div className="space-y-1 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm font-semibold text-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Default Foundation Image & Text Active</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No custom carousel slides have been uploaded yet (0 / 5). The website is currently displaying the default high-resolution foundation picture and headline. Upload between 1 and 5 pictures above to customize the imagery and dynamic headlines per picture.
            </p>
          </div>
        </div>
      ) : (
        /* Slides grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="group relative border rounded-lg overflow-hidden bg-card shadow-sm hover:border-primary/50 transition-all flex flex-col"
            >
              {/* Image thumbnail & overlay actions */}
              <div className="aspect-video bg-muted relative overflow-hidden flex-shrink-0">
                <img
                  src={slide.imageUrl}
                  alt={slide.title || `Slide ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = heroDefaultImage;
                  }}
                />
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 gap-1 shadow-md bg-white/90 text-black hover:bg-white"
                    onClick={() => openEditDialog(slide)}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit Text
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 gap-1 shadow-md"
                    onClick={() => openDeleteDialog(slide)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                  Slide #{index + 1}
                </div>
                {slide.badge && (
                  <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm max-w-[120px] truncate">
                    {slide.badge}
                  </div>
                )}
              </div>

              {/* Dynamic details card footer */}
              <div className="p-3 flex-1 flex flex-col justify-between space-y-2 text-xs">
                <div className="space-y-1">
                  <div className="font-semibold text-foreground line-clamp-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
                    <span>{slide.title || <span className="text-muted-foreground italic">Default Headline</span>}</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] line-clamp-2">
                    {slide.subtitle || <span className="italic">Default mission description</span>}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-muted-foreground text-[11px]">
                  <span>Active in rotation</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => openEditDialog(slide)}
                      title="Edit Text"
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => openDeleteDialog(slide)}
                      title="Delete Slide"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add placeholder card if < 5 */}
          {!isMaxReached && (
            <button
              type="button"
              onClick={() => {
                resetUploadForm();
                setUploadOpen(true);
              }}
              className="aspect-video min-h-[160px] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
            >
              <Plus className="w-6 h-6" />
              <span className="text-xs font-medium">Add Photo ({slides.length}/5)</span>
            </button>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Hero Carousel Slide</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Upload a picture and enter its unique dynamic text. Recommended image resolution: 1920×1080 (16:9).
            </p>

            {/* Image upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Slide Photo *</Label>
              <FileUploadWithPreview
                files={selectedFiles}
                onFilesChange={setSelectedFiles}
                accept="image/jpeg,image/png,image/webp,image/gif"
                allowedExtensions={["jpg", "jpeg", "png", "webp", "gif"]}
                maxSizeMB={5}
                multiple={false}
                progress={uploadProgress}
                isUploading={uploadMutation.isPending}
                dropzoneText="Click or drop a hero banner image here"
              />
            </div>

            {/* Badge */}
            <div className="space-y-1.5">
              <Label htmlFor="new-badge" className="text-xs font-semibold">
                Badge / Tag <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="new-badge"
                placeholder="e.g., Since 2021 · West Bengal, India"
                value={newBadge}
                onChange={(e) => setNewBadge(e.target.value)}
                maxLength={60}
                className="text-xs"
              />
              <WordCounter text={newBadge} maxWords={6} maxChars={60} className="mt-0.5" />
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="new-title" className="text-xs font-semibold">
                Headline / Title <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="new-title"
                placeholder="e.g., Providing Free Education to Rural Students"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={120}
                className="text-xs font-medium"
              />
              <WordCounter text={newTitle} maxWords={15} maxChars={120} className="mt-0.5" />
              <p className="text-[11px] text-muted-foreground">
                Leave blank to automatically use the default website hero title.
              </p>
            </div>

            {/* Subtitle / Description */}
            <div className="space-y-1.5">
              <Label htmlFor="new-subtitle" className="text-xs font-semibold">
                Details / Description <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="new-subtitle"
                rows={3}
                placeholder="e.g., We empower underserved communities through access to quality schooling, nutritious mid-day meals, and vocational training."
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
                maxLength={300}
                className="text-xs resize-none"
              />
              <WordCounter text={newSubtitle} maxWords={45} maxChars={300} className="mt-0.5" />
              <p className="text-[11px] text-muted-foreground">
                Leave blank to automatically use the default website hero description.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadOpen(false)}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={uploadMutation.isPending || selectedFiles.length === 0}
            >
              {uploadMutation.isPending ? "Uploading..." : "Save & Add Slide"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Details Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Slide Text</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {editTarget && (
              <div className="w-full h-32 rounded-lg overflow-hidden border bg-muted relative">
                <img src={editTarget.imageUrl} alt="Slide Preview" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Edit Badge */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-badge" className="text-xs font-semibold">
                Badge / Tag <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="edit-badge"
                placeholder="e.g., Since 2021 · West Bengal, India"
                value={editBadge}
                onChange={(e) => setEditBadge(e.target.value)}
                maxLength={60}
                className="text-xs"
              />
              <WordCounter text={editBadge} maxWords={6} maxChars={60} className="mt-0.5" />
            </div>

            {/* Edit Title */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-title" className="text-xs font-semibold">
                Headline / Title <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="edit-title"
                placeholder="e.g., Providing Free Education to Rural Students"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={120}
                className="text-xs font-medium"
              />
              <WordCounter text={editTitle} maxWords={15} maxChars={120} className="mt-0.5" />
              <p className="text-[11px] text-muted-foreground">
                Leave blank to automatically use the default website hero title.
              </p>
            </div>

            {/* Edit Subtitle */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-subtitle" className="text-xs font-semibold">
                Details / Description <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="edit-subtitle"
                rows={3}
                placeholder="e.g., We empower underserved communities through access to quality schooling, nutritious mid-day meals, and vocational training."
                value={editSubtitle}
                onChange={(e) => setEditSubtitle(e.target.value)}
                maxLength={300}
                className="text-xs resize-none"
              />
              <WordCounter text={editSubtitle} maxWords={45} maxChars={300} className="mt-0.5" />
              <p className="text-[11px] text-muted-foreground">
                Leave blank to automatically use the default website hero description.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Carousel Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this picture from the home page hero carousel? If 0 pictures remain, the default foundation image and default text will be displayed automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Image"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
