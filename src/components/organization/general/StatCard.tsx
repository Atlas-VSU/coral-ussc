import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// variant types for different stat card contexts
export type StatCardVariant = 
  | "default"
  | "success"    // cleared, approved, verified, paid
  | "warning"    // pending, awaiting
  | "danger"     // declined, rejected, not cleared
  | "info"       // total, members, unpaid
  | "neutral"    // general stats

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: { value: string; positive: boolean }
  className?: string
  isLoading?: boolean
  variant?: StatCardVariant
}

// pastel/gradient color schemes that complement the green theme
const variantStyles = {
  default: {
    card: "bg-gradient-to-br from-white to-gray-50/80 border-border/60",
    cardHover: "hover:border-primary/40 hover:shadow-primary/10",
    iconBg: "bg-gradient-to-br from-primary/15 via-primary/10 to-secondary/10",
    iconBgHover: "group-hover:from-primary/25 group-hover:via-primary/15 group-hover:to-secondary/20",
    iconColor: "text-primary",
    accent: "before:from-primary/5 before:to-secondary/5",
  },
  success: {
    card: "bg-gradient-to-br from-emerald-50/90 via-white to-green-50/60 border-emerald-200/60",
    cardHover: "hover:border-emerald-400/50 hover:shadow-emerald-500/15",
    iconBg: "bg-gradient-to-br from-emerald-500/20 via-green-400/15 to-emerald-300/10",
    iconBgHover: "group-hover:from-emerald-500/30 group-hover:via-green-400/25 group-hover:to-emerald-300/20",
    iconColor: "text-emerald-600",
    accent: "before:from-emerald-100/50 before:to-green-100/30",
  },
  warning: {
    card: "bg-gradient-to-br from-amber-50/90 via-white to-orange-50/60 border-amber-200/60",
    cardHover: "hover:border-amber-400/50 hover:shadow-amber-500/15",
    iconBg: "bg-gradient-to-br from-amber-500/20 via-yellow-400/15 to-orange-300/10",
    iconBgHover: "group-hover:from-amber-500/30 group-hover:via-yellow-400/25 group-hover:to-orange-300/20",
    iconColor: "text-amber-600",
    accent: "before:from-amber-100/50 before:to-orange-100/30",
  },
  danger: {
    card: "bg-gradient-to-br from-rose-50/90 via-white to-red-50/60 border-rose-200/60",
    cardHover: "hover:border-rose-400/50 hover:shadow-rose-500/15",
    iconBg: "bg-gradient-to-br from-rose-500/20 via-red-400/15 to-rose-300/10",
    iconBgHover: "group-hover:from-rose-500/30 group-hover:via-red-400/25 group-hover:to-rose-300/20",
    iconColor: "text-rose-600",
    accent: "before:from-rose-100/50 before:to-red-100/30",
  },
  info: {
    card: "bg-gradient-to-br from-sky-50/90 via-white to-blue-50/60 border-sky-200/60",
    cardHover: "hover:border-sky-400/50 hover:shadow-sky-500/15",
    iconBg: "bg-gradient-to-br from-sky-500/20 via-blue-400/15 to-sky-300/10",
    iconBgHover: "group-hover:from-sky-500/30 group-hover:via-blue-400/25 group-hover:to-sky-300/20",
    iconColor: "text-sky-600",
    accent: "before:from-sky-100/50 before:to-blue-100/30",
  },
  neutral: {
    card: "bg-gradient-to-br from-slate-50/90 via-white to-gray-50/60 border-slate-200/60",
    cardHover: "hover:border-slate-400/50 hover:shadow-slate-500/15",
    iconBg: "bg-gradient-to-br from-slate-500/20 via-gray-400/15 to-slate-300/10",
    iconBgHover: "group-hover:from-slate-500/30 group-hover:via-gray-400/25 group-hover:to-slate-300/20",
    iconColor: "text-slate-600",
    accent: "before:from-slate-100/50 before:to-gray-100/30",
  },
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  className, 
  isLoading,
  variant = "default" 
}: StatCardProps) {
  const styles = variantStyles[variant]

  return (
    <Card className={cn(
      "group relative overflow-hidden shadow-sm",
      styles.card,
      "transition-all duration-500 ease-out",
      "hover:shadow-lg hover:-translate-y-0.5",
      styles.cardHover,
      "animate-fade-in-up",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-0 before:transition-opacity before:duration-500",
      styles.accent,
      "hover:before:opacity-100",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 group-hover:text-muted-foreground transition-colors duration-300">
          {title}
        </CardTitle>
        <div className={cn(
          "relative rounded-xl p-2.5 transition-all duration-500",
          styles.iconBg,
          styles.iconBgHover,
          "group-hover:scale-110 group-hover:rotate-3",
          "shadow-sm"
        )}>
          <Icon className={cn(
            "size-4 transition-all duration-500 group-hover:scale-110",
            styles.iconColor
          )} />
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
              ? "text-emerald-600" 
              : "text-rose-600"
          )}>
            <span className={cn(
              "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full",
              "transition-all duration-300",
              trend.positive 
                ? "bg-emerald-100/60 group-hover:bg-emerald-100" 
                : "bg-rose-100/60 group-hover:bg-rose-100"
            )}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}