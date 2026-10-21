-- Search also covers composer (0021): rebuild the index, since an FTS5
-- table's columns can't be altered. Same shape as 0004 plus composer.
DROP TRIGGER library_tracks_fts_insert;
DROP TRIGGER library_tracks_fts_delete;
DROP TRIGGER library_tracks_fts_update;
DROP TABLE library_tracks_fts;
CREATE VIRTUAL TABLE library_tracks_fts USING fts5(
    title, artist, album_artist, album, genre, composer, comment, path,
    content='library_tracks',
    content_rowid='rowid',
    tokenize='trigram'
);
INSERT INTO library_tracks_fts(library_tracks_fts) VALUES('rebuild');

CREATE TRIGGER library_tracks_fts_insert AFTER INSERT ON library_tracks BEGIN
    INSERT INTO library_tracks_fts(rowid, title, artist, album_artist, album, genre, composer, comment, path)
    VALUES (new.rowid, new.title, new.artist, new.album_artist, new.album, new.genre, new.composer, new.comment, new.path);
END;
CREATE TRIGGER library_tracks_fts_delete AFTER DELETE ON library_tracks BEGIN
    INSERT INTO library_tracks_fts(library_tracks_fts, rowid, title, artist, album_artist, album, genre, composer, comment, path)
    VALUES ('delete', old.rowid, old.title, old.artist, old.album_artist, old.album, old.genre, old.composer, old.comment, old.path);
END;
CREATE TRIGGER library_tracks_fts_update AFTER UPDATE OF title, artist, album_artist, album, genre, composer, comment, path ON library_tracks BEGIN
    INSERT INTO library_tracks_fts(library_tracks_fts, rowid, title, artist, album_artist, album, genre, composer, comment, path)
    VALUES ('delete', old.rowid, old.title, old.artist, old.album_artist, old.album, old.genre, old.composer, old.comment, old.path);
    INSERT INTO library_tracks_fts(rowid, title, artist, album_artist, album, genre, composer, comment, path)
    VALUES (new.rowid, new.title, new.artist, new.album_artist, new.album, new.genre, new.composer, new.comment, new.path);
END;
