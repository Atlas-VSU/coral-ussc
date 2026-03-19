import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, UserX, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
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
  studentName,
}: WarningDialogProps) => {
  const getStyles = () => {
    switch (warningType) {
      case "program":
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          iconBg: "bg-red-50 border border-red-200",
          iconColor: "text-destructive",
          noticeBg: "bg-red-50 border-red-200",
          titleColor: "text-destructive",
          buttonVariant: "destructive" as const,
        };
      case "faculty":
        return {
          icon: <UserX className="h-5 w-5" />,
          iconBg: "bg-amber-50 border border-amber-200",
          iconColor: "text-amber-700",
          noticeBg: "bg-amber-50 border-amber-200",
          titleColor: "text-amber-700",
          buttonVariant: "destructive" as const,
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          iconBg: "bg-muted border border-border",
          iconColor: "text-muted-foreground",
          noticeBg: "bg-muted border-border",
          titleColor: "text-foreground",
          buttonVariant: "default" as const,
        };
    }
  };

  const styles = getStyles();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className={`p-2 rounded-lg shrink-0 ${styles.iconBg}`}>
              <span className={styles.iconColor}>{styles.icon}</span>
            </div>
            <DialogTitle
              className={`font-nunito text-base font-bold ${styles.titleColor}`}
            >
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="font-nunito-sans text-sm text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className={`mt-2 p-4 rounded-xl border ${styles.noticeBg}`}>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-nunito-sans text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                Important Notice
              </p>
              <p className="font-nunito-sans text-sm text-muted-foreground leading-relaxed">
                You are about to record attendance for a student who may not be
                authorized for this event. This action will be logged in the
                system.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2 flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            style={{ borderColor: "#97C459", color: "#27500A" }}
          >
            Cancel
          </Button>
          <Button
            variant={styles.buttonVariant}
            onClick={onConfirm}
            className="flex-1"
          >
            Proceed Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};