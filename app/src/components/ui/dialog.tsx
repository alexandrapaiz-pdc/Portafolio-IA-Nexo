import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close

function DialogContent({ className, children, title, ...props }:
  React.ComponentProps<typeof DialogPrimitive.Content> & { title: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--scrim)] backdrop-blur-sm" />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-x-0 top-0 z-50 mx-auto mt-0 h-full overflow-y-auto outline-none sm:mt-11 sm:h-[calc(100%-44px)] sm:max-w-[760px]",
          className,
        )}
        aria-describedby={undefined}
        {...props}
      >
        <div className="min-h-full overflow-hidden bg-bg shadow-[0_40px_100px_rgba(0,0,0,.25),0_0_0_.5px_var(--line)] max-sm:mt-5 max-sm:rounded-t-[18px] sm:rounded-[22px] sm:min-h-0 motion-safe:animate-[rise_.32s_cubic-bezier(.2,.8,.2,1)]">
          <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-glass px-5 py-3 backdrop-blur-xl">
            <DialogPrimitive.Title className="m-0 flex-1 truncate text-[13px] font-semibold tracking-normal text-sub">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close className="grid size-7 place-items-center rounded-full border-0 bg-group text-sub" aria-label="Cerrar"><X size={14} /></DialogPrimitive.Close>
          </div>
          <div className="grid gap-[34px] px-7 pb-11 pt-7 max-sm:px-[18px]">{children}</div>
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export { Dialog, DialogTrigger, DialogClose, DialogContent }
