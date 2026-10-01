import * as React from "react"
import { cn } from "@/lib/utils"

const base = "w-full min-w-0 rounded-[10px] border border-line-2 bg-raise px-[11px] py-[9px] text-sm text-text placeholder:text-faint"

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input data-slot="input" className={cn(base, className)} {...props} />
}
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(base, "min-h-[84px] resize-y", className)} {...props} />
}
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return <select data-slot="select" className={cn(base, className)} {...props} />
}

export { Input, Textarea, NativeSelect }
