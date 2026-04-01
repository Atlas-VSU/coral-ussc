import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:shadow-sm dark:hover:bg-primary/80",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 hover:shadow-sm focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 dark:hover:bg-destructive/80",
        outline:
          "border bg-background shadow-xs hover:bg-gray-200 hover:shadow-sm dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 hover:shadow-sm dark:hover:bg-secondary/70",
        success:
          "bg-green-600 text-white shadow-xs hover:bg-green-700 hover:shadow-sm focus-visible:ring-green-600/20 dark:focus-visible:ring-green-600/40 dark:bg-green-700 dark:hover:bg-green-600",
        ghost:
          "hover:bg-accent hover:text-accent-foreground hover:shadow-xs dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 dark:hover:text-primary/70",
        icon: "p-0 rounded-md border-transparent hover:scale-125 hover:text-accent-foreground focus-visible:ring-accent/50 data-[state=open]:bg-accent",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
