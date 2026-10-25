import type { CardId } from "@cardgame/engine";

const cardModules = import.meta.glob<string>("../assets/cards/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

/**
 * Maps a CardId (e.g. "7H", "1S", "13D") or "back" to its resolved Vite asset URL.
 */
export function getCardAsset(cardId: CardId | "back"): string | undefined {
  const target = cardId === "back" ? "/back.svg" : `/${cardId}.svg`;
  for (const [path, url] of Object.entries(cardModules)) {
    if (path.endsWith(target)) {
      return url;
    }
  }
  return undefined;
}

/**
 * Returns all card asset keys loaded by Vite.
 */
export function getAllLoadedCardKeys(): string[] {
  return Object.keys(cardModules).map((path) => {
    const file = path.split("/").pop() ?? "";
    return file.replace(".svg", "");
  });
}

