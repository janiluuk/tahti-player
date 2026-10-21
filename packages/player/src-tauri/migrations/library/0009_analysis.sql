-- Audio analysis and smart playlists (desktop-pro-library.md Phase 5).
--
-- Tag values, computed estimates and user corrections are stored apart:
-- `library_analysis` holds what the file said (tag_*) and what analysis
-- computed (*_estimate), `library_analysis_user` holds hand corrections. The
-- value a filter/sort/smart playlist uses (user > tag > estimate) is copied
-- into the `library_tracks` columns below by `analysis::refresh_effective`.
CREATE TABLE library_analysis (
    track_id TEXT PRIMARY KEY NOT NULL REFERENCES library_tracks(id) ON DELETE CASCADE,
    algo_version INTEGER NOT NULL,
    -- Identity of the analyzed file: a changed file is analyzed again.
    file_size INTEGER NOT NULL,
    file_mtime INTEGER NOT NULL,
    analyzed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    peaks BLOB NOT NULL,
    loudness_lufs REAL,
    true_peak_dbtp REAL,
    tag_bpm REAL,
    tag_key TEXT,
    bpm_estimate REAL,
    bpm_confidence REAL,
    key_estimate TEXT,
    key_confidence REAL
);

CREATE TABLE library_analysis_user (
    track_id TEXT PRIMARY KEY NOT NULL REFERENCES library_tracks(id) ON DELETE CASCADE,
    bpm REAL,
    key TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE library_tracks ADD COLUMN bpm REAL;
ALTER TABLE library_tracks ADD COLUMN musical_key TEXT;
ALTER TABLE library_tracks ADD COLUMN loudness_lufs REAL;
ALTER TABLE library_tracks ADD COLUMN analyzed INTEGER NOT NULL DEFAULT 0;
CREATE INDEX library_tracks_bpm ON library_tracks(bpm);

CREATE TABLE library_smart_playlists (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL COLLATE NOCASE UNIQUE,
    match_all INTEGER NOT NULL DEFAULT 1,
    -- JSON array of rules (see smart_playlists.rs).
    rules TEXT NOT NULL,
    sort_field TEXT NOT NULL DEFAULT 'title',
    sort_descending INTEGER NOT NULL DEFAULT 0,
    max_tracks INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
