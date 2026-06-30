import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "secondary";

const variants: Record<BadgeVariant, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  destructive: "bg-red-100 text-red-800",
  secondary: "bg-secondary text-secondary-foreground"
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
