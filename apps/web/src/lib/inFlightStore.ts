import { useSyncExternalStore } from "react";
import type { CardId } from "@cardgame/engine";

const inFlightIds = new Set<CardId>();
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function addInFlightCard(cardId: CardId): void {
  if (inFlightIds.has(cardId)) return;
  inFlightIds.add(cardId);
  emit();
}

export function removeInFlightCard(cardId: CardId): void {
  if (!inFlightIds.has(cardId)) return;
  inFlightIds.delete(cardId);
  emit();
}

export function clearInFlightCards(): void {
  if (inFlightIds.size === 0) return;
  inFlightIds.clear();
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useIsCardInFlight(cardId: CardId): boolean {
  return useSyncExternalStore(
    subscribe,
    () => inFlightIds.has(cardId),
    () => false,
  );
}
