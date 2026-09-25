import {
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function showToast(
    message: string,
    type: ToastType = "success"
  ) {
    const id = Date.now();

    setToasts((current) => [
      ...current,
      {
        id,
        message,
        type,
      },
    ]);

    setTimeout(() => {
      setToasts((current) =>
        current.filter((toast) => toast.id !== id)
      );
    }, 4000);
  }

  function removeToast(id: number) {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id)
    );
  }

  function getIcon(type: ToastType) {
    if (type === "success") {
      return <CheckCircle2 size={20} className="text-green-400" />;
    }

    if (type === "error") {
      return <XCircle size={20} className="text-red-400" />;
    }

    if (type === "warning") {
      return <AlertTriangle size={20} className="text-yellow-400" />;
    }

    return <Info size={20} className="text-blue-400" />;
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed right-5 top-5 z-50 flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-xl"
          >
            <div className="mt-0.5 shrink-0">
              {getIcon(toast.type)}
            </div>

            <p className="flex-1 text-sm leading-relaxed text-gray-200">
              {toast.message}
            </p>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="rounded-md p-1 text-gray-500 transition-colors hover:bg-surface-hover hover:text-gray-200"
              aria-label="Fechar notificação"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast deve ser usado dentro de um ToastProvider."
    );
  }

  return context;
}