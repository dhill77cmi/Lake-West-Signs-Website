import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "ui-control file:mr-4 file:border-0 file:bg-muted file:px-3 file:py-2 file:text-label file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
