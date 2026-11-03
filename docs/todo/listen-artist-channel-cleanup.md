# Listen, artist profile and channel page cleanup

**Status:** partial

User request 2026-11-03. Shipped in 0.0.295 (see HISTORY); left:

- [ ] Embed downloads "from all sources". The profile API marks hearthis.at embeds `downloadsEnabled` with no `playUrl`, so there is nothing to download from Tahti. Needs a product call: link out to the provider's own download page where it offers one (hearthis.at, SoundCloud when the artist allows it), or an API-side fetch of the provider's official download URL. Ripping provider streams is out (provider terms, licensing).
- [ ] Stage-hosted embeds remount when you leave the channel page (the bottom bar takes over the widget), so playback restarts. Keeping one widget across routes needs a portal host for the embed iframe.
