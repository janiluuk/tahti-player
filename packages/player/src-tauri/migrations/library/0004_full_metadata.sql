-- Richer extracted tags (desktop-pro-library.md Phase 1). All additive with
-- defaults so existing rows and the raw seed INSERT in tests keep working;
-- existing tracks get these on their next (re)import or rescan.
ALTER TABLE library_tracks ADD COLUMN album_artist TEXT NOT NULL DEFAULT '';
ALTER TABLE library_tracks ADD COLUMN track_no INTEGER;
ALTER TABLE library_tracks ADD COLUMN disc_no INTEGER;
ALTER TABLE library_tracks ADD COLUMN year INTEGER;
ALTER TABLE library_tracks ADD COLUMN genre TEXT NOT NULL DEFAULT '';
ALTER TABLE library_tracks ADD COLUMN comment TEXT NOT NULL DEFAULT '';
ALTER TABLE library_tracks ADD COLUMN bitrate_kbps INTEGER;

-- Search also covers album artist, genre and comment: rebuild the index
-- (an FTS5 table's columns can't be altered).
DROP TRIGGER library_tracks_fts_insert;
DROP TRIGGER library_tracks_fts_delete;
DROP TRIGGER library_tracks_fts_update;
DROP TABLE library_tracks_fts;
CREATE VIRTUAL TABLE library_tracks_fts USING fts5(
    title, artist, album_artist, album, genre, comment, path,
    content='library_tracks',
    content_rowid='rowid',
    tokenize='trigram'
);
INSERT INTO library_tracks_fts(library_tracks_fts) VALUES('rebuild');

CREATE TRIGGER library_tracks_fts_insert AFTER INSERT ON library_tracks BEGIN
    INSERT INTO library_tracks_fts(rowid, title, artist, album_artist, album, genre, comment, path)
    VALUES (new.rowid, new.title, new.artist, new.album_artist, new.album, new.genre, new.comment, new.path);
END;
CREATE TRIGGER library_tracks_fts_delete AFTER DELETE ON library_tracks BEGIN
    INSERT INTO library_tracks_fts(library_tracks_fts, rowid, title, artist, album_artist, album, genre, comment, path)
    VALUES ('delete', old.rowid, old.title, old.artist, old.album_artist, old.album, old.genre, old.comment, old.path);
END;
CREATE TRIGGER library_tracks_fts_update AFTER UPDATE OF title, artist, album_artist, album, genre, comment, path ON library_tracks BEGIN
    INSERT INTO library_tracks_fts(library_tracks_fts, rowid, title, artist, album_artist, album, genre, comment, path)
    VALUES ('delete', old.rowid, old.title, old.artist, old.album_artist, old.album, old.genre, old.comment, old.path);
    INSERT INTO library_tracks_fts(rowid, title, artist, album_artist, album, genre, comment, path)
    VALUES (new.rowid, new.title, new.artist, new.album_artist, new.album, new.genre, new.comment, new.path);
END;
