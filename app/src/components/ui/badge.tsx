import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold", {
  variants: {
    variant: {
      soon: "bg-accent-soft px-1.5 py-px text-[10px] tracking-[.03em] text-accent-ink",
      soft: "bg-group px-2.5 py-0.5 text-xs text-sub",
      accent: "bg-accent-soft px-3 py-1 text-[13px] font-medium text-accent-ink",
    },
  },
  defaultVariants: { variant: "soft" },
})

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
