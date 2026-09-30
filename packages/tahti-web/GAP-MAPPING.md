# Tahti production → beta gap mapping

Audit date: 2026-08-27

This maps the public Tahti product described at [tahti.live](https://tahti.live/) to the beta SPA in this package (`beta.tahti.live`). “Partial” means the main path exists but important depth or parity is missing. Admin production details are based on the existing port inventory because those routes require board access and cannot be inspected anonymously.

## Summary

| Area | Beta coverage | Main gaps |
| --- | --- | --- |
| Listener | Broad coverage | Marketing/apply entry points, venue depth, server-side parity for favorites/history, and some legal/about depth |
| Artist | Broad coverage | Pro editor depth, channel design parity, settings/source OAuth depth, and moderator workflow discoverability/verification |
| Admin | Partial | Beta has the core board pages, but not the full production admin surface or several detailed/bulk workflows |

## Listener

| Production capability | Beta route/surface | Status | Gap or parity note |
| --- | --- | --- | --- |
| Listen directory / on-air discovery | `/` (production `/listen`) | Present | Route intentionally differs; directory uses the live channel API. |
| Artist live channel and archive | `/channel/$slug` (production `/c/:slug`) | Present | HLS, archive playback, now-playing state, chat, and visualizer are present. |
| Anonymous listening | Public listener routes | Present | Matches the product principle that listening does not require an account. |
| Channel chat | Channel rail and `/chat/$slug` | Present | REST/WS chat, anonymous hCaptcha join, reactions, and subscriber-only gating are wired. The header shows today's listener count unless the artist turned it off (#275). Channel pages also take comments (#285), and an old address after a rename redirects (#290). While live, the header also shows how many people are listening (#304). |
| Tahti Radio | `/radio` | Present | Radio playback and current-track presentation are implemented. |
| Artist profiles | `/u/$username` | Present | Includes pinned tracks, catalog, gallery, and profile actions, plus the artist's SoundCloud tracks (#282; managed from Library → Embeds, #276) and top-list rank badges on popular tracks (#286), plus a Store section for one-time purchase tiers when the artist turns it on (#297, toggle #296). |
| Collections and smart links | `/u/$username/c/$slug`, `/r/$slug` | Present | Both public surfaces are implemented. Signed-in listeners can add public tracks to a collaborative playlist from its page (#303). Collection pages show the text layer set in the editor (#345) and link their RSS feed; artist pages link theirs (#348). |
| Favorites and history | `/library/*` | Partial | Beta uses local persistence/follows; it is not a full production account-backed equivalent. |
| Playlists | Player bar, Music/library tables | Present | Create and add-to-playlist flows are live-API backed. |
| Fan subscriptions | `/subscribe/$username` | Present | Stripe checkout is wired; offline activation is mock-only. |
| Venues | `/venues` | Partial | Listing exists; registration at `/venues/register`. Venue pages load the venue's own profile with address, upcoming shows and an iCalendar feed (#257). |
| Governance and direct messages | `/governance`, `/messages` | Present | Voting/comments and inbox paths are live-API backed. |
| Widgets | Settings → Widgets, listener/channel surfaces | Present | Sandboxed widgets exist; the admin widget catalog remains outside this beta SPA. |
| Help, legal, about, status | `/help`, legal routes, `/status` | Partial | Core pages exist, but legal/about coverage and content depth are not fully equivalent. |
| Marketing home and artist application | Production `/`, `/apply` | Missing | Beta opens in the listener hub and has no equivalent marketing/apply journey. |

## Artist

| Production capability | Beta route/surface | Status | Gap or parity note |
| --- | --- | --- | --- |
| Artist dashboard | `/studio` | Present | Studio shell and section navigation are implemented. |
| Channel setup | `/studio/channel?tab=setup` | Present | Channel provisioning uses the live API. |
| Go Live / browser broadcast | `/studio/go-live` | Present | Broadcast wizard is present; simulator behavior is restricted to mock mode. The green room for the running broadcast is managed there too: open it, invite and remove guests (#315, #316). |
| Multistream RTMP | Go Live → multistream | Present | RTMP target management is included in the live flow; live status per destination is on Channel → Radio → Stream (#289). Stream key and Icecast password can be replaced from Go Live (#271); Tahti Radio's own destinations are in `/admin/radio` (#263). |
| Archive, upload, releases, collections | `/studio/archive`, `/studio/upload`, `/studio/releases`, `/studio/collections` | Present | Upload prepare/complete and album-based collection design are implemented. Releases have per-track credits (#295); playlists can take any public track from a catalog search (#302). Release tracks have a Versions tab to switch and upload audio versions (#318, #319). |
| Pro editor | `/studio/editor` | Partial | Core editor exists, but production-grade multitrack timeline depth is still missing. |
| Schedule / 24/7 rotation / radio shows | `/studio/schedule` (Broadcast), `/studio/channel`, `/studio/shows` | Present | Nav and page title are Broadcast. Programme, rotation, bookings, series, and episodes are on that page and Channel → Radio. Released tracks can be added to the rotation directly (#301). |
| Stats and detail reporting | `/studio/stats`, `/studio/stats/detail` | Present | Summary and range-detail views exist; Overview has the follow/repost download-gate funnel (#273), per-track gates are in the track edit dialog (#274), and a release's smart-link clicks are on its Smart links tab (#278). |
| Channel design / profile / branding | `/studio/channel`, `/channel/$slug?edit=1` | Partial | Presets, layers, layout, gallery, and press-kit workflows exist; parity with the production designer is not complete. Branding has a transparent logo with avatar/cover/both placement (#346); the public artist page doesn't draw it yet. |
| Updates/newsletter | `/studio/updates` | Present | Newsletter/update flow is live-API backed; the Newsletter tab shows subscriber counts (#265). |
| Revenue and Stripe Connect | `/studio/audience` | Present | Merged fan-sub + Revelator payout history, Connect onboarding, empty tier state, order-flow breakdown, and help tour match production `/dashboard/revenue`. |
| Distribution | `/studio/distribution` | Present | Catalog, Revelator submission/payment, Spotify profile, and royalty surfaces exist. |
| Stash | `/studio/stash` | Present | Upload/delete and share access are implemented. |
| Channel moderators | `/studio/moderation` | Present | API-backed assignment/removal; exposed from Studio navigation |
| Settings | `/settings` | Partial | Nuclear settings shell exists, but parity/depth across artist, discovery, notification, and account sections is thinner. Added since: own internet radio stations in Playback (#277), broadcast record/publish defaults in Broadcast (#279), channel and new-upload comment switches in Account (#280). Members and credits are editable and show the API's roster (#321). Social links and the press kit bio now use the routes the API serves (#325, #326); members get pictures and ordering (#327-#329). |
| Source connections / OAuth | `/sources` | Partial | Source hub exists; several providers still have simplified OAuth UX and need production callback verification. |
| Email invites for people without accounts | — | Missing/deferred | Current moderator flow assigns an existing username; there is no invite-token flow for a new user. |

## Admin

| Production capability | Beta route/surface | Status | Gap or parity note |
| --- | --- | --- | --- |
| Board-gated admin shell | `/admin/*` | Present | Access is gated by `user.isBoard`. |
| Dashboard and operational overview | `/admin` | Present | Core overview and shortcuts exist. |
| Activity and container logs | `/admin/logs` | Present | Combined Logs page has separate Activity and Container logs tabs; `/admin/activity` remains a compatibility route. |
| Moderation queues | `/admin/moderation/$tab` | Present | Support, beta, radio submissions, Selects, content reports, and feature requests are consolidated into tabs. |
| Users | `/admin/users` | Partial | User administration exists, but production has more detailed user/support workflows. |
| Radio and station suggestions | `/admin/radio`, `/admin/radio-station-suggestions` | Present | Separate destinations; active-route matching is boundary-safe so they cannot highlight together. Suggestions now have their API: submit (tahti-org#581), approve into a disabled preset or reject with a note (tahti-org#582); refusal reasons shown (#344). |
| News, announcements, streams, status | Corresponding `/admin/*` routes | Present | Core operational pages are ported. |
| Top lists, storage, financial, governance | Corresponding `/admin/*` routes | Partial | Core pages exist, but some production actions are intentionally trimmed. |
| Grants | `/admin/grants` | Partial | Listing/review exists; grant run/preview depth is missing. |
| Storage/files operations | `/admin/storage` | Partial | Files browser filters by uploader/genre/type (#244) and bulk-edits genre, type, visibility and license (#245). No bulk delete (the API has none). |
| Financial operations | `/admin/financial` | Partial | Fan-sub payout queue with retry (#237); ledger entries can be added again (#241), by year with CSV export (#242); legacy-member migration queue, read-only because the API has no action for it (#243). |
| User/support detail pages | `/admin/users` | Partial | User panel now has CSV export (#231), engagement by year with board adjustments (#232, #233), account restrictions (#234) and GDPR deletion (#235). Support ticket detail depth not re-checked. |
| Announcement clip/detail workflows | `/admin/announcements` | Present | Switch and upload fixed to the real routes (#239); trim editor for system clips (#240); uploads send the clip length (#248). |
| Widget catalog administration | Production admin/catalog | Missing from beta | Listener widgets work, but catalog management remains in the production/Next admin surface. |
| Full production admin surface | Production has roughly 35 admin pages; beta has 22 | Partial | Beta covers the main board workflows but is not a complete admin replacement. Added since: workers and cron run history on `/admin/status` (#250, #251), chat and mailbox stats on `/admin` (#252). The governance overview and content views now have their API routes (tahti-org#574, #575). |

## Recommended implementation order

1. Make `/studio/moderation` a first-class destination in the Studio Manage/Broadcast navigation and add owner-only assignment/removal tests.
2. Close artist depth gaps: pro editor timeline, channel designer parity, settings, and source OAuth callbacks.
3. Close listener entry/content gaps: marketing home/apply, venue depth, legal/about depth, and a deliberate decision on account-backed favorites/history.
4. Prioritize admin detail and bulk workflows: users/support, storage files, financial payout operations, grants run/preview, announcements, and widget catalog management.
5. Repeat a live beta-vs-production route and permission sweep after each batch; retain intentional consolidations such as Admin Logs and Moderation tabs.

## Cutover no-drop ledger

This is the decision gate for switching the official listener/artist client. A route that merely redirects to a nearby page is not automatically parity: the target must preserve the user’s task, data, permissions, and return path.

### Must be green before listener/artist cutover

| Production surface | Current beta/cutover handling | Gate |
| --- | --- | --- |
| `/listen` | Redirects to the beta listener hub `/` | Verify directory, live/archive playback, radio preview, widgets, and anonymous chat on the cutover host. |
| `/c/:slug` | Redirects to `/channel/$slug` | Verify wildcard channel hosts, HLS, archive fallback, chat access, reactions, downloads, and now-playing state. |
| `/u/:username/subscribe` | Redirects to `/subscribe/$username` | Verify checkout, signed-in return, cancellation, and subscription state refresh. |
| `/dashboard/*` | `prodPathRedirects` maps the principal routes to `/studio/*` | Test every email, Stripe, OAuth, and bookmark URL; do not rely on the generic `/studio` fallback for a task-specific link. |
| Upload imports | Production has dedicated SoundCloud, Bandcamp, Google Drive, URL, Mixcloud rescue, and from-broadcast routes; beta consolidates these into Sources, Upload, or Recordings | P0: each old URL must land on the equivalent importer or explain the next action, with no silent loss of selected source/upload state. |
| Channel editing | Production splits channel, gallery, text, playlist, and visual editing routes; beta consolidates them into Channel design tabs and inline editing | P0: verify every editor operation, saved layout, image/gallery action, playlist setting, and public preview. |
| Settings | Production has many dashboard settings routes; beta consolidates them into Account, Artist, Channel, Broadcast, Add-ons, Connections, and Themes | P0: create a field-by-field settings matrix; ensure no setting is only redirected to a page that cannot edit it. |
| Auth/payment returns | Beta has SPA routes, but the API still owns cookies, OAuth callbacks, and Stripe return URLs | P0: test same-origin cookies, OAuth callback query cleanup, checkout success/cancel, Connect onboarding/portal, email verification, and password links on the final host. |
| Embeds | Beta has `/embed/*` routes | P0: test all production embed shapes (`c`, `r`, `col`, and user collection), iframe CSP, playback, and third-party embedding. |

### Artist routes requiring explicit parity decisions

The production app has dedicated surfaces that the beta currently folds together or does not expose as a separate screen:

- `/dashboard/newsletter/compose` is represented by the Updates/newsletter surface; verify draft/send behavior and subscriber targeting rather than accepting a generic Updates redirect.
- `/dashboard/collections/new` is folded into the Collections hub; verify that creating an album, EP, DJ set, and playlist still reaches the correct editor.
- `/dashboard/upload/[uploadId]` and the upload import routes need an upload-progress and failure/retry equivalent, not just a redirect to the upload landing page.
- `/dashboard/channel/gallery`, `/dashboard/channel/text`, and `/dashboard/channel/playlist` are folded into Channel design; verify that old deep links preserve the relevant tab.
- Production dashboard settings for media, discovery, internet radio, green room, moderators, multistream, distribution, and members are split between Studio, Settings, and Add-ons in beta. Each must have one canonical beta destination and an automated route test.
- `/dashboard/governance/*` and `/dashboard/messages/*` are represented by the global `/governance` and `/messages` surfaces. Verify artist permissions and thread deep links for both roles, not just listener access.

### Admin cutover boundary

The current cutover decision keeps production Next `/admin/*` canonical and switches only the public listener/artist client. That decision prevents accidental loss of admin capabilities. If Admin is moved to the Nuclear client later, the following production routes need to be ported or explicitly retained on Next before changing the host:

- channel-specific archive and programme management (`/admin/channels/[slug]/archive`, `/admin/channels/[slug]/programme`); the 24/7 rotation editor (#247) and track title/credit/genre/visibility edits (#264) are in `/admin/streams`, the rest of archive management is not
- announcement editor/detail (`/admin/announcements/editor/[id]`)
- widget catalog administration (`/admin/disco-widgets`), themes (moderation tab at `/admin/moderation/themes`, #246; listeners submit from Settings → Themes, #258), internet radio, and missed shows
- financial fan-subscriptions, ledger, and legacy-member workflows (per-artist fan-sub revenue and Connect status on `/admin/financial`, #262)
- governance audit, reports, resolutions, and publishing (per-meeting conflict declarations and notice deliveries are in the AGM tab, #253)
- grant year/run/preview detail (`/admin/grants/[year]`)
- support ticket detail (`/admin/support/[id]`) and user detail/restrictions (`/admin/users/[id]`)

The beta Admin port should remain clearly labelled partial until those surfaces either exist in Nuclear or the deployment contract guarantees that `/admin/*` stays on Next. The existing Admin Logs and Moderation tab consolidations are intentional and must retain their deep-link compatibility aliases.

### Deployment safeguards

- Freeze this mapping with a baseline commit and record the matching `tahti-org` API revision.
- Run route smoke tests on the cutover candidate for anonymous listener, authenticated listener, artist/channel owner, moderator, and board roles.
- Assert that production-only redirects never fall through to a generic page when they carry a task, identifier, upload, OAuth, or payment return state.
- Verify live API mode has no mock fallback and that all build-time secrets are present, especially hCaptcha, app URL, Centrifugo, and Stripe/OAuth return configuration.
- Keep Next Admin and the beta client dual-running through soak; only retire beta/Next surfaces after route, permission, and payment-return checks pass on the final host.

## Evidence

- Production product principles and listener/artist capabilities: [How Tahti works](https://tahti.live/how-it-works) and [About Tahti](https://tahti.live/about).
- Beta route/status inventory: [`FEATURES.md`](FEATURES.md).
- Navigation and implementation detail: [`UI-REDESIGN-WORKLOG.md`](UI-REDESIGN-WORKLOG.md) and the route/view files under `src/`.
