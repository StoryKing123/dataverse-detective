import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow",
        outline: "text-foreground",
        string: "border-transparent bg-type-string/10 text-type-string",
        picklist: "border-transparent bg-type-picklist/10 text-type-picklist",
        lookup: "border-transparent bg-type-lookup/10 text-type-lookup",
        datetime: "border-transparent bg-type-datetime/10 text-type-datetime",
        boolean: "border-transparent bg-type-boolean/10 text-type-boolean",
        number: "border-transparent bg-type-number/10 text-type-number",
        memo: "border-transparent bg-type-memo/10 text-type-memo",
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

export { Badge, badgeVariants }
