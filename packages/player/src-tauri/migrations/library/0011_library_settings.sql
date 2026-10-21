-- Small device-level key/value settings for the native library (e.g.
-- whether folder watching is paused).
CREATE TABLE library_settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
);
