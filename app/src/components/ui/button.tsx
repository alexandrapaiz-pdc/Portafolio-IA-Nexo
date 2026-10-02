import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[filter,background-color] disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-accent cursor-pointer border-0",
  {
    variants: {
      variant: {
        default: "bg-text text-bg hover:brightness-110",
        accent: "bg-accent text-white hover:brightness-105",
        ghost: "border border-[rgba(15,23,42,.08)] bg-white/70 text-text shadow-[0_1px_2px_rgba(15,23,42,.05)] backdrop-blur-md hover:bg-white hover:shadow-[0_4px_14px_-6px_rgba(15,23,42,.25)]",
        glass: "bg-white/12 text-white border border-white/50 backdrop-blur-md hover:bg-white/22",
        link: "bg-transparent text-accent-ink hover:underline px-0",
      },
      size: {
        default: "h-9 px-[18px] text-sm",
        sm: "h-8 px-3.5 text-[13px]",
        lg: "h-11 px-6 text-[15px]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
)

function Button({ className, variant, size, asChild = false, ...props }:
  React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
