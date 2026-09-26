-- iTunes / Music.app library XML import (desktop-pro-library.md Phase 1).
--
-- iTunes play and skip counts are running totals, so a re-import must add
-- only what grew since the last one. `library_itunes_tracks` remembers, per
-- iTunes Persistent ID, which catalog track it was linked to and the counts
-- already added; `library_itunes_playlists` remembers which local playlist
-- an iTunes playlist became, so a re-import never creates it twice.
CREATE TABLE library_itunes_tracks (
    persistent_id TEXT PRIMARY KEY NOT NULL,
    track_id TEXT REFERENCES library_tracks(id) ON DELETE SET NULL,
    path TEXT NOT NULL,
    play_count INTEGER NOT NULL DEFAULT 0,
    skip_count INTEGER NOT NULL DEFAULT 0,
    imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX library_itunes_tracks_track ON library_itunes_tracks(track_id);

CREATE TABLE library_itunes_playlists (
    persistent_id TEXT PRIMARY KEY NOT NULL,
    playlist_id TEXT REFERENCES library_playlists(id) ON DELETE SET NULL,
    -- Folder chain the playlist sat in inside iTunes ("Parties / 2019").
    folder_path TEXT NOT NULL DEFAULT '',
    imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE library_tracks ADD COLUMN skip_count INTEGER NOT NULL DEFAULT 0;
