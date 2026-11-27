export function botCount(humanCount: number): number {
  const clamped = Math.min(Math.max(Math.floor(humanCount), 0), 4);
  return 4 - clamped;
}

export function startButtonLabel(humanCount: number, confirming: boolean): string {
  const bots = botCount(humanCount);
  if (bots === 0) return "Start game";
  const noun = bots === 1 ? "bot" : "bots";
  return confirming
    ? `Tap again to start with ${bots} ${noun}`
    : `Start with ${bots} ${noun}`;
}
