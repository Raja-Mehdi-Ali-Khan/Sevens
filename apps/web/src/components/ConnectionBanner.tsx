import type { ConnectionStatus } from "../net/client";

interface ConnectionBannerProps {
  status: ConnectionStatus;
  message: string | null;
  serverError: string | null;
  onClearError: () => void;
}

export function ConnectionBanner({
  status,
  message,
  serverError,
  onClearError,
}: ConnectionBannerProps) {
  if (serverError) {
    return (
      <aside
        aria-live="assertive"
        className="fixed top-0 left-0 right-0 z-50 max-w-[480px] mx-auto bg-red-600 text-white px-3 h-7 flex items-center justify-between text-xs font-medium shadow-md"
      >
        <span className="truncate">{serverError}</span>
        <button
          type="button"
          onClick={onClearError}
          className="ml-2 w-6 h-6 flex items-center justify-center font-bold hover:opacity-80 text-sm leading-none cursor-pointer touch-manipulation"
          title="Dismiss"
          aria-label="Dismiss error"
        >
          &times;
        </button>
      </aside>
    );
  }

  if (status === "reconnecting") {
    return (
      <aside
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-50 max-w-[480px] mx-auto bg-amber-500 text-white px-3 h-7 flex items-center justify-center text-xs font-medium animate-pulse shadow-md"
      >
        {message || "Reconnecting to server..."}
      </aside>
    );
  }

  if (status === "connecting") {
    return (
      <aside
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-50 max-w-[480px] mx-auto bg-blue-600 text-white px-3 h-7 flex items-center justify-center text-xs font-medium shadow-md"
      >
        {message || "Connecting to server..."}
      </aside>
    );
  }

  if (status === "disconnected" && message) {
    return (
      <aside
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-50 max-w-[480px] mx-auto bg-zinc-700 text-white px-3 h-7 flex items-center justify-center text-xs font-medium shadow-md"
      >
        {message}
      </aside>
    );
  }

  return null;
}
