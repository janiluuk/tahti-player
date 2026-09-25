-- Where a track was downloaded from when it came from an import provider
-- (hearthis.at). A re-run of the same set looks tracks up here by
-- (provider, remote_id), so unchanged items are skipped instead of
-- downloaded again. Tracks added from local files have no row.
CREATE TABLE library_track_sources (
    track_id TEXT PRIMARY KEY REFERENCES library_tracks(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    remote_id TEXT NOT NULL,
    set_id TEXT NOT NULL DEFAULT '',
    source_url TEXT NOT NULL DEFAULT '',
    imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (provider, remote_id)
);
