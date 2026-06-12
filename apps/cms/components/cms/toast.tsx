"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { createPortal } from "react-dom";

type ToastVariant = "success" | "error" | "info";
type ToastItem = { id: number; message: string; variant: ToastVariant };

type ToastApi = {
  toast: (message: string, variant?: ToastVariant) => void;
  /** Runs an async action, toasting success/error. Returns the result or null. */
  withToast: <T>(
    action: () => Promise<T>,
    options?: { success?: string; error?: string },
  ) => Promise<T | null>;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

function cleanMessage(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : "";
  if (!raw) {
    return fallback;
  }
  // Convex wraps server errors; surface the human part.
  if (raw.includes("Slug already exists")) {
    return "Ce slug est déjà utilisé — choisis-en un autre.";
  }
  const match = raw.match(/Uncaught Error:\s*(.+?)(\n|$)/);
  return match?.[1]?.trim() || raw.split("\n")[0] || fallback;
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const idRef = useRef(0);

  useEffect(() => setMounted(true), []);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = (idRef.current += 1);
    setToasts((current) => [...current, { id, message, variant }]);
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  const withToast = useCallback<ToastApi["withToast"]>(
    async (action, options) => {
      try {
        const result = await action();
        if (options?.success) {
          toast(options.success, "success");
        }
        return result;
      } catch (error) {
        toast(cleanMessage(error, options?.error ?? "Une erreur est survenue."), "error");
        return null;
      }
    },
    [toast],
  );

  const api = useMemo<ToastApi>(() => ({ toast, withToast }), [toast, withToast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted &&
        createPortal(
          <div className="toast-stack" aria-live="polite" role="status">
            {toasts.map((item) => (
              <div className={`toast toast--${item.variant}`} key={item.id}>
                {item.message}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
