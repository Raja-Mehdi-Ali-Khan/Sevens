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
      className="flex flex-col items-center text-center select-none min-w-[64px] sm:min-w-[84px]"
    >
      <m.div
        key={dealVersion > 0 && !shouldReduceMotion ? `deal-${dealVersion}` : "avatar"}
        initial={dealVersion > 0 && !shouldReduceMotion ? { opacity: 0 } : false}
        animate={{ opacity: 1, transition: { duration: shouldReduceMotion ? 0.12 : 0.25 } }}
        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 bg-[var(--chip)] flex items-center justify-center font-bold text-sm sm:text-base text-[var(--tx)] shadow-md ${
          isCurrentTurn
            ? "border-[var(--acc)] text-[var(--acc)] shadow-[var(--glow)]"
            : "border-[var(--acc)]/75"
        }`}
      >
        {initial}
      </m.div>

      <div
        className={`mt-1 px-1.5 py-0.5 rounded-md bg-[var(--chip)]/95 border max-w-[78px] sm:max-w-[110px] ${
          isCurrentTurn ? "border-[var(--acc)]" : "border-[var(--edge)]/70"
        }`}
      >
        <div
          className="truncate text-[11px] sm:text-xs font-bold leading-tight text-[var(--tx)]"
          title={name}
        >
          {name}
        </div>
        <div className="text-[10px] font-medium leading-tight text-[var(--mut)] whitespace-nowrap">
          {cardCount} {cardCount === 1 ? "card" : "cards"}
        </div>
      </div>

      {(isBot || playableCount !== null) && (
        <div className="mt-0.5 flex flex-wrap items-center justify-center gap-1">
          {playableCount !== null && (
            <span className="theme-seat-hint" aria-label={`${playableCount} playable cards`}>
              {hintLabel(playableCount)}
            </span>
          )}
          {isBot && <span className="theme-bot-tag">BOT</span>}
        </div>
      )}
    </m.div>
  );
}
