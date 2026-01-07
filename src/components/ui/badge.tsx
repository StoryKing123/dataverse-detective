import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline:
          "border-border bg-transparent text-foreground",
        success:
          "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        warning:
          "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-300",
        system:
          "border-destructive/30 bg-transparent text-destructive",
        required:
          "border-transparent bg-orange-500/10 text-orange-700 dark:text-orange-300",
        optional:
          "border-border bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge }
