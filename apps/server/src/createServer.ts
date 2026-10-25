import { defineRoom, defineServer } from "colyseus";
import { GameRoom } from "./GameRoom";
import { DEFAULT_TIMINGS, type TimingConfig } from "./config";

export function createAppServer(timings: TimingConfig = DEFAULT_TIMINGS) {
  GameRoom.timingOverrides = timings;
  return defineServer({
    rooms: {
      sevens: defineRoom(GameRoom),
    },
    express: (app) => {
      app.get("/health", (
        _request: unknown,
        response: { status: (code: number) => { send: (body: string) => unknown } },
      ) => response.status(200).send("ok"));
    },
  });
}
