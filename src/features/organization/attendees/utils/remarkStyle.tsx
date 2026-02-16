import { AlertTriangle, UserX } from "lucide-react";

export const getRemarkStyles = (remark: string) => {
  switch (remark?.toLowerCase()) {
    case "registered in different program":
      return {
        bg: "bg-red-50 dark:bg-red-900/10",
        text: "text-red-700 dark:text-red-400",
        border: "border-red-200 dark:border-red-800",
        icon: <AlertTriangle className="h-3 w-3" />
      };
    case "registered in different faculty":
      return {
        bg: "bg-orange-50 dark:bg-orange-900/10",
        text: "text-orange-700 dark:text-orange-400",
        border: "border-orange-200 dark:border-orange-800",
        icon: <UserX className="h-3 w-3" />
      };
    default:
      return {
        bg: "bg-gray-50 dark:bg-gray-800",
        text: "text-gray-700 dark:text-gray-300",
        border: "border-gray-200 dark:border-gray-700",
        icon: null
      };
  }
};