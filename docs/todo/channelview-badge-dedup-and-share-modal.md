# ChannelView: OnAirBadge dedup, playlist-as-copy-link, share modal cleanup

**Status:** partial
part deliberately deferred.

## What shipped

- **Duplicate on-air badge.** `ChannelView.tsx` had two: one in the
  always-present page masthead toolbar (line ~1121, next to "← Listen",
  Edit design, Share), and a second passed as the `badge` prop into
  `ChannelBackdropCard` for the "hero" content block (only present when
  a hero block exists in the channel's layout). When a layout includes a
  hero block, both rendered simultaneously. Removed the hero block's own
  `badge` prop (it's optional on `ChannelBackdropCard`) — the masthead's
  badge is the one universal indicator that exists regardless of which
  blocks a channel's layout has, so it's the one kept.
- **Download-as-playlist → copy-link in the share modal.** The masthead
  had a `DownloadIcon` "Download playlist" button that called
  `downloadM3uPlaylist` (client-generated `.m3u` blob download, gated
  on `live`). Removed it and the now-dead `handleDownloadPlaylist`
  function / `downloadM3uPlaylist` import entirely. `ChannelShareButton.tsx`
  gained a "Playlist" row (label + `ListMusicIcon`) with a `CopyButton`
  that copies the raw stream URL to the clipboard, toasting
  "Playlist link copied." — there's no persistent server-hosted `.m3u`
  URL to link to (the old download built the file client-side from a
  freshly-fetched live stream URL), so "the playlist link" is
  interpreted as that same stream URL, just delivered via clipboard
  instead of a downloaded file. The URL is fetched lazily
  (`fetchChannel(channelSlug)`) when the share dialog opens, so the
  button is disabled until it resolves.
- **Social share icons.** Added a row of icon link-buttons (X/Twitter,
  Facebook, LinkedIn, email) under the Share section, each opening the
  platform's own share-intent URL in a new tab (`target="_blank"`) with
  the channel URL + share text prefilled — no existing shared
  "share-to-X" component was found anywhere in the app, so this is a
  small local `socialLinks` array using `lucide-react`'s bundled
  (legacy) brand icons rather than pulling in a new icon set for four
  icons.
- **Subtext removed.** Dropped `ChannelShareButton`'s
  `<Dialog.Description>` ("Share this channel or add its player to
  another site.") under the modal title — same inline-help-text
  convention applied elsewhere this session. Left the `<p>{text}</p>`
  line inside the Share section as-is (it's the actual shareable
  message content, duplicated below in a copyable `<code>` block by
  design, not an explanatory caption) since the request's "subtext"
  reads as the title-adjacent caption, not this.

## Resolved differently: "move the player above the tabs"

At the time this was written, "the tabs" were confirmed to be the
owner-only `Tabs.Root` ("Overview"/"Manage") strip, but extracting just
the hero block to render persistently above it looked like a risky
structural change to guess at blind. The user later gave an explicit,
different instruction for this exact tab strip — remove it entirely,
replace it with a Stream Manager icon that opens the control center in
a modal — which is a cleaner resolution than the player-extraction
approach considered here. See
`docs/todo/channelview-stream-manager-modal-replaces-tabs.md`.

## Verification

`tsc --noEmit`, `eslint`, and `pnpm --filter @tahti-player/tahti-web
build` all clean on all three touched files
(`ChannelView.tsx`, `ChannelShareButton.tsx`, plus the unrelated
`ChannelDesigner.tsx` fix from the same session). No existing test file
for either component; none added. Not manually verified in a running
browser — the social icon URLs, the lazy playlist-link fetch, and the
badge dedup are all worth a live check.
