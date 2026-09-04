# Hearthis embed playback (Studio Sounds / Library)

**Status:** executed.

Playing an EMBED_ONLY hearthis.at row from Studio → Sounds or Library was
falling through to `fetchEditorSource` / mock `DEMO_MP3` (~3 min silent),
because `lib/embedPlayback.ts` was missing and `playableFromHearthis`
preferred a hotlinked `streamUrl` over the shared player widget.

Fix: always build hearthis playables with `embed` + empty `streamUrl`;
route Studio/Library play through `playableFromStudioHearthis`.

Details: `packages/tahti-web/UI-REDESIGN-WORKLOG.md`.
