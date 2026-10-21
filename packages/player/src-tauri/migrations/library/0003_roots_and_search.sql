-- Library roots (desktop-pro-library.md Phase 1): folders the user asked to
-- keep in sync, as opposed to one-off imports. A track may belong to at most
-- one root; ad hoc imports keep `root_id` NULL. Removing a root only stops
-- tracking it -- catalog rows survive (ON DELETE SET NULL).
CREATE TABLE library_roots (
    id TEXT PRIMARY KEY NOT NULL,
    path TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_scanned_at TEXT
);
ALTER TABLE library_tracks ADD COLUMN root_id TEXT REFERENCES library_roots(id) ON DELETE SET NULL;
CREATE INDEX library_tracks_root ON library_tracks(root_id);

-- Indexed substring search. The trigram tokenizer keeps the old
-- `LIKE '%term%'` semantics (case-insensitive substring, any column) but
-- answers from an index instead of scanning every row -- the difference
-- between ~1ms and ~100ms+ per keystroke at 100k tracks. External-content
-- table keyed on the implicit rowid: the app never VACUUMs library.db in
-- place; after restoring a `VACUUM INTO` backup run
-- `INSERT INTO library_tracks_fts(library_tracks_fts) VALUES('rebuild')`.
CREATE VIRTUAL TABLE library_tracks_fts USING fts5(
    title, artist, album, path,
    content='library_tracks',
    content_rowid='rowid',
    tokenize='trigram'
);
INSERT INTO library_tracks_fts(library_tracks_fts) VALUES('rebuild');

CREATE TRIGGER library_tracks_fts_insert AFTER INSERT ON library_tracks BEGIN
    INSERT INTO library_tracks_fts(rowid, title, artist, album, path)
    VALUES (new.rowid, new.title, new.artist, new.album, new.path);
END;
CREATE TRIGGER library_tracks_fts_delete AFTER DELETE ON library_tracks BEGIN
    INSERT INTO library_tracks_fts(library_tracks_fts, rowid, title, artist, album, path)
    VALUES ('delete', old.rowid, old.title, old.artist, old.album, old.path);
END;
-- Column-scoped so availability/root_id updates don't churn the index.
CREATE TRIGGER library_tracks_fts_update AFTER UPDATE OF title, artist, album, path ON library_tracks BEGIN
    INSERT INTO library_tracks_fts(library_tracks_fts, rowid, title, artist, album, path)
    VALUES ('delete', old.rowid, old.title, old.artist, old.album, old.path);
    INSERT INTO library_tracks_fts(rowid, title, artist, album, path)
    VALUES (new.rowid, new.title, new.artist, new.album, new.path);
END;
