import React, { useEffect, useMemo, useRef, useState } from "react";
import { Upload, X, File as FileIcon, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface FileUploadWithPreviewProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string;
  allowedExtensions?: string[];
  maxSizeMB?: number;
  multiple?: boolean;
  maxFiles?: number;
  progress?: number | null;
  isUploading?: boolean;
  className?: string;
  dropzoneText?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function FileUploadWithPreview({
  files,
  onFilesChange,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif"],
  maxSizeMB = 5,
  multiple = false,
  maxFiles = 10,
  progress = null,
  isUploading = false,
  className,
  dropzoneText,
}: FileUploadWithPreviewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Generate previews for image files
  const previews = useMemo(() => {
    return files.map((file) => {
      const isImg = file.type.startsWith("image/");
      const url = isImg ? URL.createObjectURL(file) : null;
      return { file, url, isImg };
    });
  }, [files]);

  // Clean up blob URLs when files change or component unmounts
  useEffect(() => {
    return () => {
      previews.forEach((p) => {
        if (p.url) URL.revokeObjectURL(p.url);
      });
    };
  }, [previews]);

  const validateAndAddFiles = (newFiles: File[]) => {
    setErrorMsg(null);
    if (!newFiles.length) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of newFiles) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      
      // Extension check
      if (allowedExtensions.length > 0 && !allowedExtensions.includes(ext)) {
        errors.push(`"${file.name}": Format not allowed. Allowed formats: ${allowedExtensions.map((e) => e.toUpperCase()).join(", ")}`);
        continue;
      }

      // Size check
      if (file.size > maxSizeBytes) {
        errors.push(`"${file.name}": File size (${formatFileSize(file.size)}) exceeds ${maxSizeMB} MB limit.`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      setErrorMsg(errors.join(" | "));
    }

    if (validFiles.length > 0) {
      if (multiple) {
        const combined = [...files, ...validFiles];
        if (maxFiles && combined.length > maxFiles) {
          setErrorMsg(`Maximum ${maxFiles} file(s) allowed. Excess files were ignored.`);
          onFilesChange(combined.slice(0, maxFiles));
        } else {
          onFilesChange(combined);
        }
      } else {
        onFilesChange([validFiles[0]]);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    validateAndAddFiles(selected);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isUploading) return;
    const dropped = Array.from(e.dataTransfer.files || []);
    validateAndAddFiles(dropped);
  };

  const handleRemove = (index: number) => {
    if (isUploading) return;
    const next = [...files];
    next.splice(index, 1);
    onFilesChange(next);
  };

  const clearAll = () => {
    if (isUploading) return;
    onFilesChange([]);
    setErrorMsg(null);
  };

  const extensionsHint = allowedExtensions.map((e) => e.toUpperCase()).join(", ");

  return (
    <div className={cn("space-y-3", className)}>
      {/* Hidden native input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={isUploading}
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Drag & drop dropzone */}
      <div
        onClick={() => !isUploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isUploading) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all duration-200",
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/60 hover:bg-muted/30",
          isUploading && "opacity-60 pointer-events-none cursor-not-allowed"
        )}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {dropzoneText || (multiple ? "Click or drag & drop files here" : "Click or drag & drop a file here")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Allowed: <span className="font-semibold text-foreground/80">{extensionsHint}</span> • Max size:{" "}
              <span className="font-semibold text-foreground/80">{maxSizeMB} MB</span>
              {multiple && maxFiles ? ` • Up to ${maxFiles} files` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="flex items-start gap-2 p-2.5 rounded-md bg-destructive/10 text-destructive text-xs border border-destructive/20">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-destructive hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Upload Progress Bar */}
      {isUploading && progress !== null && (
        <div className="space-y-1.5 p-3 rounded-lg border border-primary/20 bg-primary/5">
          <div className="flex justify-between items-center text-xs font-medium text-primary">
            <span>Uploading...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Previews List / Grid */}
      {previews.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Selected ({previews.length}{multiple && maxFiles ? `/${maxFiles}` : ""})
            </span>
            {!isUploading && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 text-xs text-destructive hover:text-destructive px-2">
                Clear all
              </Button>
            )}
          </div>

          <div className={cn(
            multiple
              ? "grid grid-cols-2 sm:grid-cols-3 gap-2.5"
              : "space-y-2"
          )}>
            {previews.map((item, idx) => (
              <div
                key={`${item.file.name}-${idx}`}
                className="relative group border rounded-md p-2 bg-card flex items-center gap-2.5 overflow-hidden shadow-sm hover:border-primary/40 transition-colors"
              >
                {/* Thumbnail */}
                {item.isImg && item.url ? (
                  <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0 relative">
                    <img src={item.url} alt={item.file.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
                    <FileIcon className="w-6 h-6" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0 pr-6">
                  <p className="text-xs font-medium text-foreground truncate" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatFileSize(item.file.size)}
                  </p>
                </div>

                {/* Remove button */}
                {!isUploading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(idx);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground flex items-center justify-center shadow-sm transition-colors"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
