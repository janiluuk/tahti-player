# Fan live chat vs channel comments

**Status:** blocked

**Blocker:** Needs a human on a **brand-new** channel against live API +
`wss://chat.tahti.live` (mock Send already works). Verification playbook below.
**Source:** Artist lifecycle e2e (`…/artist-lifecycle/ISSUES.md` P1)

## Done

- LIVE channel surfaces chat above comments (#916); Live chat block points at `/chat/$slug` (#914).
- Mock fan room token + local echo Send under `VITE_FORCE_MOCK` (#934); ChannelView live CTA test (#939).

## Left

- Real Centrifugo **Send** for brand-new channels against the live API (not mock).

## Verification playbook (2026-10-19)

Use **beta** (or prod after cutover), **not** `VITE_FORCE_MOCK=1`. Mock always
echoes Send locally and never proves Centrifugo.

### A. Prepare a brand-new channel

1. Sign in as an artist who can create a channel (or register a new artist).
2. Create a **new** channel slug (never gone live before). Note the slug.
3. Go live (or leave offline — check both if you can):
   - **On air:** channel page should show Chat above Comments; open chat /
     `/chat/<slug>` / `?chat=1`.
   - **Off air:** confirm whether fan room is still offered (product may gate
     on LIVE).

### B. Join live chat as the artist (owner)

1. Open DevTools → Network. Filter `fan-token` and `websocket` / `WS`.
2. Open the channel chat UI → enter the **fan room** if there is a separate
   “Fan room” entry (subscribers-only sub-channel `channel:<slug>:fans`).
3. Expect:
   - `POST /api/chat/<slug>/fan-token` (or `/token` for the main room) → **200**
     with `{ token, handle, channel }`.
   - WebSocket to `wss://chat.tahti.live/connection/websocket`.
   - Client sends `connect` with the token, then `subscribe` to the returned
     `channel`.
4. Type a message → **Send**.
5. Expect WS frames:
   - Outbound `publish` with `{ channel, data: { handle, text } }`.
   - Either a `push`/`pub` echo or a successful reply to the publish `id`
     (no `error` on that id).
6. Open the same chat in a second browser (or private window) as a **fan**
   (subscribed if the room is fan-only) and confirm the message appears.

### C. What “fail” looks like (report these back)

| Symptom | Likely cause |
| --- | --- |
| `fan-token` 401 / 403 | Not signed in, or not allowed into fan room |
| `fan-token` 404 | Route/slug missing; channel not provisioned |
| WS never opens | `VITE_CENTRIFUGO_WS` / CSP / chat host down |
| Connect OK, Send shows “Not connected” | Publish never left; check `FanChatRoom` connected state |
| Publish returns Centrifugo error | Token lacks publish, or proxy rejects brand-new channel namespace |
| Message only visible to sender | Local echo / mock path still active |

### D. Paste back to the agent

- Channel slug
- On air? (yes/no)
- Status codes for `fan-token` (and `token` if used)
- Whether WS connected
- Exact error string from UI or WS `error` payload after Send

With that, we can fix code or file a tahti-org Centrifugo/proxy bug.

## API touchpoints

- `POST /api/chat/:slug/fan-token` → Centrifugo connection JWT + `channel:<slug>:fans`
- `GET /api/chat/:slug/fan-history`
- Client: `packages/tahti-web/src/api/fan-chat.ts`, `FanChatRoom.tsx`
- WS: `wss://chat.tahti.live/connection/websocket` (`centrifugoWsUrl.ts`)
