import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Sliders, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { fetchHeroSlides, uploadHeroSlide, deleteHeroSlide, HeroSlide } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileUploadWithPreview } from "@/components/ui/FileUploadWithPreview";
import { toast } from "@/hooks/use-toast";
import heroDefaultImage from "@/assets/hero-image.jpg";

export function HeroCarouselManager() {
  const queryClient = useQueryClient();
  const { data: slides = [], isLoading } = useQuery({
    queryKey: ["hero-slides"],
    queryFn: fetchHeroSlides,
  });

  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HeroSlide | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return uploadHeroSlide(file, (pct) => setUploadProgress(pct));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast({ title: "Hero slide added", description: "The image has been added to the home page carousel." });
      setUploadOpen(false);
      setSelectedFiles([]);
      setUploadProgress(null);
    },
    onError: (err: Error) => {
      setUploadProgress(null);
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
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
            Manage banner images displayed in the top hero carousel of the Home Page. Max 5 pictures (Min 0).
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedFiles([]);
            setUploadProgress(null);
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
              <span>Default Foundation Image Active</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No custom carousel slides have been uploaded yet (0 / 5). The website is currently displaying the default high-resolution foundation picture. Upload between 1 and 5 pictures above to activate custom carousel transitions.
            </p>
          </div>
        </div>
      ) : (
        /* Slides grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="group relative border rounded-lg overflow-hidden bg-card shadow-sm hover:border-primary/50 transition-colors"
            >
              <div className="aspect-video bg-muted relative overflow-hidden">
                <img
                  src={slide.imageUrl}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = heroDefaultImage;
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
              </div>
              <div className="p-2.5 flex items-center justify-between text-xs text-muted-foreground">
                <span className="truncate">Active in carousel</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive sm:hidden"
                  onClick={() => openDeleteDialog(slide)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}

          {/* Add placeholder card if < 5 */}
          {!isMaxReached && (
            <button
              type="button"
              onClick={() => {
                setSelectedFiles([]);
                setUploadProgress(null);
                setUploadOpen(true);
              }}
              className="aspect-video border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
            >
              <Plus className="w-6 h-6" />
              <span className="text-xs font-medium">Add Photo ({slides.length}/5)</span>
            </button>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Hero Carousel Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Add a slide to the home page banner carousel. Recommended resolution: 1920×1080 (16:9).
            </p>

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
              {uploadMutation.isPending ? "Uploading..." : "Upload Slide"}
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
              Are you sure you want to remove this picture from the home page hero carousel? If 0 pictures remain, the default foundation image will be displayed automatically.
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
