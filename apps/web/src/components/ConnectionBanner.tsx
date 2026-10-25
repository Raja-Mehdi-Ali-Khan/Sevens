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
      <div className="bg-red-600 text-white px-4 py-2 text-sm flex items-center justify-between shadow-sm">
        <span>{serverError}</span>
        <button
          onClick={onClearError}
          className="ml-4 font-bold hover:opacity-80 text-lg leading-none"
          title="Dismiss"
        >
          &times;
        </button>
      </div>
    );
  }

  if (status === "reconnecting") {
    return (
      <div className="bg-amber-500 text-white px-4 py-2 text-sm text-center font-medium animate-pulse shadow-sm">
        {message || "Reconnecting to server..."}
      </div>
    );
  }

  if (status === "connecting") {
    return (
      <div className="bg-blue-600 text-white px-4 py-2 text-sm text-center font-medium shadow-sm">
        {message || "Connecting to server..."}
      </div>
    );
  }

  if (status === "disconnected" && message) {
    return (
      <div className="bg-zinc-700 text-white px-4 py-2 text-sm text-center font-medium shadow-sm">
        {message}
      </div>
    );
  }

  return null;
}
