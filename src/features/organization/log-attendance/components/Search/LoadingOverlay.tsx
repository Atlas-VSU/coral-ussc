import { Loader2Icon } from "lucide-react";

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col items-center">
          <div className="relative h-12 w-12 flex items-center justify-center">
            <Loader2Icon className="h-12 w-12 text-primary animate-spin" />
            <div className="absolute inset-0 border-4 border-primary/30 dark:border-primary/20 rounded-full"></div>
          </div>
          <p className="mt-4 font-nunito-sans font-medium text-gray-900 dark:text-gray-50">
            Processing...
          </p>
        </div>
      </div>
    </div>
  );
}
