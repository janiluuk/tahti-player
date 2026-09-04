# Studio / Library embed playback

hearthis.at (and other EMBED_ONLY) tracks must play through the provider
widget, not `fetchEditorSource` / a hotlinked stream. That path was the
3-minute silent DEMO_MP3 fallback.

Details: `packages/tahti-web/UI-REDESIGN-WORKLOG.md`
(2026-09-04 — Studio/Library embed playback).
