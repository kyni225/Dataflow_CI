"use client";

import * as React from "react";

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

type ToastContextValue = {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = React.useCallback(
    (input: Omit<Toast, "id">) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current.slice(-2), { ...input, id }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((item) => (
          <button
            key={item.id}
            onClick={() => dismiss(item.id)}
            className={
              item.variant === "destructive"
                ? "rounded-lg border border-red-200 bg-red-50 p-3 text-left text-sm text-red-900 shadow-lg"
                : "rounded-lg border bg-card p-3 text-left text-sm shadow-lg"
            }
          >
            <span className="block font-medium">{item.title}</span>
            {item.description ? (
              <span className="mt-1 block text-muted-foreground">{item.description}</span>
            ) : null}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }
  return context;
}
