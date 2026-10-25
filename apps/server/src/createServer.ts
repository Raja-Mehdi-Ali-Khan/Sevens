import { defineRoom, defineServer, matchMaker } from "colyseus";
import { GameRoom } from "./GameRoom";
import { DEFAULT_TIMINGS, type TimingConfig } from "./config";
import { parseClientOrigins } from "./cors";

export function createAppServer(timings: TimingConfig = DEFAULT_TIMINGS) {
  GameRoom.timingOverrides = timings;
  const clientOrigins = parseClientOrigins(process.env.CLIENT_ORIGIN);
  matchMaker.controller.getCorsHeaders = (headers) => {
    const origin = headers.get("origin");
    return {
      "Access-Control-Allow-Origin": origin !== null && clientOrigins.includes(origin) ? origin : "",
      Vary: "Origin",
    };
  };
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
