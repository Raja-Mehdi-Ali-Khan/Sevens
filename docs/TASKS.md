# TASKS.md

Do phases in order. Do not start a phase until the previous one is green (`npm run typecheck` and `npm test`).

## Phase 0: Scaffold (human, about 10 minutes)
- [x] Root `package.json` has `"private": true` and `"workspaces": ["packages/*", "apps/*"]`
- [x] Root scripts: `typecheck` = `npm run typecheck --workspaces --if-present`, `test` = `npm run test --workspaces --if-present`
- [x] `.gitignore` contains `node_modules`, `dist`, `.env`
- [x] `AGENTS.md` and `docs/*.md` committed

## Phase 1: Engine (`packages/engine`)  Agent: Codex
- [x] Package `@cardgame/engine`, ESM, strict TS, Vitest, scripts `test` and `typecheck`
- [x] All exports in `docs/ARCHITECTURE.md` section 2 implemented
- [x] Unit tests cover every vector in `docs/RULES.md` section 10
- [x] Simulation test: 500 seeded random full games (random choice among options). Assert all invariants from RULES section 10, no deadlock, and `getPlayerView` never contains another seat's cards
**Done when:** the simulation passes and `getTurnPlan` / `playCard` / `passTurn` / `startNextRound` behave exactly as RULES.md describes.

## Phase 2: Server (`apps/server`)  Agent: Codex
- [x] Colyseus `GameRoom`, 5-character join codes, 4 seats, host `start`
- [x] Orchestration loop with auto-play, auto-pass, timeout, round and game transitions
- [x] Per-client `view` and `event` messages, zod validation, reconnect window, bot takeover
- [x] Integration test: 4 test clients play 7 full rounds; each client only ever receives its own hand
**Done when:** the integration test passes and a manual run with 4 browser-less clients finishes a game.

## Phase 3: Thin client (`apps/web`)  Agent: Antigravity
- [x] Home, Lobby, Table, Round summary, Game over screens; plain styling
- [x] Highlights `legalCards`, shows auto-play and no-playable-card messages
- [x] Four browser tabs can play a full game against the local server
**Done when:** a full 7-round game is playable in 4 tabs.

## Phase 4a: Mobile layout + card art  Agent: Antigravity
- [x] Mobile-first layout for 360px-430px portrait phones, safe areas, centered column on desktop
- [x] Real card faces with optimized vector SVG assets (Byron Knoll WTFPL / AustinGabriel CC0)
- [x] PlayingCard size system ('tile', 'sm', 'md', 'lg') with CSS fallbacks and >= 44x44px touch targets
- [x] Overlapping two-row hand layout with >= 40px exposed card width
- [x] Opponents single-row compact chips and inline expandable scores panel
- [x] SuitTable tile layout with recent-card highlight
- [x] Screen wake lock and visibilitychange reconnection handling
- [x] Rasterized face and back art to size-bounded WebP assets; CSS-only opponent mini backs

## Phase 4b: Animations  Agent: Antigravity
- [ ] Card play and deal animations, transitions, sound toggle (optional)

## Phase 4c: Low-card hint snapshot
- [x] Engine snapshots low-card playable counts after each seat's own turn; opponent chips display the count only

## Phase 5: Hardening and deploy  Agent: both
- [ ] Rate limiting, input limits, error screens, reconnect UX
- [ ] GitHub Actions: typecheck and test on push
- [ ] Deploy server (WebSocket host) and client (static host), use `wss://`
- [ ] Playtest with 4 real people on different networks

---

## Prompt for Phase 1 (paste into Codex)

```
Read AGENTS.md, docs/RULES.md and docs/ARCHITECTURE.md completely before writing any code.

Task: implement Phase 1 from docs/TASKS.md: the game engine in packages/engine.

Steps:
1. Create packages/engine as an ESM TypeScript package named @cardgame/engine, with strict tsconfig, Vitest, and scripts "test" (vitest run) and "typecheck" (tsc --noEmit). If the root package.json lacks workspaces or the root test/typecheck scripts, add them as described in docs/TASKS.md Phase 0. Zero runtime dependencies.
2. Implement exactly the public API in docs/ARCHITECTURE.md section 2 in these files: src/types.ts, src/rng.ts, src/deck.ts, src/rules.ts, src/scoring.ts, src/game.ts, src/view.ts, src/index.ts (re-exports only).
3. Rules come only from docs/RULES.md. Pay attention to: first move is 7H only; a 7 of an unopened suit is always legal once play has started; ace is always low and ranks never wrap; forced play (passTurn must fail with MUST_PLAY if the seat has a legal card); round ends immediately when a hand empties; round 7 ends in game_over with shared winners on ties.
4. State must be immutable. No Math.random, no Date, no I/O. Shuffle uses the injected Rng (Fisher-Yates). secureRng uses globalThis.crypto.
5. Tests in packages/engine/test/: deck.test.ts, rules.test.ts, scoring.test.ts, game.test.ts, view.test.ts, simulation.test.ts. Cover every vector in RULES.md section 10. The simulation plays 500 seeded games with random choices among legal options and asserts every invariant, no deadlock, and that getPlayerView never exposes another seat's cards.
6. Run npm install, npm run typecheck and npm test from the repo root until both pass.

Constraints: do not touch apps/ or add features beyond the task. If RULES.md or ARCHITECTURE.md is ambiguous or contradictory, stop and ask instead of guessing.

When finished, tick the Phase 1 boxes in docs/TASKS.md and summarise what you built and any assumptions you made.
```
