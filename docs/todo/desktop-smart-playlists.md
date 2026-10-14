# Smart playlists for the desktop library

**Status:** open

User request (2026-10-15): "smart playlists where you can set easily conditions using between, bigger / equal than, etc - those should live update, use cache though". Then: "this is for desktop application, perhaps web can have it as well but main purpose is local file management".

## What exists (desktop library, Phase 5 of `desktop-pro-library.md`)

- Rust `packages/player/src-tauri/src/local_library/smart_playlists.rs`: a saved definition (match all/any, rules, sort, optional limit) is compiled to SQL over `library_tracks`. Nothing about the result is stored; every list, count and play re-runs the query.
- Operators (`NativeRuleOp` in `packages/tahti-web/src/lib/native-library/analysis.ts`): `is`, `isNot`, `contains`, `notContains`, `atLeast`, `atMost`, `between` (`value2` is the upper bound), `inLastDays`, `notInLastDays`, `isSet`, `isNotSet`. Fields include rating, play count, duration, BPM, key, loudness, last played, added and analysed.
- UI: `SmartPlaylistDialog.tsx` (rule editor with a count of what matches now) and `SmartPlaylists.tsx` (the list, which evaluates every playlist when it renders).

## What the request adds

1. **Easier conditions.** The editor works, but "at least" / "at most" / "between" are generic selects with free-text values. Wanted: operators shown per field type (numbers: =, ≠, >, ≥, <, ≤, between; dates: before / after / between / in the last N days; text: is / contains / starts with), typed inputs (number, duration as mm:ss, date picker, key picker, star rating), the `between` pair side by side, and a readable summary ("BPM between 120 and 128, rating ≥ 4, added in the last 30 days"). Strict `>`/`<` and `startsWith` are new operators in Rust and TS.
2. **Live updates.** An open smart playlist (and its count in the sidebar) should change when the library changes: import, rescan, a tag or rating edit, a play (play count and last played), analysis finishing. "In the last N days" rules also move with the clock.
3. **A cache.** Keep each playlist's matching track ids and count (memory, or a `smart_playlist_cache` table) and serve lists from it. Invalidate per playlist when a change touches a field its rules use, instead of re-running every query on each render. Rules over relative dates refresh on a timer (once per hour, and at midnight).

## Open questions

- Where change events come from: the Rust side already writes every library change, so emitting a `library-changed { trackIds, fields }` event from there is likelier to be complete than tracking edits in the webview. Filesystem watching (Phase 6) is not built, so files changed outside the app only show up after a rescan.
- Cache in SQLite (survives restart, needs migration and invalidation in Rust) or in the webview store (simpler, lost on restart). Recommendation: SQLite in Rust, next to the query, so the desktop MCP and the Tahti Jam remote see the same lists.
- Web: tahti-web has no local files; a web version would run the same rules over the user's Tahti favourites or history through tahti-org. Out of scope until the desktop version ships.

## Plan (slices)

1. Rust: `gt`/`lt`/`startsWith` operators and tests; a per-field operator table shared with TS.
2. Editor: typed inputs per field, a side-by-side `between`, a readable summary line; Storybook stories for the editor states.
3. Rust: a `library-changed` event from every write path (import, rescan, edit, rating, play, analysis).
4. Rust: a smart playlist cache (ids and count) with per-field invalidation; `evaluate` reads from it.
5. Webview: subscribe to the event; open lists and sidebar counts refresh; a timer for relative-date rules.
6. Check on a real library (10k+ tracks) that editing a rating updates the open list without a full re-query.
