"use client";
import { useRef, useState, useCallback } from "react";
import { CheckCircle2, RefreshCw, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
// import { ImageData } from "../types";
import { ImageData } from "../hooks/usePaymentForm";

interface ImageUploadProps {
  value: ImageData | null;
  onChange: (value: ImageData | null) => void;
  error?: string;
}

export function ImageUpload({ value, onChange, error }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const formatFileSize = (size: number) => {
    if (!Number.isFinite(size) || size <= 0) return "0 KB";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange({ file, preview: e.target?.result as string });
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const openPicker = () => {
    if (!inputRef.current) return;
    inputRef.current.value = "";
    inputRef.current.click();
  };

  return (
    <>
      {value ? (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-lg border border-border">
            <img
              src={value.preview}
              alt="Receipt"
              className="w-full max-h-56 object-cover block"
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={() => onChange(null)}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 text-white border-none"
            >
              <X className="size-3.5" />
            </Button>
          </div>

          <div className="rounded-md border bg-muted/30 px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  Uploaded
                </p>
                <p className="text-sm font-medium text-foreground truncate">{value.file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(value.file.size)}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openPicker}
                className="shrink-0 gap-1.5"
              >
                <RefreshCw className="size-3.5" />
                Replace image
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-4 py-8
            cursor-pointer transition-colors text-center
            ${dragging ? "border-green-500 bg-green-50 dark:bg-green-950/30" : ""}
            ${error  ? "border-destructive" : "border-border hover:border-green-400 hover:bg-green-50/50 dark:hover:bg-green-950/20"}
          `}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <UploadCloud className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Drop receipt image here</p>
            <p className="text-xs text-muted-foreground mt-1">
              or{" "}
              <span className="text-green-600 dark:text-green-400 font-semibold">click to browse</span>
              {" "}· PNG, JPG, WEBP
            </p>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />
    </>
  );
}
