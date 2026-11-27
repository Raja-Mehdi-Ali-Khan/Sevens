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
      className={`theme-seat flex flex-col items-center text-center select-none px-1.5 py-1 sm:px-2.5 sm:py-1.5 min-w-[60px] max-w-[78px] sm:min-w-[84px] sm:max-w-[116px] shadow-md ${
        isCurrentTurn ? "theme-turn" : ""
      }`}
    >
      <m.div
        key={dealVersion > 0 && !shouldReduceMotion ? `deal-${dealVersion}` : "seat-info"}
        initial={dealVersion > 0 && !shouldReduceMotion ? { opacity: 0 } : false}
        animate={{ opacity: 1, transition: { duration: shouldReduceMotion ? 0.12 : 0.25 } }}
        className="w-full min-w-0 flex flex-col items-center"
      >
        <div className="flex items-center justify-center gap-1 w-full min-w-0">
          <span
            className="truncate text-[11px] sm:text-xs font-bold leading-tight text-[var(--tx)]"
            title={name}
          >
            {name}
          </span>
          {isBot && <span className="theme-bot-tag shrink-0">BOT</span>}
        </div>

        <div className="mt-0.5 flex flex-wrap items-center justify-center gap-1">
          <span className="text-[10px] font-medium leading-tight text-[var(--mut)] whitespace-nowrap">
            {cardCount} {cardCount === 1 ? "card" : "cards"}
          </span>
          {playableCount !== null && (
            <span className="theme-seat-hint" aria-label={`${playableCount} playable cards`}>
              {hintLabel(playableCount)}
            </span>
          )}
        </div>
      </m.div>
    </m.div>
  );
}
