import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function FieldGroup({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="field-group" className={cn("grid min-w-0 gap-6", className)} {...props} />;
}

export function Field({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="field" className={cn("flex min-w-0 flex-col gap-2", className)} {...props} />;
}

export const FieldLabel = Label;
