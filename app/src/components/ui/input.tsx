import * as React from "react"
import { cn } from "@/lib/utils"

const base = "w-full min-w-0 rounded-[10px] border border-line-2 bg-raise px-[11px] py-[9px] text-sm text-text placeholder:text-faint"

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input data-slot="input" className={cn(base, className)} {...props} />
}
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(base, "min-h-[84px] resize-y", className)} {...props} />
}
const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none' stroke='%235d6472' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 4.5l3 3 3-3'/%3E%3C/svg%3E")`

function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  // Own chevron so it sits 14px from the edge on every browser
  return <select data-slot="select" className={cn(base, "cursor-pointer appearance-none bg-[length:12px] bg-[right_14px_center] bg-no-repeat pr-10", className)} style={{ backgroundImage: CHEVRON }} {...props} />
}

export { Input, Textarea, NativeSelect }
