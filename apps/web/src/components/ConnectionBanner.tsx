import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
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
  const shouldReduceMotion = useReducedMotion();

  let bannerKey: string | null = null;
  let content: React.ReactNode = null;
  let toneClass = "text-[var(--acc)]";
  let live: "assertive" | "polite" = "polite";

  if (serverError) {
    bannerKey = "error";
    toneClass = "text-[var(--rt)]";
    live = "assertive";
    content = (
      <>
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
      </>
    );
  } else if (status === "reconnecting") {
    bannerKey = "reconnecting";
    content = message || "Reconnecting to server...";
  } else if (status === "connecting") {
    bannerKey = "connecting";
    content = message || "Connecting to server...";
  } else if (status === "disconnected" && message) {
    bannerKey = "disconnected";
    toneClass = "text-[var(--mut)]";
    content = message;
  }

  return (
    <AnimatePresence>
      {bannerKey && (
        <m.aside
          key={bannerKey}
          aria-live={live}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: shouldReduceMotion ? 0.12 : 0.15, ease: "easeOut" } }}
          exit={shouldReduceMotion ? { opacity: 0, transition: { duration: 0.12 } } : { opacity: 0, y: -8, transition: { duration: 0.12, ease: "easeIn" } }}
          className={`fixed top-0 left-0 right-0 z-50 max-w-[480px] mx-auto theme-panel ${toneClass} px-3 min-h-[44px] flex items-center ${
            serverError ? "justify-between" : "justify-center"
          } text-xs font-medium shadow-md`}
        >
          {content}
        </m.aside>
      )}
    </AnimatePresence>
  );
}
