import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: { value: string; positive: boolean }
  className?: string
  isLoading?: boolean
}

export function StatCard({ title, value, description, icon: Icon, trend, className, isLoading }: StatCardProps) {
  return (
    <Card className={cn(
      "group relative overflow-hidden border-border/60 bg-card shadow-sm",
      "transition-all duration-500 ease-out",
      "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/40 hover:-translate-y-0.5",
      "animate-fade-in-up",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:via-transparent before:to-secondary/5 before:opacity-0 before:transition-opacity before:duration-500",
      "hover:before:opacity-100",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 group-hover:text-muted-foreground transition-colors duration-300">
          {title}
        </CardTitle>
        <div className={cn(
          "relative rounded-xl p-2.5 transition-all duration-500",
          "bg-gradient-to-br from-primary/15 via-primary/10 to-secondary/10",
          "group-hover:from-primary/25 group-hover:via-primary/15 group-hover:to-secondary/20",
          "group-hover:scale-110 group-hover:rotate-3",
          "shadow-sm shadow-primary/5"
        )}>
          <Icon className="size-4 text-primary transition-all duration-500 group-hover:text-primary group-hover:scale-110" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 relative z-10">
        {isLoading ? (
          <>
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-4 w-full rounded" />
          </>
        ) : (
          <>
            <div className={cn(
              "text-3xl font-bold tracking-tight",
              "bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent",
              "transition-all duration-300 group-hover:scale-105"
            )}>
              {value}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground/90 leading-relaxed transition-colors duration-300 group-hover:text-muted-foreground">
                {description}
              </p>
            )}
          </>
        )}
        {trend && !isLoading && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-semibold mt-3 pt-3",
            "border-t border-border/40 group-hover:border-border/60 transition-all duration-300",
            trend.positive 
              ? "text-success" 
              : "text-destructive"
          )}>
            <span className={cn(
              "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full",
              "transition-all duration-300",
              trend.positive 
                ? "bg-success/10 group-hover:bg-success/20" 
                : "bg-destructive/10 group-hover:bg-destructive/20"
            )}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}