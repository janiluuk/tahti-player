# Artist lifecycle journey — findings

Generated: 2026-10-16 · Mock `VITE_FORCE_MOCK=1` @ `http://127.0.0.1:5190`  
Artist: `lifecycleartist2150312136@tahti.live`  
Screenshots: this folder (50 PNGs) · Runner: `scripts/journeys/artist-lifecycle-journey.mjs`

## What ran

| Step | Result |
| --- | --- |
| Register (Join) | OK — signed in as new artist |
| Channel design + promo | Partial — landed on Green room; no promo field on that tab |
| Upload WAV tracks (full quality) | Partial — staging UI confusing; wait-for-nav timed out (see below) |
| Create Album + 2 EPs + DJ set | OK — all four collections created |
| Open album designer / add tracks | Fail — first “Design” link opened mock `midnight-archive`, not the new album |
| Fan subscribe | OK — “You're subscribed: Supporter €5/mo” |
| Fan chat | Fail for live chat — only channel **comments** (“Post comment”) found |
| Create recurring show | OK |
| Go live (Test connection → confirm) | OK at t=0 (“You're live”) |
| Hold live 20 minutes | Wall-clock wait OK; **on-air state lost after first reload** (~5m) |
| Fan returns to channel | OFFLINE / Off air |

## Coverage gap (existing e2e vs this path)

| Need | Before this run | Now |
| --- | --- | --- |
| Register + screenshots | `real-user-journeys.spec.ts` only (and it still expected a Username field) | Journey + shots; Username fill removed from that spec |
| Album / EP / DJ set create | Missing from `artist-journey.mjs` | Journey creates all four |
| Fan subscribe click | Listener journey only *visits* subscribe page | Clicked Subscribe; confirmation shot |
| Chat with fans | None | Attempted; comments ≠ live chat |
| Recurring show → 20m live | None | Show created + go live + interval shots |

## Product / UX issues (priority)

### P0 — Live session does not survive navigation/reload (mock)

At t=0 Go Live showed “You're live. The rotation has handed over…” and the queue held the live channel. After leaving for the public channel and returning (or reloading Go Live), Prep showed **OFFLINE**, encoder unchecked, Go Live disabled. Interval shots at 5/10/15/20m are the offline Prep state. Fan at end sees **OFFLINE** / Off air.

Likely mock signal (`Test connection`) is in-memory and cleared on reload — but the UX also leaves checklist contradictory (live toast vs “Show title ready” still unchecked).

### P1 — Upload has two competing UIs

`/library/upload` (and Studio upload) shows a page-level staged file **and** can open a separate **Upload track** modal (“Choose audio” / Upload disabled until file in modal). Automation clicked Upload while the modal still had no file → timeouts. Artists will hit the same dual-path confusion.

### P1 — “Design” on collections list is ambiguous

After creating Polar Nights / EPs / DJ set, the first Design link opened existing mock album **midnight-archive**, not the just-created release. No clear “open the one you just created” affordance; toast says “open designer to add tracks” but does not navigate.

### P1 — Fan “chat” vs comments

`/chat/$slug` and channel `?chat=1` did not expose a Send control. The fan only gets a **Comments** composer with **Post comment**. Live chat during a show is not discoverable from these entry points (or missing for a brand-new channel).

### P2 — Channel designer default tab

`/studio/channel` opened on **Green room**, not Design/Look. Promo / top-bar text is not on that tab, so “add promo material” is easy to miss.

### P2 — Nested Studio chrome while going live

Broadcast Prep sits under Studio → Broadcast → Broadcast → Prep (three tab rows). High cognitive load for the most critical artist action.

### P2 — Go-live checklist vs live state

While on air: checklist still showed “Show title ready” unchecked even though show name was filled and a live toast fired. Series episode stayed “One-off broadcast” despite creating a recurring show earlier.

### P3 — Stale e2e

`e2e/real-user-journeys.spec.ts` filled `getByLabel('Username')` but Join no longer has that field (slug from Artist name). **Fixed in this pass.**

### Notes (noise)

Console CORS errors for catalog radio streams and SoundHelix demo audio are expected in mock/local and are not product regressions from this journey.

## Screenshot index (highlights)

| File | What it shows |
| --- | --- |
| `01-join*.png` | Join modal (Artist / Band toggle; no Username) |
| `02-studio-home.png` | Studio after first login |
| `03-channel-*.png` | Channel designer (Green room default) |
| `04-uploaded-*.png` / `fail-upload-*.png` | Dual upload UI / modal |
| `05-create-*-dialog.png` / `05-created-*.png` | Album, EPs, DJ set create |
| `05-album-designer.png` | Wrong album (`midnight-archive`) |
| `06-fan-subscribe*.png` | Subscribe success |
| `07-chat-*.png` | Comments, not live chat |
| `08-show-*.png` | Recurring show create |
| `09-live-0m.png` | On air |
| `09-live-5m.png` … `20m.png` | Offline Prep after drop |
| `10-fan-watching-live.png` | Fan sees Off air |

## Suggested follow-ups

1. Persist mock live/signal across reloads (or stop claiming “You're live” if signal is ephemeral).
2. Unify upload to one path (page *or* modal); remove disabled Upload behind empty modal.
3. After “Created X — open designer…”, navigate to that collection’s editor.
4. Surface live channel chat for fans when the artist is on air (or rename comments so expectations match).
5. Default `/studio/channel` to Design; keep Green room as a secondary tab.
6. Wire “Series episode” on Go Live to the show just created.
