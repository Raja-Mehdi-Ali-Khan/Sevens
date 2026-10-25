function timingFromEnvironment(name: string, fallback: number): number {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer number of milliseconds`);
  }
  return parsed;
}

export const AUTO_MOVE_DELAY_MS = timingFromEnvironment("AUTO_MOVE_DELAY_MS", 1000);
export const TURN_TIMEOUT_MS = timingFromEnvironment("TURN_TIMEOUT_MS", 30000);
export const RECONNECT_WINDOW_MS = timingFromEnvironment("RECONNECT_WINDOW_MS", 60000);
export const NEXT_ROUND_DELAY_MS = timingFromEnvironment("NEXT_ROUND_DELAY_MS", 5000);
export const GAME_OVER_LINGER_MS = timingFromEnvironment("GAME_OVER_LINGER_MS", 60000);
export const MAX_MESSAGES_PER_SECOND = 10;
export const NAME_MAX_LENGTH = 20;
export const ROOM_CODE_LENGTH = 5;

export interface TimingConfig {
  autoMoveDelayMs: number;
  turnTimeoutMs: number;
  reconnectWindowMs: number;
  nextRoundDelayMs: number;
  gameOverLingerMs: number;
}

export const DEFAULT_TIMINGS: TimingConfig = {
  autoMoveDelayMs: AUTO_MOVE_DELAY_MS,
  turnTimeoutMs: TURN_TIMEOUT_MS,
  reconnectWindowMs: RECONNECT_WINDOW_MS,
  nextRoundDelayMs: NEXT_ROUND_DELAY_MS,
  gameOverLingerMs: GAME_OVER_LINGER_MS,
};
