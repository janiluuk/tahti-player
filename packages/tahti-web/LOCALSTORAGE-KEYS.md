# localStorage keys

Audit for the (now finished) cutover plan's §1.4 ("Document localStorage keys: theme, chat handle,
favorites/history scopes"). Everything the app writes to `localStorage`,
grouped by owner. All keys are plain strings under the origin's storage —
no IndexedDB, no service worker, nothing Next.js-specific to account for
at cutover (confirms the other two §1.4 boxes).

## Zustand `persist` stores (JSON blobs, one key each)

| Key | Store | Contents |
|---|---|---|
| `tahti-web-auth` | `authStore.ts` | Session/user state |
| `tahti-web-layout` | `layoutStore.ts` | UI layout prefs (panel sizes, collapse state) |
| `tahti-web-theme` | `themeStore.ts` | `themeId`, `customThemes`, `colorMode` |
| `tahti-web-map-notes` | `mapNotesStore.ts` | `/more` review-comment drafts (dev/beta-review only) |
| `tahti-web-listener-widgets` | `listenerWidgetsStore.ts` | SoundCloud/YouTube embeds, enabled radio stations |
| `tahti-web:discover` | `discoverStore.ts` | Discover-page prefs |

## `libraryStore.ts` — scoped, not a single key

Favorites and history are **not** one fixed key — `libraryStore`'s custom
zustand storage adapter writes to `tahti-web:library:{scope}`, where
`{scope}` is `anon` while signed out or the current user's id once signed
in. This is what actually answers CUTOVER's "namespace favorites/history"
question: switching accounts (or from anon → signed in) already switches
storage key, so state doesn't leak across users on a shared browser. A
one-time migration reads the legacy unscoped `tahti-web:library` key and
copies it into `tahti-web:library:anon` if present, then leaves the old
key alone (dead, harmless).

## Raw (non-zustand) keys

| Key | File | Purpose |
|---|---|---|
| `tahti-nuclear-theme-id`, `tahti-nuclear-dark` | `themeStore.ts` | Legacy/bootstrap pair, read synchronously before the zustand store hydrates, to set the theme attribute before first paint (avoids a flash of the wrong theme) |
| `tahti-web-chat-handle` | `ChannelChatPanel.tsx` | Anonymous chat display name, remembered across channels |
| `tahti-web-hearthis-imports:{userId}` | `PluginStorePanel.tsx` | Per-user list of hearthis.at tracks already queued for import |
| `tahti-web-auto-record-broadcast` | `broadcast.ts` | Mock-mode auto-record toggle (dev/beta only — real prod value lives server-side) |
| `tahti-web-mock-news` | `admin.ts` | Mock-mode news post store (dev/beta only) |
| `tahti-studio-show-series-v1`, `tahti-studio-episodes-v1` | `shows.ts` | Mock-mode show/episode data (dev/beta only) |
| `tahti.pendingArtistKind` | `pendingArtistKind.ts` | One-shot flag carried across the signup → provision-channel redirect |
| `tahti.channelPageLayout.{slug}`, `tahti.channelPageLayoutPreset.{slug}` | `channelPageLayout.ts` | Per-channel, per-viewer page-block layout and active preset id |
| `tahti-web-onboarded:{userId}` | `OnboardingView.tsx` | Per-user "seen the onboarding tour" flag |

## Cutover notes (historical; cutover done 2026-10-21)

- Every key is prefixed `tahti-web`, `tahti-nuclear`, `tahti-studio`, or
  `tahti.` — no collision risk sharing an origin with anything Next-side
  writes today (Next doesn't write to `localStorage` for any of this;
  it's server-session-backed).
- Several rows above are explicitly **dev/beta mock-mode only**
  (`tahti-web-auto-record-broadcast`, `tahti-web-mock-news`, the two
  `tahti-studio-*` show keys) — they exist only because `VITE_FORCE_MOCK`
  builds don't have a real backend to persist to, and are inert in a real
  production build talking to the live API.
- `tahti-web:library:{scope}` is the one that actually matters for user
  data continuity across the cutover — same-origin `localStorage` survives
  a client swap by itself, so no explicit migration step is needed as
  long as the production domain doesn't change.
