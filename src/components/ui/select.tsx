import * as React from "react";

import { cn } from "@/lib/utils";

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "focus-ring flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
