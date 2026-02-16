// First, create a WarningDialog component (you can place this in a separate file or at the top of your component)
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, UserX, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface WarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () =>void | Promise<void>;
  onCancel: () => void;
  title: string;
  description: string;
  warningType: "program" | "faculty";
  studentName?: string;
}

export const WarningDialog = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  description,
  warningType,
  studentName
}: WarningDialogProps) => {
  const getWarningStyles = () => {
    switch (warningType) {
      case "program":
        return {
          icon: <AlertTriangle className="h-6 w-6" />,
          bg: "bg-red-50 dark:bg-red-900/10",
          text: "text-red-700 dark:text-red-400",
          border: "border-red-200 dark:border-red-800",
          buttonVariant: "destructive" as const
        };
      case "faculty":
        return {
          icon: <UserX className="h-6 w-6" />,
          bg: "bg-orange-50 dark:bg-orange-900/10",
          text: "text-orange-700 dark:text-orange-400",
          border: "border-orange-200 dark:border-orange-800",
          buttonVariant: "destructive" as const
        };
      default:
        return {
          icon: <AlertCircle className="h-6 w-6" />,
          bg: "bg-amber-50 dark:bg-amber-900/10",
          text: "text-amber-700 dark:text-amber-400",
          border: "border-amber-200 dark:border-amber-800",
          buttonVariant: "default" as const
        };
    }
  };

  const styles = getWarningStyles();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${styles.bg} ${styles.border}`}>
              <div className={styles.text}>
                {styles.icon}
              </div>
            </div>
            <DialogTitle className={`text-lg ${styles.text}`}>
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 dark:text-gray-400 text-base">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className={`mt-4 p-4 rounded-lg ${styles.bg} border ${styles.border}`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Important Notice
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You are about to record attendance for a student who may not be authorized for this event.
                This action will be logged in the system.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            variant={styles.buttonVariant}
            onClick={onConfirm}
            className="flex-1 shadow-sm hover:shadow-md transition-shadow"
          >
            Proceed Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
