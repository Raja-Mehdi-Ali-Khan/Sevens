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
        className="fixed top-0 left-0 right-0 z-50 max-w-[480px] mx-auto theme-panel text-[var(--rt)] px-3 min-h-[44px] flex items-center justify-between text-xs font-medium shadow-md"
      >
        <span className="truncate">{serverError}</span>
        <button
          type="button"
          onClick={onClearError}
          className="ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center font-bold text-sm leading-none cursor-pointer touch-manipulation"
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
        className="fixed top-0 left-0 right-0 z-50 max-w-[480px] mx-auto theme-panel text-[var(--acc)] px-3 min-h-[44px] flex items-center justify-center text-xs font-medium shadow-md"
      >
        {message || "Reconnecting to server..."}
      </aside>
    );
  }

  if (status === "connecting") {
    return (
      <aside
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-50 max-w-[480px] mx-auto theme-panel text-[var(--acc)] px-3 min-h-[44px] flex items-center justify-center text-xs font-medium shadow-md"
      >
        {message || "Connecting to server..."}
      </aside>
    );
  }

  if (status === "disconnected" && message) {
    return (
      <aside
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-50 max-w-[480px] mx-auto theme-panel text-[var(--mut)] px-3 min-h-[44px] flex items-center justify-center text-xs font-medium shadow-md"
      >
        {message}
      </aside>
    );
  }

  return null;
}
