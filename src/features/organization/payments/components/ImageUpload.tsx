"use client";
import { useRef, useState, useCallback } from "react";
import { UploadCloud, X } from "lucide-react";
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

  if (value) {
    return (
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
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/50 to-transparent">
          <p className="text-xs text-white font-medium truncate">{value.file.name}</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
