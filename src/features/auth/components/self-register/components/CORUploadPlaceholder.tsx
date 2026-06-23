import { Lock, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** COR upload section — disabled / "Coming Soon" placeholder. */
export function CORUploadPlaceholder() {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-semibold text-[#1B5E20]">
          Certificate of Registration (COR)
        </span>
        <Badge
          variant="secondary"
          className="bg-[#8BC34A]/15 text-[#1B5E20] gap-1"
        >
          <Lock className="h-3 w-3" />
          Coming Soon
        </Badge>
      </div>
      <div
        aria-disabled
        className="flex cursor-not-allowed select-none flex-col items-center gap-3 rounded-lg border-2 border-dashed border-[#2E7D32]/25 bg-[#8BC34A]/5 px-4 py-8 text-center opacity-70"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#8BC34A]/15 text-[#2E7D32]">
          <UploadCloud className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1B5E20]">
            Upload your COR attachment
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            COR upload will be available soon · PDF, PNG, JPG
          </p>
        </div>
      </div>
    </div>
  );
}
