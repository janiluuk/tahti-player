-- Durable local playlists (desktop-pro-library.md Phase 3).
-- An entry has its own id, so the same track can appear twice and order is
-- a property of the playlist, not of the track. `track_id` is nulled (never
-- the entry deleted) if the track leaves the catalog; the snapshot columns
-- keep the entry readable and let it be re-linked by path later.
CREATE TABLE library_playlists (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL COLLATE NOCASE UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE library_playlist_entries (
    id TEXT PRIMARY KEY NOT NULL,
    playlist_id TEXT NOT NULL REFERENCES library_playlists(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    track_id TEXT REFERENCES library_tracks(id) ON DELETE SET NULL,
    path TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    duration REAL NOT NULL DEFAULT 0
);
CREATE INDEX library_playlist_entries_order ON library_playlist_entries(playlist_id, position);
CREATE INDEX library_playlist_entries_track ON library_playlist_entries(track_id);
CREATE INDEX library_playlist_entries_path ON library_playlist_entries(path);
