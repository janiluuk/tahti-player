-- Persisted missing-file state (desktop-pro-library.md Phase 0).
-- `resolve_path` previously only checked existence transiently per-call; a
-- catalog/browse view had no way to show "unavailable" without resolving
-- every row. 1 = available/resolvable, 0 = missing since `unavailable_since`.
-- Existing rows default to available (1) -- see `seed_generated_rows` in
-- tests.rs, whose raw multi-column INSERT lists every column explicitly
-- except this one and must keep compiling unmodified.
ALTER TABLE library_tracks ADD COLUMN available INTEGER NOT NULL DEFAULT 1;
ALTER TABLE library_tracks ADD COLUMN unavailable_since TEXT;
CREATE INDEX library_tracks_available ON library_tracks(available);
