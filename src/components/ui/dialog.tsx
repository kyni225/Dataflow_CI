"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onOpenChange,
  children
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <button
        aria-label="Fermer"
        className="absolute inset-0"
        type="button"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  );
}

export function DialogContent({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative z-10 w-full max-w-md rounded-lg border bg-card p-5 shadow-xl", className)}>
      {children}
    </div>
  );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5 pr-8">{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold">{children}</h2>;
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function DialogClose({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="absolute right-3 top-3"
      title="Fermer"
      aria-label="Fermer"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
