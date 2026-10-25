import type { Toast } from "../state/gameState";

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-zinc-900/95 text-white px-4 py-2.5 rounded shadow-lg text-sm border border-zinc-700 pointer-events-auto flex items-center justify-between transition-all"
        >
          <span>{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-3 text-zinc-400 hover:text-white font-bold"
            title="Dismiss toast"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
