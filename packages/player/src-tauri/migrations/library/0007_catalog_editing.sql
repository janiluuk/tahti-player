-- Catalog editing and organization (desktop-pro-library.md Phase 4).
--
-- Edited tag fields keep living in the `library_tracks` columns (so search,
-- sort and indexes keep working unchanged); `library_track_overrides` records
-- which of those values the user set by hand and what the file's own tag said,
-- so a rescan can put the edit back and "revert to file tag" is exact.
CREATE TABLE library_track_overrides (
    track_id TEXT NOT NULL REFERENCES library_tracks(id) ON DELETE CASCADE,
    field TEXT NOT NULL,
    value TEXT NOT NULL,
    extracted TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (track_id, field)
);

ALTER TABLE library_tracks ADD COLUMN rating INTEGER NOT NULL DEFAULT 0;
ALTER TABLE library_tracks ADD COLUMN color TEXT NOT NULL DEFAULT '';
ALTER TABLE library_tracks ADD COLUMN play_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE library_tracks ADD COLUMN last_played_at TEXT;
-- Exact-duplicate detection (on demand): SHA-256 of the file plus the size
-- and mtime it was computed at, so a changed file is re-hashed, not trusted.
ALTER TABLE library_tracks ADD COLUMN content_hash TEXT;
ALTER TABLE library_tracks ADD COLUMN hash_size INTEGER;
ALTER TABLE library_tracks ADD COLUMN hash_mtime INTEGER;
CREATE INDEX library_tracks_rating ON library_tracks(rating);
CREATE INDEX library_tracks_hash ON library_tracks(content_hash);

CREATE TABLE library_tags (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL COLLATE NOCASE UNIQUE
);
CREATE TABLE library_track_tags (
    track_id TEXT NOT NULL REFERENCES library_tracks(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES library_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (track_id, tag_id)
);
CREATE INDEX library_track_tags_tag ON library_track_tags(tag_id);
