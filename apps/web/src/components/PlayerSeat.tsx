import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import type { Seat } from "@cardgame/engine";
import { hintLabel } from "../lib/hintLabel";

interface PlayerSeatProps {
  seat: Seat;
  name: string;
  cardCount: number;
  playableCount: number | null;
  isCurrentTurn: boolean;
  isBot: boolean;
  passNonce?: number;
  dealVersion?: number;
}

export function PlayerSeat({
  seat,
  name,
  cardCount,
  playableCount,
  isCurrentTurn,
  isBot,
  passNonce = 0,
  dealVersion = 0,
}: PlayerSeatProps) {
  const shouldReduceMotion = useReducedMotion();
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    if (passNonce > 0 && !shouldReduceMotion) {
      setShakeKey((k) => k + 1);
    }
  }, [passNonce, shouldReduceMotion]);

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <m.div
      data-seat-chip={seat}
      key={shakeKey > 0 ? `shake-${shakeKey}` : "idle"}
      initial={shakeKey > 0 && !shouldReduceMotion ? { x: 0 } : false}
      animate={
        shakeKey > 0 && !shouldReduceMotion
          ? { x: [0, -4, 4, -3, 3, 0], transition: { duration: 0.3 } }
          : undefined
      }
      className={`theme-seat w-[58px] sm:w-[92px] min-w-0 flex flex-col items-center text-center select-none px-1.5 py-1 sm:px-2 sm:py-1.5 ${
        isCurrentTurn ? "theme-turn" : ""
      }`}
    >
      <div className="flex items-center justify-center gap-1.5 w-full min-w-0">
        <m.div
          key={dealVersion > 0 && !shouldReduceMotion ? `deal-${dealVersion}` : "avatar"}
          initial={dealVersion > 0 && !shouldReduceMotion ? { opacity: 0 } : false}
          animate={{ opacity: 1, transition: { duration: shouldReduceMotion ? 0.12 : 0.25 } }}
          className={`w-6 h-6 sm:w-8 sm:h-8 shrink-0 rounded-full border bg-[var(--back)] flex items-center justify-center font-bold text-xs sm:text-sm text-[var(--tx)] ${
            isCurrentTurn
              ? "border-[var(--acc)] text-[var(--acc)]"
              : "border-[var(--edge)]"
          }`}
        >
          {initial}
        </m.div>
        <span
          className="truncate text-xs font-bold leading-tight text-[var(--tx)]"
          title={name}
        >
          {name}
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
        <span className="text-[11px] font-medium leading-tight text-[var(--mut)] whitespace-nowrap">
          {cardCount} {cardCount === 1 ? "card" : "cards"}
        </span>
        {playableCount !== null && (
          <span className="theme-seat-hint" aria-label={`${playableCount} playable cards`}>
            {hintLabel(playableCount)}
          </span>
        )}
        {isBot && <span className="theme-bot-tag">BOT</span>}
      </div>
    </m.div>
  );
}
