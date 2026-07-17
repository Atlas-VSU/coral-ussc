import { useRef, useState, useCallback } from "react";
import { UploadCloud, X, FileText, ImageIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const ACCEPTED_EXTENSIONS = ".pdf, .png, .jpg, .jpeg";
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export interface CORFile {
  file: File;
  previewUrl: string | null;
}

interface CORUploadProps {
  value: CORFile | null;
  onChange: (cor: CORFile | null) => void;
}

function getFileIcon(file: File) {
  if (file.type === "application/pdf") return FileText;
  return ImageIcon;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Real COR upload with drag-and-drop, preview, and validation. */
export function CORUpload({ value, onChange }: CORUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Only PDF, PNG, or JPG files are accepted.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(`File must be smaller than ${MAX_SIZE_MB} MB.`);
        return;
      }

      // Generate preview URL for images
      const previewUrl = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null;

      onChange({ file, previewUrl });
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  const handleRemove = () => {
    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl);
    onChange(null);
    setError(null);
  };

  const Icon = value ? getFileIcon(value.file) : null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-[#1B5E20]">
        Certificate of Registration (COR)
      </p>

      {/* Drop zone / uploaded state */}
      {!value ? (
        <div
          role="button"
          tabIndex={0}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors duration-150 outline-none",
            isDragging
              ? "border-[#2E7D32] bg-[#8BC34A]/10"
              : "border-[#2E7D32]/30 bg-[#8BC34A]/5 hover:border-[#2E7D32]/60 hover:bg-[#8BC34A]/10",
            "focus-visible:ring-2 focus-visible:ring-[#2E7D32]/40"
          )}
        >
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-lg transition-colors",
              isDragging ? "bg-[#8BC34A]/30 text-[#1B5E20]" : "bg-[#8BC34A]/15 text-[#2E7D32]"
            )}
          >
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1B5E20]">
              {isDragging ? "Drop it here!" : "Upload your COR"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Drag & drop or click to browse · PDF, PNG, JPG · max {MAX_SIZE_MB} MB
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            className="sr-only"
            onChange={handleInputChange}
            aria-label="Upload Certificate of Registration"
          />
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-lg border border-[#2E7D32]/30 bg-[#8BC34A]/5 p-3">
          {/* Image preview or file icon */}
          {value.previewUrl ? (
            <img
              src={value.previewUrl}
              alt="COR preview"
              className="h-16 w-16 shrink-0 rounded-md border border-[#2E7D32]/20 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-[#2E7D32]/20 bg-[#8BC34A]/10 text-[#2E7D32]">
              {Icon && <Icon className="h-7 w-7" />}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#1B5E20]">
              {value.file.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatBytes(value.file.size)}
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-1 text-xs text-[#2E7D32] underline-offset-2 hover:underline"
            >
              Replace file
            </button>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove COR file"
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Hidden input for "Replace file" */}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            className="sr-only"
            onChange={handleInputChange}
            aria-label="Replace Certificate of Registration"
          />
        </div>
      )}

      {/* Validation error */}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
