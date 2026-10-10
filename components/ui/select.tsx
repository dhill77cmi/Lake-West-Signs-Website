"use client"

import * as React from "react"
import { cn } from "cn"
import { Select as SelectPrimitive } from "radix-ui"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"
import { gsap, motionTokens, motionConditions } from "@/lib/motion"

// Open state shared with the trigger so its arrow can turn like the header's menu arrow.
const OpenContext = React.createContext(false)

function Select({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  const [open, setOpen] = React.useState(defaultOpen)
  const isOpen = controlledOpen ?? open
  React.useEffect(() => {
    if (!isOpen) return
    // The menu is portalled to body. Match Radix's aria-hidden background with
    // native inert so hidden links cannot receive focus while the menu is open.
    const background = document.getElementById("site-content")
    if (!background) return
    const previous = background.inert
    background.inert = true
    return () => { background.inert = previous }
  }, [isOpen])
  return <OpenContext.Provider value={isOpen}><SelectPrimitive.Root data-slot="select" {...props} open={isOpen} onOpenChange={(value) => {
    setOpen(value)
    onOpenChange?.(value)
  }} /></OpenContext.Provider>
}

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  const open = React.useContext(OpenContext)
  const arrow = React.useRef<HTMLSpanElement>(null)
  React.useEffect(() => {
    // Same turn as the header's Services arrow; instant under reduced motion.
    const tokens = motionTokens(arrow.current!)
    const reduce = matchMedia(motionConditions.reduce).matches
    gsap.to(arrow.current, { rotation: open ? 180 : 0, duration: reduce ? 0 : tokens.disclosure * 1.5, ease: "sine.inOut", transformOrigin: "50% 50%", force3D: false, overwrite: true })
  }, [open])
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "ui-control flex items-center justify-between gap-3 text-left data-placeholder:text-muted-foreground data-[size=sm]:min-h-touch data-[size=sm]:py-2 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <span ref={arrow} className="inline-flex shrink-0"><ChevronDownIcon aria-hidden="true" /></span>
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "start",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  // The list is created fresh on every open, so tween it the moment its node attaches
  // (Radix unmounts it on close, so there is no exit tween). Same feel as the header menu.
  const settle = React.useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const tokens = motionTokens(node)
    const reduce = matchMedia(motionConditions.reduce).matches
    // Opacity only: a visibility flip would stop Radix moving focus into the list on open.
    gsap.fromTo(node, { y: -6, opacity: 0 }, { y: 0, opacity: 1, duration: reduce ? 0 : tokens.disclosure * 1.5, ease: tokens.ease, clearProps: "transform,opacity" })
  }, [])
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={settle}
        data-slot="select-content"
        data-align-trigger={position === "item-aligned"}
        className={cn("relative z-(--z-overlay) max-h-(--radix-select-content-available-height) max-w-[calc(100vw-2rem)] min-w-(--radix-select-trigger-width) overflow-y-auto rounded-md border border-input bg-popover text-popover-foreground shadow-menu", className)}
        position={position}
        align={align}
        sideOffset={8}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          data-position={position}
          className="w-full"
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-3 py-2 text-small text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex min-h-touch w-full cursor-pointer items-center gap-2 rounded-sm py-3 pr-10 pl-3 text-body select-none focus:bg-accent focus:text-accent-foreground focus-visible:outline-offset-[-3px] data-disabled:pointer-events-none data-disabled:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon aria-hidden="true" className="pointer-events-none" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex min-h-touch cursor-default items-center justify-center bg-popover [&_svg]:size-5",
        className
      )}
      {...props}
    >
      <ChevronUpIcon aria-hidden="true" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex min-h-touch cursor-default items-center justify-center bg-popover [&_svg]:size-5",
        className
      )}
      {...props}
    >
      <ChevronDownIcon aria-hidden="true" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
