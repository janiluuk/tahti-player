# tahti-cli — CLI tool using the tahti-api client

**Status:** open

Roadmap item (2026-09-07). Inspiration: [antiwork/gumroad-cli](https://github.com/antiwork/gumroad-cli)
— a thin CLI wrapping a product's API client for scriptable, terminal-first
access.

**Vision:** `tahti-cli` package that consumes the generated `tahti-org`
`api-client` SDK (same one `tahti-web` uses) to do things from the terminal:
list library items, search, maybe queue/play. Possibly a CLI UI (TUI) for
the player itself — not just a scripting wrapper.

Not scoped or designed yet:
- Where it lives (new package in `tahti-nuclear`, e.g. `packages/tahti-cli`,
  vs. its own repo).
- Auth story for a CLI (token file? device-code flow against tahti-org?).
- Scope of v1 commands — start with read-only listing (library items) per
  the ask; playback/TUI is explicitly a stretch goal ("perhaps even").
- Relationship to [[desktop-pro-library]] (`docs/todo/desktop-pro-library.md`)
  — that's a GUI desktop player (Tauri), this is a terminal tool; likely
  share the same `api-client` but are otherwise independent efforts.

No implementation started.
