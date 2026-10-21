-- Local listening history: one row per counted listen. The title/artist
-- snapshot keeps an entry readable after the track leaves the catalog.
CREATE TABLE library_play_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id TEXT REFERENCES library_tracks(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    played_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
);
CREATE INDEX library_play_log_time ON library_play_log(played_at DESC, id DESC);
CREATE INDEX library_play_log_track ON library_play_log(track_id);
