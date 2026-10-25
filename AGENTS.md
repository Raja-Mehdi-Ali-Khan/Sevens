# AGENTS.md

## Project
Online 4-player Sevens-style card game (7 rounds, penalty scoring). Four players join one room with a short code, from any network.

- Rules (source of truth): `docs/RULES.md`
- Design and contracts: `docs/ARCHITECTURE.md`
- Task list and prompts: `docs/TASKS.md`

Read all three before writing code.

## Stack
TypeScript (strict) everywhere. npm workspaces monorepo. Node LTS (>= 22).

| Path | What | Key tech |
|---|---|---|
| `packages/engine` | Pure game rules. Zero runtime dependencies. | Vitest |
| `apps/server` | Authoritative WebSocket game server | Colyseus, zod |
| `apps/web` | Browser client | React, Vite, Tailwind, colyseus.js |

Use current stable versions. If unsure about a library API, read its current docs instead of guessing.

## Commands (run from repo root)
The dev shell is Windows PowerShell. Do not add bash-only scripts; use cross-platform npm scripts.

```
npm install
npm run typecheck      # tsc --noEmit in every workspace
npm test               # vitest in every workspace
npm run dev:server     # starts apps/server
npm run dev:web        # starts apps/web
```

## Golden rules
1. **Rules live only in `packages/engine`.** Never re-implement legality, scoring or turn logic in server or web.
2. **Server is authoritative.** Clients send intents (for example "play 7H"). The server validates each one with the engine.
3. **Hidden information.** Never send one player's hand to another. Only the output of `getPlayerView(state, seat)` may leave the server.
4. **Engine is pure and immutable.** No I/O, no `Date`, no `Math.random` (inject an `Rng`), never mutate input state.
5. **Validate every incoming message with zod.** Never trust client input.
6. **If `RULES.md` is ambiguous or seems wrong, stop and ask.** Do not change rules silently.
7. **Minimal scope.** Nothing beyond `docs/TASKS.md`: no 5-player mode, accounts, chat, database or spectators.

## Workflow
- Write tests together with the code. A task is done only when `npm run typecheck` and `npm test` both pass.
- One branch per task: `feat/<area>-<topic>`. Small commits. Commit after every green run.
- Ownership, to avoid edit conflicts: Codex works in `packages/engine` and `apps/server`; Antigravity works in `apps/web`. One agent per directory at a time.
- Changes to shared types or the message protocol: update `docs/ARCHITECTURE.md` first, then the code.
- Tick the checkbox in `docs/TASKS.md` when a task is finished.

## Code style
- `strict` TypeScript, no `any`, named exports, small files.
- Plain functions in the engine (no classes).
- Comments explain why, not what.

## Security
- No secrets in the repo. `.env` files are git-ignored.
- Room codes are random, case-insensitive, and expire when the room closes.
- Rate-limit join attempts and message frequency per connection.
