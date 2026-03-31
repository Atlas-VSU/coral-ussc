import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, AlertTriangle } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default" | "warning";
  icon?: React.ReactNode;
  notice?: string;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  icon = <AlertTriangle className="h-6 w-6" />,
  notice,
}: ConfirmationDialogProps) {
  // Style mapping based on variant
  const styles = {
    warning: {
      bg: "bg-amber-50 dark:bg-amber-900/10",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
      buttonVariant: "destructive" as const,
    },
    destructive: {
      bg: "bg-red-50 dark:bg-red-900/10",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-800",
      buttonVariant: "destructive" as const,
    },
    default: {
      bg: "bg-blue-50 dark:bg-blue-900/10",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800",
      buttonVariant: "default" as const,
    },
  };

  const currentStyle = styles[variant] || styles.warning;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${currentStyle.bg} ${currentStyle.border}`}>
              <div className={currentStyle.text}>{icon}</div>
            </div>
            <DialogTitle className={`text-lg ${currentStyle.text}`}>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 dark:text-gray-400 text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        {notice && (
          <div className={`mt-4 p-4 rounded-lg ${currentStyle.bg} border ${currentStyle.border}`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <AlertCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Important Notice
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{notice}</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {cancelText}
          </Button>
          <Button
            variant={currentStyle.buttonVariant}
            onClick={onConfirm}
            className="flex-1 shadow-sm hover:shadow-md transition-shadow"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}