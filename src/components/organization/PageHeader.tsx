import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  context?: string
  description?: string
  /** Optional action element (e.g. a button) rendered on the right on sm+ screens */
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, context, description, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        action && "sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {context && (
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{context}</p>
        )}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 self-start">{action}</div>}
    </div>
  )
}