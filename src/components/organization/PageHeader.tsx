import { type ReactNode } from "react"
import { cn } from "@/lib/utils"


interface PageHeaderProps {
  title: string
  context?: string
  description?: string
  action?: ReactNode
  className?: string
  variant?: "default" | "portal" | "admin"
}

export function PageHeader({ title, context, description, action, className, variant = "default" }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        action && "sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h1
          className={cn(
            "text-2xl font-bold uppercase tracking-tight",
            variant === "portal" || variant === "admin"
              ? "bg-linear-to-r from-[#8BC34A] via-[#2E7D32] to-[#1B5E20] bg-clip-text text-transparent"
              : "text-foreground",
          )}
        >
          {title}
        </h1>
        {context && (
          <p className={cn(
            "text-xs font-medium uppercase tracking-wide",
            variant === "portal" || variant === "admin" ? "text-[#1B5E20]/60"
              : "text-muted-foreground",
          )}>{context}</p>
        )}
        {description && (
          <p className={cn(
            "text-sm",
            variant === "portal" || variant === "admin" ? "text-[#1B5E20]/50"
              : "text-muted-foreground",
          )}>{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 self-start">{action}</div>}
    </div>
  )
}
