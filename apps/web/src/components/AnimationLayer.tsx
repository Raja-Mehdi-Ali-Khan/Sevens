import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import type { CardId, Seat } from "@cardgame/engine";
import { capFlights, flightGeometry, type FlightGeometry, type RectLike } from "../lib/flight";
import { addInFlightCard, removeInFlightCard } from "../lib/inFlightStore";
import type { PlayFlightItem } from "../state/gameState";
import { PlayingCard } from "./PlayingCard";

export interface PendingTapRect {
  cardId: CardId;
  rect: RectLike;
}

interface ActiveFlight {
  id: number;
  cardId: CardId;
  isOpponent: boolean;
  geometry: FlightGeometry;
  width: number;
  height: number;
}

interface AnimationLayerProps {
  plays: PlayFlightItem[];
  mySeat: Seat | null;
  pendingTapRef: MutableRefObject<PendingTapRect | null>;
  onConsumePlay: (id: number) => void;
}

const MAX_CONCURRENT_FLIGHTS = 4;
const TARGET_SEARCH_TIMEOUT_MS = 500;
const TILE_HIDE_WATCHDOG_MS = 700;

function toRectLike(rect: DOMRect): RectLike {
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

function resolveSourceRect(
  play: PlayFlightItem,
  id: CardId,
  mySeat: Seat | null,
  pendingTapRef: MutableRefObject<PendingTapRect | null>,
): RectLike | null {
  if (mySeat !== null && play.seat === mySeat) {
    if (!play.auto && pendingTapRef.current?.cardId === id) {
      const rect = pendingTapRef.current.rect;
      pendingTapRef.current = null;
      return rect;
    }
    const handEl = document.querySelector("[data-hand-container]");
    return handEl ? toRectLike(handEl.getBoundingClientRect()) : null;
  }

  const chipEl = document.querySelector(`[data-seat-chip="${play.seat}"]`);
  return chipEl ? toRectLike(chipEl.getBoundingClientRect()) : null;
}

function FlightClone({
  flight,
  onDone,
}: {
  flight: ActiveFlight;
  onDone: (id: number, cardId: CardId) => void;
}) {
  const [showFace, setShowFace] = useState(!flight.isOpponent);
  const finishedRef = useRef(false);
  const durationSec = flight.isOpponent ? 0.38 : 0.32;

  useEffect(() => {
    if (!flight.isOpponent) return;
    const flipTimer = window.setTimeout(() => {
      setShowFace(true);
    }, Math.round(durationSec * 1000 * 0.4));
    return () => window.clearTimeout(flipTimer);
  }, [flight.isOpponent, durationSec]);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onDone(flight.id, flight.cardId);
  };

  const halfW = flight.width / 2;
  const halfH = flight.height / 2;

  return (
    <m.div
      initial={{
        x: flight.geometry.fromX - halfW,
        y: flight.geometry.fromY - halfH,
        scale: 1,
        opacity: 1,
      }}
      animate={{
        x: flight.geometry.toX - halfW,
        y: flight.geometry.toY - halfH,
        scale: flight.geometry.scale,
        opacity: 1,
      }}
      transition={{ duration: durationSec, ease: "easeOut" }}
      onAnimationComplete={finish}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: flight.width,
        height: flight.height,
        transformOrigin: "center center",
      }}
    >
      <div className="relative w-full h-full">
        <div
          className="absolute inset-0 transition-opacity duration-75"
          style={{ opacity: showFace ? 0 : 1 }}
        >
          <PlayingCard
            cardId="back"
            size="md"
            className="w-full h-full"
            style={{ width: "100%", height: "100%", minWidth: 0 }}
          />
        </div>
        <div
          className="absolute inset-0 transition-opacity duration-75"
          style={{ opacity: showFace ? 1 : 0 }}
        >
          <PlayingCard
            cardId={flight.cardId}
            size="md"
            className="w-full h-full"
            style={{ width: "100%", height: "100%", minWidth: 0 }}
          />
        </div>
      </div>
    </m.div>
  );
}

export function AnimationLayer({
  plays,
  mySeat,
  pendingTapRef,
  onConsumePlay,
}: AnimationLayerProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeFlights, setActiveFlights] = useState<ActiveFlight[]>([]);
  const processedPlayIdsRef = useRef(new Set<number>());
  const watchdogsRef = useRef(new Map<number, number>());

  const finishFlight = (id: number, cardId: CardId) => {
    const watchdog = watchdogsRef.current.get(id);
    if (watchdog !== undefined) {
      window.clearTimeout(watchdog);
      watchdogsRef.current.delete(id);
    }
    removeInFlightCard(cardId);
    setActiveFlights((prev) => prev.filter((item) => item.id !== id));
    onConsumePlay(id);
  };

  useEffect(() => {
    return () => {
      for (const watchdog of watchdogsRef.current.values()) {
        window.clearTimeout(watchdog);
      }
      watchdogsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (plays.length === 0) return;

    for (const play of plays) {
      if (processedPlayIdsRef.current.has(play.id)) continue;
      processedPlayIdsRef.current.add(play.id);

      const id = `${play.card.rank}${play.card.suit}` as CardId;
      if (shouldReduceMotion) {
        onConsumePlay(play.id);
        continue;
      }

      const startedAt = performance.now();
      let resolvedFromRect: RectLike | null = null;
      const tryLaunch = () => {
        if (!resolvedFromRect) {
          resolvedFromRect = resolveSourceRect(play, id, mySeat, pendingTapRef);
        }
        const fromRect = resolvedFromRect;
        const tileEl = document.querySelector(`[data-tile="${id}"]`);
        const toRect = tileEl ? toRectLike(tileEl.getBoundingClientRect()) : null;

        if (fromRect && toRect && toRect.width > 0 && toRect.height > 0) {
          const cloneWidth = fromRect.width > 0 ? Math.min(fromRect.width, 54) : 48;
          const cloneHeight = fromRect.height > 0 ? Math.min(fromRect.height, 64) : 58;
          const adjustedFrom: RectLike = {
            left: fromRect.left + (fromRect.width - cloneWidth) / 2,
            top: fromRect.top + (fromRect.height - cloneHeight) / 2,
            width: cloneWidth,
            height: cloneHeight,
          };
          const geometry = flightGeometry(adjustedFrom, toRect);
          addInFlightCard(id);

          const watchdog = window.setTimeout(() => {
            removeInFlightCard(id);
          }, TILE_HIDE_WATCHDOG_MS);
          watchdogsRef.current.set(play.id, watchdog);

          const nextFlight: ActiveFlight = {
            id: play.id,
            cardId: id,
            isOpponent: mySeat === null || play.seat !== mySeat,
            geometry,
            width: cloneWidth,
            height: cloneHeight,
          };

          setActiveFlights((prev) => {
            const combined = [...prev, nextFlight];
            const capped = capFlights(combined, MAX_CONCURRENT_FLIGHTS);
            const keptIds = new Set(capped.map((f) => f.id));
            for (const dropped of prev) {
              if (!keptIds.has(dropped.id)) {
                const w = watchdogsRef.current.get(dropped.id);
                if (w !== undefined) {
                  window.clearTimeout(w);
                  watchdogsRef.current.delete(dropped.id);
                }
                removeInFlightCard(dropped.cardId);
                onConsumePlay(dropped.id);
              }
            }
            return capped;
          });
          return;
        }

        if (performance.now() - startedAt < TARGET_SEARCH_TIMEOUT_MS) {
          requestAnimationFrame(tryLaunch);
        } else {
          onConsumePlay(play.id);
        }
      };

      requestAnimationFrame(tryLaunch);
    }
  }, [plays, mySeat, shouldReduceMotion, pendingTapRef, onConsumePlay]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[35] pointer-events-none overflow-hidden"
    >
      {activeFlights.map((flight) => (
        <FlightClone key={flight.id} flight={flight} onDone={finishFlight} />
      ))}
    </div>
  );
}
