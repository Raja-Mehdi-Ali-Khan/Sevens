# ARCHITECTURE.md

## 1. Shape
```
Browser (React)  --WSS-->  apps/server (Node + Colyseus)  --imports-->  packages/engine
 x4 players                 rooms, join codes, timers, bots             pure rules, no I/O
```
- No peer-to-peer. All players connect outward to the server, so different networks work with no extra setup.
- `apps/web` and `apps/server` both depend on `packages/engine` (shared types). `apps/web` never imports from `apps/server`.
- Game state lives in server memory for v1. No database.

## 2. Engine API (`packages/engine`, public exports from `src/index.ts`)
All functions are pure. State is immutable: return new objects, never mutate arguments.

```ts
export type Suit = 'H' | 'D' | 'C' | 'S';
export type Rank = 1|2|3|4|5|6|7|8|9|10|11|12|13;
export type CardId = `${Rank}${Suit}`;            // "7H", "13D"
export interface Card { suit: Suit; rank: Rank }
export type Seat = 0 | 1 | 2 | 3;
export type Rng = () => number;                    // returns [0, 1)

export interface Run { low: Rank; high: Rank }
export type TableState = Record<Suit, Run | null>;
export type Phase = 'in_round' | 'round_over' | 'game_over';

export interface GameState {
  totalRounds: 7;
  round: number;                 // 1..7
  phase: Phase;
  hands: Card[][];               // index = seat, always length 4
  lowCardHints: (number | null)[]; // count-only snapshot after each seat's last turn, length 4
  table: TableState;
  currentSeat: Seat;
  totals: number[];              // cumulative penalty, length 4, completed rounds only
  roundScores: number[] | null;  // penalties of the last finished round
  roundWinner: Seat | null;
  winners: Seat[] | null;        // set only when phase === 'game_over'
}

export type TurnPlan =
  | { kind: 'auto_play'; card: Card }
  | { kind: 'auto_pass' }
  | { kind: 'await_choice'; options: Card[] };

export type GameEvent =
  | { type: 'card_played'; seat: Seat; card: Card; auto: boolean }
  | { type: 'passed'; seat: Seat }                       // no playable card
  | { type: 'round_won'; seat: Seat; roundScores: number[]; totals: number[] }
  | { type: 'round_started'; round: number; starter: Seat }
  | { type: 'game_over'; winners: Seat[]; totals: number[] };

export type EngineError =
  | 'WRONG_PHASE' | 'NOT_YOUR_TURN' | 'CARD_NOT_IN_HAND'
  | 'ILLEGAL_CARD' | 'MUST_PLAY' | 'CANNOT_PASS';
export type Result<T> = { ok: true; value: T } | { ok: false; error: EngineError };

// Setup helpers
export function createDeck(): Card[];
export function shuffle<T>(items: T[], rng: Rng): T[];     // Fisher-Yates, returns a copy
export function mulberry32(seed: number): Rng;             // seeded, for tests
export function secureRng(): Rng;                          // crypto-based, for the server

// Game flow
export function createGame(rng: Rng): GameState;           // round 1 dealt, phase 'in_round'
export function getLegalMoves(state: GameState, seat: Seat): Card[];
export function getTurnPlan(state: GameState): TurnPlan;   // for state.currentSeat
export function playCard(state: GameState, seat: Seat, card: Card):
  Result<{ state: GameState; events: GameEvent[] }>;
export function passTurn(state: GameState, seat: Seat):
  Result<{ state: GameState; events: GameEvent[] }>;       // only when 0 legal cards
export function startNextRound(state: GameState, rng: Rng):
  Result<{ state: GameState; events: GameEvent[] }>;       // only when phase === 'round_over'

// Scoring and views
export function scoreHand(cards: Card[]): number;
export function cardId(card: Card): CardId;
export function parseCardId(id: string): Card | null;      // null if invalid
export interface PlayerView {
  seat: Seat;
  round: number;
  phase: Phase;
  currentSeat: Seat;
  hand: Card[];                  // own hand only
  legalCards: CardId[];          // empty unless it is this seat's turn
  turnPlan: 'auto_play' | 'auto_pass' | 'await_choice' | 'waiting';
  table: TableState;
  handCounts: number[];          // length 4
  playableCounts: (number | null)[]; // copy of lowCardHints in_round; otherwise four nulls
  totals: number[];
  roundScores: number[] | null;
  roundWinner: Seat | null;
  winners: Seat[] | null;
}
export function getPlayerView(state: GameState, seat: Seat): PlayerView;
```

`playCard` ends the round when the hand becomes empty: it sets `phase` to `round_over` (or `game_over` after round 7), fills `roundScores`, `roundWinner`, updates `totals`, and emits `round_won` (and `game_over` if applicable). `playCard` and `passTurn` advance `currentSeat` otherwise.

## 3. Server (`apps/server`)
- Colyseus `GameRoom`, `maxClients = 4`. Seat = join order (first joiner is seat 0 and the host).
- The authoritative `GameState` is held in a private room field. **Do not put it in a synced Colyseus schema.** The server sends each client its own JSON `PlayerView` (this guarantees hidden hands cannot leak through state sync).
- **Room code:** 5 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no 0/O/1/I), case-insensitive, unique among live rooms. Use Colyseus custom room IDs if the current Colyseus version supports it (check its docs); otherwise store the code in room metadata and look the room up with the matchmaker.
- **Orchestration loop (after the game starts and after every state change):**
  1. Send each client its `view`, plus any `event`s.
  2. If `phase === 'in_round'`, read `getTurnPlan`.
     - `auto_play` / `auto_pass`: wait `AUTO_MOVE_DELAY_MS`, then call `playCard` / `passTurn`, and loop.
     - `await_choice`: start `TURN_TIMEOUT_MS`; on a valid `play` message, apply it; on timeout, play the highest-rank option.
  3. If `phase === 'round_over'`: wait `NEXT_ROUND_DELAY_MS`, then `startNextRound`.
  4. If `phase === 'game_over'`: keep the room open briefly, then dispose.
- **Disconnects:** allow reconnection for `RECONNECT_WINDOW_MS`; after that a bot plays that seat.
- **Host:** the lowest connected seat before the game starts. Only the host may send `start`, and only when 4 players are seated.
- Timing constants live in `apps/server/src/config.ts`.

## 4. Message protocol (JSON over Colyseus messages, validated with zod)
Client -> server:
| type | payload | rules |
|---|---|---|
| join options | `{ name: string (1-20 chars), code?: string }` | with `code` joins an existing room; without creates one |
| `start` | none | host only, lobby only, 4 players seated |
| `play` | `{ card: CardId }` | only when it is that seat's `await_choice` turn |

Server -> client:
| type | payload |
|---|---|
| `lobby` | `{ code, hostSeat, players: { seat, name, connected }[] }` |
| `view` | `PlayerView` |
| `event` | `GameEvent` (for toasts and animations) |
| `error` | `{ code: string, message: string }` |

## 5. Client (`apps/web`)
- Screens: Home (create / join by code) -> Lobby (code, seats, host Start button) -> Table -> Round summary -> Game over.
- Render only from `view`. The client never decides legality; it highlights `legalCards` and sends `play`.
- A single-option turn shows an "auto-played" message, and a pass shows "<name> has no playable card" to everyone.
- Layout: local player at the bottom; seats 1, 2, 3 continue to the right (anticlockwise as seen from above) around the table.

## 6. Decision log
- Per-client JSON views instead of Colyseus StateView: simpler, easier to test, harder to leak hidden hands.
- Engine owns auto-play and auto-pass decisions (`getTurnPlan`); the server only adds delays and timers.
- 4 seats only for v1; 5 players is out of scope (52 cards do not divide evenly by 5).
