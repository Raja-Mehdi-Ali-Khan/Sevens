import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Room as ClientRoom } from "@colyseus/sdk";
import { boot, type ColyseusTestServer } from "@colyseus/testing";
import { cardId, mulberry32 } from "@cardgame/engine";
import type { PlayerView, Seat } from "@cardgame/engine";
import type { ErrorMessage, EventMessage, LobbyMessage } from "../src/messages";
import { GameRoom } from "../src/GameRoom";
import { createAppServer } from "../src/createServer";
import type { TimingConfig } from "../src/config";

const TEST_TIMINGS: TimingConfig = {
  autoMoveDelayMs: 25,
  turnTimeoutMs: 10_000,
  reconnectWindowMs: 1000,
  nextRoundDelayMs: 25,
  gameOverLingerMs: 200,
};

const VIEW_KEYS = [
  "seat", "round", "phase", "currentSeat", "hand", "legalCards", "turnPlan", "table",
  "handCounts", "totals", "roundScores", "roundWinner", "winners",
].sort();

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitUntil(predicate: () => boolean, message: string, timeoutMs = 5000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error(message);
    await delay(5);
  }
}

function assertDisjointHands(views: PlayerView[]): void {
  const ids = views.flatMap((view) => view.hand.map(cardId));
  expect(new Set(ids).size).toBe(ids.length);
}

describe("GameRoom integration", () => {
  let testServer: ColyseusTestServer;

  beforeAll(async () => {
    testServer = await boot(createAppServer(TEST_TIMINGS));
  });

  afterAll(async () => {
    await testServer.shutdown();
    GameRoom.timingOverrides = {
      autoMoveDelayMs: 1000,
      turnTimeoutMs: 30_000,
      reconnectWindowMs: 60_000,
      nextRoundDelayMs: 5000,
      gameOverLingerMs: 60_000,
    };
  });

  it("creates a code room, validates clients, isolates views, and completes seven rounds", async () => {
    const health = await testServer.http.get("/health");
    expect(health.data).toBe("ok");

    const serverRoom = await testServer.createRoom("sevens", {}) as GameRoom;
    const code = serverRoom.roomId;
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/);

    const host = await testServer.connectTo(serverRoom, { name: "Host" });
    const clients: ClientRoom[] = [host];
    const views = new Map<ClientRoom, PlayerView>();
    const errors = new Map<ClientRoom, ErrorMessage[]>();
    const latestLobby = new Map<ClientRoom, LobbyMessage>();
    const protocolProblems: string[] = [];
    const startHands = new Map<number, Map<Seat, string[]>>();
    const clientSeats = new Map<ClientRoom, Seat>();
    let expectedStartRound = 1;
    let hostStartPlayer: ClientRoom = host;

    const attach = (client: ClientRoom, index: number) => {
      errors.set(client, []);
      client.onMessage("view", (view: PlayerView) => {
        views.set(client, view);
        clientSeats.set(client, view.seat);
        if (Object.keys(view).sort().join("|") !== VIEW_KEYS.join("|")) {
          protocolProblems.push("view contained unexpected fields");
        }
        const seen = startHands.get(expectedStartRound) ?? new Map<Seat, string[]>();
        if (!seen.has(view.seat) && view.round === expectedStartRound) {
          seen.set(view.seat, view.hand.map(cardId));
          startHands.set(expectedStartRound, seen);
        }
      });
      client.onMessage("error", (error: ErrorMessage) => errors.get(client)!.push(error));
      client.onMessage("lobby", (lobby: LobbyMessage) => {
        latestLobby.set(client, lobby);
      });
      client.onMessage("event", (event: EventMessage) => {
        if (event.type === "round_started") {
          expectedStartRound = event.round;
          const seen = startHands.get(expectedStartRound) ?? new Map<Seat, string[]>();
          const current = views.get(client);
          if (current?.round === expectedStartRound && !seen.has(current.seat)) {
            seen.set(current.seat, current.hand.map(cardId));
          }
          startHands.set(expectedStartRound, seen);
        }
      });
      if (index === 0) hostStartPlayer = client;
    };

    attach(host, 0);
    const joinOptions = [
      { name: "Player 2", code: code.toLowerCase() },
      { name: "Player 3", code },
      { name: "Player 4", code },
    ];
    for (let index = 0; index < joinOptions.length; index += 1) {
      const client = await testServer.connectTo(serverRoom, joinOptions[index]);
      clients.push(client);
      attach(client, index + 1);
    }

    expect(serverRoom.roomId).toBe(code);
    expect([...latestLobby.values()].every((lobby) => lobby.code === code)).toBe(true);

    const badCode = code === "ZZZZZ" ? "AAAAA" : "ZZZZZ";
    await expect(testServer.sdk.joinById(badCode, { name: "Wrong code", code: badCode })).rejects.toBeDefined();

    const nonHost = clients[1]!;
    nonHost.send("start");
    await waitUntil(
      () => errors.get(nonHost)!.some((error) => error.code === "NOT_HOST"),
      "Non-host start did not return an error",
    );

    hostStartPlayer.send("start");
    await waitUntil(() => views.size === 4, "The room did not send all four player views");
    const initialViews = [...views.values()];
    expect(initialViews.map((view) => view.hand.length)).toEqual([13, 13, 13, 13]);
    assertDisjointHands(initialViews);
    expect(protocolProblems).toEqual([]);

    const currentSeat = views.get(host)!.currentSeat;
    const nonCurrent = clients.find((client) => clientSeats.get(client) !== currentSeat)!;
    nonCurrent.send("play", { card: "7H" });
    await waitUntil(
      () => errors.get(nonCurrent)!.some((error) => error.code === "NOT_YOUR_TURN"),
      "Non-current play did not return an error",
    );

    const seededChoice = mulberry32(90210);
    const sentTurns = new Map<ClientRoom, Set<string>>();
    const lastSentAt = new Map<ClientRoom, number>();
    const completionDeadline = Date.now() + 115_000;

    while (Date.now() < completionDeadline) {
      if ([...views.values()].every((view) => view.phase === "game_over")) break;
      if (protocolProblems.length > 0) throw new Error(protocolProblems[0]);

      for (const client of clients) {
        const view = views.get(client);
        if (view === undefined || view.phase !== "in_round" || view.turnPlan !== "await_choice") continue;
        const turnKey = `${view.round}/${view.currentSeat}/${view.legalCards.join(",")}`;
        const clientTurns = sentTurns.get(client) ?? new Set<string>();
        if (clientTurns.has(turnKey)) continue;

        const remainingDelay = 125 - (Date.now() - (lastSentAt.get(client) ?? 0));
        if (remainingDelay > 0) await delay(remainingDelay);
        const latest = views.get(client);
        if (latest === undefined || latest.turnPlan !== "await_choice" || latest.currentSeat !== latest.seat) continue;
        const latestKey = `${latest.round}/${latest.currentSeat}/${latest.legalCards.join(",")}`;
        if (latestKey !== turnKey) continue;

        const option = latest.legalCards[Math.floor(seededChoice() * latest.legalCards.length)]!;
        clientTurns.add(turnKey);
        sentTurns.set(client, clientTurns);
        lastSentAt.set(client, Date.now());
        client.send("play", { card: option });
      }

      const currentViews = clients.map((client) => views.get(client));
      if (currentViews.every((view): view is PlayerView => view !== undefined)) {
        const round = currentViews[0]!.round;
        const sameState = currentViews.every((view) =>
          view.round === round && view.currentSeat === currentViews[0]!.currentSeat && view.phase === currentViews[0]!.phase,
        );
        if (sameState) assertDisjointHands(currentViews);
      }
      await delay(5);
    }

    expect([...views.values()].every((view) => view.phase === "game_over")).toBe(true);
    expect([...views.values()].every((view) => view.round === 7)).toBe(true);
    expect([...startHands.keys()].sort((left, right) => left - right)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const round of [1, 2, 3, 4, 5, 6, 7]) {
      const roundHands = startHands.get(round);
      expect(roundHands?.size).toBe(4);
      const cards = [...(roundHands?.values() ?? [])].flat();
      expect(cards).toHaveLength(52);
      expect(new Set(cards).size).toBe(52);
    }
    expect(protocolProblems).toEqual([]);
  }, 120_000);
});
