import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "ui-control min-h-32 resize-y",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
