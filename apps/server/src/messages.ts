import { z } from "zod";
import type { CardId, GameEvent, PlayerView, Seat } from "@cardgame/engine";
import { LOW_CARD_HINT_THRESHOLD } from "@cardgame/engine";
import { NAME_MAX_LENGTH, ROOM_CODE_LENGTH } from "./config";
import { normalizeRoomCode } from "./roomCode";

const suitSchema = z.enum(["H", "D", "C", "S"]);
const rankSchema = z.number().int().min(1).max(13);
const seatSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);
const cardIdSchema = z.string().regex(/^(1[0-3]|[1-9])[HDCS]$/).transform((id) => id as CardId);
const cardSchema = z.object({ suit: suitSchema, rank: rankSchema }).strict();
const runSchema = z.object({ low: rankSchema, high: rankSchema }).strict();
const tableSchema = z.object({ H: runSchema.nullable(), D: runSchema.nullable(), C: runSchema.nullable(), S: runSchema.nullable() }).strict();
const nullableScoresSchema = z.array(z.number().int().nonnegative()).length(4).nullable();
const scoresSchema = z.array(z.number().int().nonnegative()).length(4);
const playableCountsSchema = z.array(
  z.number().int().min(0).max(LOW_CARD_HINT_THRESHOLD).nullable(),
).length(4);

export const joinOptionsSchema = z.object({
  name: z.string().min(1).max(NAME_MAX_LENGTH),
  code: z.string().transform(normalizeRoomCode).pipe(
    z.string().length(ROOM_CODE_LENGTH).regex(/^[A-HJ-NP-Z2-9]+$/),
  ).optional(),
}).strict();

export const startMessageSchema = z.undefined();
export const playMessageSchema = z.object({ card: cardIdSchema }).strict();

export const lobbyMessageSchema = z.object({
  code: z.string().length(ROOM_CODE_LENGTH),
  hostSeat: seatSchema.nullable(),
  players: z.array(z.object({ seat: seatSchema, name: z.string(), connected: z.boolean() }).strict()),
}).strict();

export const viewMessageSchema = z.object({
  seat: seatSchema,
  round: z.number().int().min(1).max(7),
  phase: z.enum(["in_round", "round_over", "game_over"]),
  currentSeat: seatSchema,
  hand: z.array(cardSchema),
  legalCards: z.array(cardIdSchema),
  turnPlan: z.enum(["auto_play", "auto_pass", "await_choice", "waiting"]),
  table: tableSchema,
  handCounts: scoresSchema,
  playableCounts: playableCountsSchema,
  totals: scoresSchema,
  roundScores: nullableScoresSchema,
  roundWinner: seatSchema.nullable(),
  winners: z.array(seatSchema).nullable(),
}).strict().transform((view) => view as PlayerView);

const eventSchemas = [
  z.object({ type: z.literal("card_played"), seat: seatSchema, card: cardSchema, auto: z.boolean() }).strict(),
  z.object({ type: z.literal("passed"), seat: seatSchema }).strict(),
  z.object({ type: z.literal("round_won"), seat: seatSchema, roundScores: scoresSchema, totals: scoresSchema }).strict(),
  z.object({ type: z.literal("round_started"), round: z.number().int().min(1).max(7), starter: seatSchema }).strict(),
  z.object({ type: z.literal("game_over"), winners: z.array(seatSchema), totals: scoresSchema }).strict(),
] as const;

export const eventMessageSchema = z.discriminatedUnion("type", eventSchemas).transform((event) => event as GameEvent);
export const errorMessageSchema = z.object({ code: z.string().min(1), message: z.string() }).strict();

export type JoinOptions = z.infer<typeof joinOptionsSchema>;
export type StartMessage = z.infer<typeof startMessageSchema>;
export type PlayMessage = z.infer<typeof playMessageSchema>;
export type LobbyMessage = z.infer<typeof lobbyMessageSchema>;
export type ViewMessage = z.infer<typeof viewMessageSchema>;
export type EventMessage = z.infer<typeof eventMessageSchema>;
export type ErrorMessage = z.infer<typeof errorMessageSchema>;
export type ClientMessage = { type: "start" } | { type: "play"; payload: PlayMessage };
export type ServerMessage =
  | { type: "lobby"; payload: LobbyMessage }
  | { type: "view"; payload: ViewMessage }
  | { type: "event"; payload: EventMessage }
  | { type: "error"; payload: ErrorMessage };

export type { Seat };
