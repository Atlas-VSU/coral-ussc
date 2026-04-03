import { FileQuestion, CheckCircle, Clock, XCircle, MinusCircle } from "lucide-react";

interface EmptyStateProps {
  filterStatus?: string;
  type?: "submissions" | "students";
  className?: string;
}

const statusMessages = {
  submissions: {
    all: "No payment submissions found",
    pending: "No pending submissions to review",
    verified: "No verified payments yet",
    rejected: "No rejected submissions",
  },
  students: {
    all: "No students found",
    pending: "No students with pending payments",
    verified: "No students with verified payments",
    rejected: "No students with rejected payments",
    unpaid: "No unpaid students found",
  },
};

const statusIcons = {
  all: FileQuestion,
  pending: Clock,
  verified: CheckCircle,
  rejected: XCircle,
  unpaid: MinusCircle,
};

export function EmptyState({ 
  filterStatus = "all", 
  type = "submissions",
  className = ""
}: EmptyStateProps) {
  const Icon = statusIcons[filterStatus as keyof typeof statusIcons] || FileQuestion;
  const message = statusMessages[type][filterStatus as keyof typeof statusMessages[typeof type]] 
    || statusMessages[type].all;

  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      <div className="mb-3 rounded-full bg-muted p-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
