# AI DJ (POC): port radio-dj's talking-DJ features into Tahti's 24/7 rotation

**Status:** open

## What

Port the AI-DJ behavior from `../radio-dj` (a single Go binary, MIT) — an
LLM "Director" that decides what to say between songs (track intros,
station ID, time/weather, curiosity facts, live request shoutouts), a TTS
step that voices it, and playback that ducks the music under the DJ's
voice — into Tahti's existing 24/7 fallback rotation, which today is music
(+ human-recorded announcement clips) only.

## This is a POC, not a committed feature (2026-09-16)

The user is explicitly still deciding whether to build this at all — treat
everything below as a **spike to gather evidence for a go/no-go call**, not
a backlog to execute end to end. That changes the plan in three ways:

1. **Minimize blast radius before minimizing effort.** Prove the idea cheaply
   and reversibly before touching production schema/splice paths — see
   "POC rollout" below. Don't build Phase 3+ (freshness, curiosity facts,
   requests, editable templates, per-artist opt-in) at all until there's a
   decision to proceed; they're listed for completeness, not as committed
   work.
2. **A kill switch is a requirement, not a nice-to-have.** Whatever gets
   built for the POC must be off by default and instantly disable-able
   without a deploy — mirror the existing
   `AnnouncementSettings.systemEnabled` singleton-toggle pattern
   (`schema.prisma:2035`), scoped to this feature specifically (e.g.
   `AiDjSettings.enabled`, default `false`).
3. **The decision gate is content quality, not shipped code.** The point of
   the POC is to listen to what the Director+TTS actually produce and
   decide if it's good enough to be worth the rest of the build — not to
   prove the pipeline can technically run.

## Decisions (from the user, 2026-09-16)

- **LLM: self-hosted/local, not BYOK.** Tahti has its own local LLM
  capacity (free, fast) — v1 uses that directly, no per-provider credential
  flow, no usage cost to reason about. Phase 0 below is rewritten around
  this (was originally scoped as BYOK before this was known).
- **Scope: platform stations only for v1.** Targets `tahti-radio`
  (`TAHTI_RADIO_SLUG`, `packages/shared/src/tahti-radio.ts`) and/or
  `tahti-selects` (`TAHTI_SELECTS_SLUG`, `packages/shared/src/tahti-selects.ts`)
  — Tahti's own curated stations, not artist channels. Per-artist opt-in is
  explicitly a **later** phase (Phase 8), not part of this build.
- **Additive, not a replacement.** AI-DJ segments sit alongside
  human-recorded `AnnouncementClip`s, never instead of them — an artist's
  (or the platform's) own recorded announcements keep playing exactly as
  today. AI-generated clips must be **distinguishable** from human ones
  (own field/model, not silently mixed in as if a person recorded them) —
  editorial integrity matters for a nonprofit broadcaster, and it also
  keeps this easy to disable/audit independently of the existing feature.

## Source project shape (`../radio-dj`, for reference — do not copy code,
GPL/MIT compatibility aside, the runtime shape doesn't transfer — see
"Central architectural decision" below)

- `internal/dj/dj.go` — `DJ.DirectPlan(ctx)` is the core call: one
  `response_format=json_object` LLM request taking
  `{talk, time_of_day, history[], candidates[], requests[]}`, returning
  `{setlist: []int, breaks: [{before, kind, at}]}` (`kind` =
  intro/trivia/wiki/history/station/time/none). Falls back to random
  selection on any parse failure — station never stops. Also has one-shot
  helpers per segment kind (`Banter`, `SayMidroll`, `SayRequest`, `SayWiki`,
  `SayWeather`) built from `i18n.Prompts.Sub` templates.
- `internal/skills/skills.go` — segment prompt bodies are `.md` files under
  `~/.radio-dj/skills/`, seeded from embedded per-language defaults, with
  `{placeholder}` substitution. `Pool.Segue` round-robins through them.
  Weather comes from Open-Meteo (free, no key) by lat/lon.
- `internal/tts` + `internal/voice` — a provider catalogue (edge-tts/
  piper/say) maps to a shell command template; `RDJ_VOICE_CMD` lets you
  supply any raw command. Fully local/BYOK.
- `internal/icecast/source.go` — **the piece that doesn't port**: one
  persistent master `ffmpeg` process with two live PCM pipes (fd3 music,
  fd4 voice), `sidechaincompress` ducking music under an `amix` of voice —
  a live filtergraph, not a pre-mixed file. This is how it talks *over* a
  song mid-track and why its "time" announcement can say the literal
  current time (generated at air-time, not pre-batched).
- HTTP API (`docs/API.md`): `/now-playing`, `/request`, `/control`
  (skip/previous, shared broadcast), `/stream.aac`, `/listen.pls`/`.m3u`,
  `/health`, `/dj-log` (JSONL tail), `/events` (SSE).

## Feature inventory: radio-dj vs. Tahti today

| Feature | Tahti today | Where | Gap |
|---|---|---|---|
| 24/7 fallback rotation | **Yes** | `tahti-org/apps/api/src/lib/fallback-rotation.ts`, `programme.ts`; Liquidsoap `'rotation'` template (`orchestrator.ts`) | Tahti's rotation is a **pull-based M3U** Liquidsoap re-fetches on its own schedule (`reload_mode="rounds"`), not a process Tahti owns — no live audio pipe to inject into |
| Pre-recorded talk breaks, scheduled | **Yes** | `AnnouncementClip` model (`schema.prisma:2004`), `interleaveAnnouncements()` (`packages/shared/src/fallback-playlist.ts:204`), spliced live in `routes/internal/channel-fallback.ts` at every M3U fetch | Clips are static, artist-uploaded audio — no dynamic text, no "right now" freshness |
| Rendering pipeline for a clip (upload → worker job → `audioKey` flips READY) | **Yes** | `enqueueRenderAnnouncementTrim`, `apps/worker/src/jobs/render-announcement-trim.ts` (uses `fluent-ffmpeg`, already a worker dependency) | Only does trim/fade today — this is the pattern a new "render AI-DJ segment" job should copy, not a gap so much as a template |
| BYOK external-provider credentials, encrypted at rest (relevant for Phase 8, not v1) | **Yes** | `IntegrationCredential` (`schema.prisma:1168`, AES-GCM `fieldsEnc`) + `INTEGRATION_PROVIDERS` registry (`packages/shared/src/integration-providers.ts`) | Scoped to `IMPORT/EXPORT/FINGERPRINT/SCROBBLE` today — would need a new scope when per-artist opt-in happens; not needed for v1's platform-only, local-LLM scope |
| LLM client (any provider) | **No** | — | Net-new |
| TTS / voice synthesis | **No** | — | Net-new |
| Live audio ducking / mid-song interjection | **No**, and can't be added in this repo | Liquidsoap runs in a separate **orchestrator service**, not checked out here (`config.orchestratorUrl`) | See "Central architectural decision" |
| Skip/previous transport | **Yes**, more capable | `orchestrator.ts` (`skipChannelTrack`/`playPreviousChannelTrack`, telnet-backed, per-channel) | radio-dj only has one global station |
| Weather / time-of-day / curiosity facts | **No** | — | Net-new; Open-Meteo needs no key |
| Listener song requests | **No** | (confirmed absent — no `SongRequest`/`TrackRequest` model or route) | Net-new; needed before "request shoutouts" has anything to shout out |
| Editable segment prompts (no recompile) | **No equivalent** | — | Net-new; natural fit is a Studio settings screen, not text files on disk |

## Central architectural decision (resolve before writing code)

radio-dj **owns** a single local ffmpeg+Icecast process and generates+mixes
DJ speech **live, in-process, at air-time**. Tahti's live audio path is a
separate **orchestrator service** (its repo isn't checked out alongside
this one) that has Liquidsoap poll a **statically computed M3U** from the
API. There is currently no persistent audio process on Tahti's side to
inject live PCM into, so radio-dj's ducking design cannot be ported as-is.

Two paths, and this plan assumes **Option A** unless told otherwise:

- **Option A — pre-rendered clips (recommended for v1, buildable entirely
  in `tahti-org` today):** generate DJ text via LLM, render it to an audio
  file via TTS, upload it, and create/update an `AnnouncementClip`-shaped
  row so the existing `interleaveAnnouncements()` splice picks it up on the
  next M3U fetch — zero orchestrator changes. Trade-off: no true
  ducking-over-a-song (clips play back-to-back like today's announcements,
  not overlaid); and time/weather content is only as fresh as its last
  render (see Phase 3).
- **Option B — true live ducking (stretch, needs the orchestrator repo):**
  port `internal/icecast/source.go`'s sidechaincompress design into the
  orchestrator service itself, with the API pushing pre-rendered voice
  files (or a live TTS stream) into it. Out of scope until that repo is
  accessible — see Phase 7 below.

## POC rollout: two stages, each a real stopping point

### Stage 1 — offline generation & review (no production wiring at all)

- A standalone script or one-off worker job — **not** wired into
  `AnnouncementClip`, the M3U splice, or anything public-facing. It pulls a
  sample of `tahti-radio`'s (or `tahti-selects`'s) actual upcoming rotation,
  runs the Director call (Phase 1 below) against the LocalAI cluster, TTS-
  renders a handful of segments (Phase 2 below), and drops the audio files
  + generated text somewhere for a human to listen to.
- No schema changes, no kill switch needed yet — there's nothing live to
  switch off. This stage is purely "is the text good, is the voice good, is
  it fast enough, does it fail gracefully."
- **Stop here and report back** before writing any production integration
  code — this is the actual go/no-go moment, not a formality.

### Stage 2 — gated live test (only after Stage 1 looks good)

- Minimal production wiring: the `source: 'HUMAN' | 'AI_DJ'` distinguishing
  field (Phase 2), the render worker job for real, the splice into
  `interleaveAnnouncements()` — all behind the `AiDjSettings.enabled` kill
  switch, **default off**.
- Roll out at the smallest reasonable frequency/scope (e.g. one station,
  a rare `RANDOM` schedule rather than the eventual real cadence) so a bad
  batch is a minor blip, not a pattern listeners notice.
- This is still part of the POC, not "done" — the point is to see how it
  holds up with real listeners for a while before deciding whether Phase
  3 onward (below) is worth building.

## Phases

Phases 0–2 are the technical building blocks Stage 1/2 above actually use
(Stage 1 exercises them with no production wiring; Stage 2 adds the
minimal wiring). **Phase 3 onward are not POC scope at all** — they're
recorded here so the reasoning doesn't have to be redone later, but they
only become real work if the POC succeeds and a decision is made to
proceed.

### Phase 0 — LocalAI cluster config (LLM + TTS, same service)

- Infra is already available: **192.168.2.101–192.168.2.105**, 5 GPU hosts
  running [LocalAI](https://localai.io) — this is one integration, not two.
  LocalAI's OpenAI-compatible surface covers both halves of this feature:
  `/v1/chat/completions` for the Director (Phase 1) and `/v1/audio/speech`
  (OpenAI TTS-compatible) for rendering (Phase 2) — whatever TTS backend
  LocalAI itself is configured with (Piper/Coqui/Bark/etc.) is an
  implementation detail behind that one endpoint, so there's no separate
  TTS-engine decision to make.
- No BYOK/credential flow needed for v1 — same reasoning as before, just
  now it's a specific cluster rather than an abstract "local LLM."
- 5 hosts strongly suggests load-balancing/failover, not a single
  `AI_DJ_LLM_URL`. `tahti-org` already has a precedent for exactly this
  shape — `parseIngestHostList()` in `apps/api/src/lib/ingest-endpoints.ts`
  takes a comma-separated env var and returns `[primary, ...fallbacks]`.
  Mirror that: `AI_DJ_LOCALAI_HOSTS=192.168.2.101,192.168.2.102,...` (or
  ask whoever runs the cluster if there's already a load balancer/VIP in
  front of the 5 — if so, config is just that one address and this bullet
  is moot).
- Still confirm before Phase 1: does the model(s) loaded on this LocalAI
  cluster actually support `response_format: json_object` /
  grammar-constrained output (LocalAI supports this in recent versions,
  but it's model-dependent)? `DirectPlan`'s design leans on reliable JSON
  back — if the loaded model can't do real JSON mode, plan on a stricter
  prompt + `extractJSON`-style fallback parsing (as radio-dj itself does
  as a safety net anyway) rather than assuming schema-perfect output.
- Skip the BYOK/`IntegrationCredential` route entirely for v1 — that
  registry is still the right place to add per-artist LLM/TTS credentials
  in Phase 8 (per-artist opt-in), just not now.

### Phase 1 — the Director

- New `tahti-org` module (e.g. `apps/api/src/lib/ai-dj-director.ts` or a
  worker-side equivalent) that, given `tahti-radio`/`tahti-selects`'s
  upcoming rotation window (`CuratedRotationItem`/fallback sound rows
  already fetched for the M3U), a configured chattiness level, recent
  `AnnouncementClip` history, and any pending song requests, calls the
  local LLM (Phase 0's endpoint) to decide: which upcoming track
  boundaries get a break, and what kind (`intro`/`station`/`trivia`/
  `request` — skip `time`/`weather` here, see Phase 3). Mirror
  `DirectPlan`'s JSON-mode request/response shape and its "fall back to
  no break" safety net on any parse failure — a bad/slow local-LLM
  response must never block or skip the rotation.
- One LLM call per segment's *text* (or fold into the director call) —
  port radio-dj's per-kind prompt templates (`Banter`/`SayMidroll`/
  `SayRequest`/`SayWiki`) as editable templates (Phase 6), seeded from
  sensible defaults; since v1 is platform-only, "editable" can start as a
  config/seed file maintained by whoever runs `tahti-radio`, not
  necessarily a full Studio UI yet.

### Phase 2 — TTS rendering job

- New worker job (model directly on
  `apps/worker/src/jobs/render-announcement-trim.ts`'s shape): takes
  `{channelId, text}`, calls the LocalAI cluster's `/v1/audio/speech`
  (Phase 0), encodes/normalizes via `fluent-ffmpeg` (already a
  dependency), uploads via the existing `minio.ts` helpers, and creates a
  clip row.
- **Keep AI-generated clips distinguishable from human ones** — either a
  new boolean/enum on `AnnouncementClip` (e.g. `source: 'HUMAN' | 'AI_DJ'`,
  default `'HUMAN'` for every existing row) or a separate lightweight model
  if mixing gets awkward once Phase 1's shape is concrete. This is a
  product requirement from the "additive, not a replacement" decision
  above, not just a nice-to-have: it's what lets `tahti-radio`'s AI clips
  be toggled off, audited, or capped independently of real recordings, and
  keeps listeners from being misled about what's a human vs. a model
  talking.

### Phase 3 — freshness (the part radio-dj gets for free and we don't)

Pre-rendered clips can't say "it's 3:47pm" truthfully by the time they
actually play — Liquidsoap's `reload_mode="rounds"` means the M3U (and
whatever's spliced into it) can sit unfetched for a while. Two mitigations,
not mutually exclusive:

- Keep time/weather **out of v1** entirely; ship station ID, track intro,
  curiosity facts, and request shoutouts first — none of those go stale.
- If time/weather is wanted later: a scheduled worker job (cron, same
  pattern as `processWeeklyBroadcastReset`/`processMissedLiveShowScanJob`)
  that re-renders time/weather clips on a short cadence (e.g. every
  15–30 min) and phrases them coarsely ("this afternoon", not "3:47pm") to
  tolerate the staleness that's unavoidable in a pull-based pipeline.

### Phase 4 — content parity

- Station ID + track intro: straightforward once Phase 1/2 exist — these
  are the least time-sensitive, ship first.
- Curiosity facts: Wikipedia API (free, matches radio-dj's `SayWiki`
  fallback) as the default; LLM web-search as an upgrade if the chosen
  provider supports it (mirrors radio-dj's GLM `web_search` option).

### Phase 5 — listener song requests (net-new, needed for Phase 4's shoutouts)

- New model + route: a listener submits `{from, text}` against
  `tahti-radio`/`tahti-selects` (public, rate-limited — check
  `apps/api/src/routes/reactions/track.ts`'s existing in-memory rate-limit
  bucket pattern as precedent). Resolve against the station's library the
  way `Library.Search` does in radio-dj, surface pending requests to the
  Director (Phase 1).

### Phase 6 — editable segment templates

- Once Phase 1's prompt templates exist as data (not code), give whoever
  runs the platform stations a way to edit them without a deploy — this is
  the direct analog of radio-dj's `~/.radio-dj/skills/*.md`.

### Phase 7 (stretch, blocked on orchestrator repo access)

- Option B from above: true live ducking. Do not scope this further until
  the orchestrator repo is available to inspect/modify.

### Phase 8 — per-artist opt-in (later, not v1)

- Extends this from `tahti-radio`/`tahti-selects` only to any artist's own
  fallback rotation, opt-in. This is where BYOK actually matters — an
  artist's channel can't assume the platform's local LLM/TTS capacity is
  free for everyone at scale, so this phase is what should add the new
  `IntegrationScope` + `IntegrationProvider` entries (LLM + TTS,
  OpenAI-compatible) that Phase 0 deliberately skipped, plus a Studio
  settings screen (credentials + segment-template editing, folding Phase 6
  into a real per-artist UI at this point).

## Explicitly out of scope for v1

- Live show / RTMP broadcasts (this is 24/7 **fallback rotation** only —
  live shows already have their own scheduling, see `LiveShowEpisode` and
  related worker jobs, and are a human DJ, not this feature).
- Any change to the orchestrator service (unavailable in this workspace).
- radio-dj's PWA/cassette UI, its `/control` skip-previous (Tahti's
  orchestrator already does this per-channel, no port needed), and its
  standalone-binary install/service story (irrelevant — Tahti is a hosted
  multi-tenant platform, not a self-hosted single station).

## Open questions for the user

1. Confirm Option A (pre-rendered, spliced into the existing announcement
   pipeline) is the right starting point, given Option B needs a repo we
   don't have access to from here.
2. Is there already a load balancer/VIP in front of the 5 LocalAI hosts
   (192.168.2.101–105), or does `tahti-org` need to do its own
   round-robin/failover across them (Phase 0)?
3. Which model(s) are loaded on that LocalAI cluster, and do they support
   JSON-mode/grammar-constrained output well enough for `DirectPlan`'s
   design — or should Phase 1 assume a stricter-prompt-plus-fallback-parse
   approach from the start?

## File pointers

**tahti-org** (this is where all Phase 0–5 code lands):
- `apps/api/src/lib/fallback-rotation.ts`, `programme.ts`
- `apps/api/src/routes/internal/channel-fallback.ts` (the M3U endpoint + splice point)
- `packages/shared/src/fallback-playlist.ts` (`interleaveAnnouncements`)
- `packages/db/prisma/schema.prisma` (`AnnouncementClip`, `CuratedRotationItem`, `IntegrationCredential`)
- `packages/shared/src/integration-providers.ts` (BYOK provider registry)
- `apps/worker/src/jobs/render-announcement-trim.ts` (template for the new TTS-render job)
- `apps/api/src/lib/orchestrator.ts` (confirms the live-audio boundary)

**radio-dj** (reference only, do not copy code — Go, different runtime):
- `internal/dj/dj.go`, `internal/skills/skills.go`, `internal/icecast/source.go`
- `docs/API.md`, `docs/openapi.yaml`
