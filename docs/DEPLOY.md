# Deploying Sevens to Render

This Blueprint creates a free Node web service in Singapore for Colyseus and a free static site for the Vite app.

## Create the Blueprint

1. Push this repository to a Git provider connected to Render.
2. In the Render Dashboard, choose **New > Blueprint**.
3. Connect this repository (authorize your Git provider first if Render asks). Render reads `render.yaml` from the repository root.
4. In the Blueprint form, choose a Blueprint name and confirm the branch. Render prompts for the two `sync: false` values during this initial creation flow. Enter temporary values so the first build can complete:
   - `CLIENT_ORIGIN`: `https://example.onrender.com`
   - `VITE_SERVER_URL`: `wss://example.onrender.com`
5. Click **Deploy Blueprint** and wait for both services to deploy. The web build requires `VITE_SERVER_URL` to be present; it will fail with a direct message if it is missing.
6. In the Render Dashboard, open **sevens-server > Settings > Environment** and set `CLIENT_ORIGIN` to the exact static site origin shown by Render, for example `https://sevens-web.onrender.com` (no path or trailing slash is required).
7. Open **sevens-web > Settings > Environment** and set `VITE_SERVER_URL` to the server address with the secure WebSocket scheme, for example `wss://sevens-server.onrender.com`.
8. Save the changes. Redeploy the server so its CORS allowlist is current, then redeploy the static site so Vite bakes the real server URL into the app.

Render only prompts for `sync: false` values during the first Blueprint creation. Later changes to these values are made in each service's Dashboard environment settings. The temporary values above let that first build finish; replace them with the actual service origins after the services exist.

## Invite links

The app reads `?code=XXXXX` at the site root, so share links such as `https://sevens-web.onrender.com/?code=ABCDE`. No router rewrite is needed.

## Waking the free server

Render spins a free web service down after 15 minutes without inbound traffic. The next HTTP request or new WebSocket connection wakes it, which typically takes about a minute. Before starting a game, open `https://sevens-server.onrender.com/health` and wait for `ok`; then reload or join from the game site if the first connection timed out.

## Free-tier limits

- The server uses a single free instance (0.1 CPU and 512 MB RAM). It can sleep after 15 idle minutes and may restart; active rooms are in memory, so a restart loses them.
- Each Render workspace gets 750 free instance hours per calendar month, shared across its free web services. Spun-down services do not consume instance hours. Exhaustion suspends free web services until the next month.
- Free web services and static sites use the workspace's included outbound bandwidth and build pipeline minutes. Exceeding the included amounts can suspend services or prevent new builds depending on the workspace's billing setup.
- Free web services have ephemeral filesystems and no persistent disks. This app does not store game state outside server memory.

See Render's [free service limits](https://render.com/docs/free) for the current usage details.
