import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex max-w-full shrink-0 items-center justify-center rounded-md border text-label text-center whitespace-normal select-none disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground disabled:border-input aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-transparent bg-button-fill text-primary-foreground hover:bg-button-hover active:bg-button-hover",
        outline:
          "border-input bg-background text-foreground hover:bg-muted active:bg-muted",
        "inverse-outline":
          "border-on-inverse bg-transparent text-on-inverse hover:bg-on-inverse hover:text-inverse active:bg-on-inverse active:text-inverse",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:border-input active:border-input",
        ghost:
          "border-transparent bg-transparent text-foreground hover:bg-muted active:bg-muted",
        destructive:
          "border-destructive bg-destructive text-primary-foreground hover:underline active:underline",
        link: "border-transparent text-primary underline underline-offset-4 hover:text-primary-hover",
      },
      size: {
        default:
          "min-h-control gap-2 px-4 py-3",
        sm: "min-h-touch gap-2 px-3 py-2",
        review: "min-h-touch gap-1 px-2 py-1 text-xs font-normal",
        lg: "min-h-14 gap-3 px-6 py-4",
        icon: "size-touch",
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
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
