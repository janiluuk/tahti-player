# Smart playlists for the desktop library

**Status:** partial

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

## Done (2026-10-15)

1. Strict "more than" / "less than" and "starts with" (#774).
2. Calendar dates for Date added / Last played: before, after, between (#775).
3. Typed inputs in the editor: date picker, star rating, key picker, `m:ss` length, side-by-side `between` (#776). The per-field operator table and the one-line rule summary already existed.
4. `library://changed`: SQLite triggers bump a change counter on every track or tag write; a 1 s task emits the event (#777).
5. A result cache keyed by that counter, today's date and the definition (#778).
6. The list's counts and the editor preview re-evaluate on the event and at midnight (#779).

## Left

- [ ] Check on a real library (10k+ tracks) in the desktop app that a rating edit updates the counts within a second and that cached reads are cheap. None of the six PRs was tried in the running app.
- [ ] Web (optional): the same rules over Tahti favourites or history would need tahti-org.
