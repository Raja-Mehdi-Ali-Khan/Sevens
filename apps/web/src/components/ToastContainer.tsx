import type { Toast } from "../state/gameState";

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-12 left-2 right-2 max-w-[440px] mx-auto z-40 flex flex-col gap-1.5 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="theme-toast px-3 py-2 rounded-lg shadow-lg pointer-events-auto flex items-center justify-between gap-2"
        >
          <span className="text-xs leading-snug line-clamp-2 flex-1">
            {toast.message}
          </span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 w-11 h-11 flex items-center justify-center text-[var(--mut)] hover:text-[var(--tx)] text-base font-bold touch-manipulation cursor-pointer"
            aria-label="Dismiss toast"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
