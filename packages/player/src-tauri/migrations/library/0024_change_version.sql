-- One counter that moves whenever the catalog's tracks or tags change, by
-- any code path. The app polls it to tell the webview the library changed
-- (smart playlists re-evaluate, open lists refresh).
CREATE TABLE library_change_version (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    version INTEGER NOT NULL
);
INSERT INTO library_change_version (id, version) VALUES (1, 0);

CREATE TRIGGER library_tracks_changed_insert AFTER INSERT ON library_tracks
BEGIN UPDATE library_change_version SET version = version + 1 WHERE id = 1; END;
CREATE TRIGGER library_tracks_changed_update AFTER UPDATE ON library_tracks
BEGIN UPDATE library_change_version SET version = version + 1 WHERE id = 1; END;
CREATE TRIGGER library_tracks_changed_delete AFTER DELETE ON library_tracks
BEGIN UPDATE library_change_version SET version = version + 1 WHERE id = 1; END;
CREATE TRIGGER library_track_tags_changed_insert AFTER INSERT ON library_track_tags
BEGIN UPDATE library_change_version SET version = version + 1 WHERE id = 1; END;
CREATE TRIGGER library_track_tags_changed_delete AFTER DELETE ON library_track_tags
BEGIN UPDATE library_change_version SET version = version + 1 WHERE id = 1; END;
CREATE TRIGGER library_tags_changed_update AFTER UPDATE ON library_tags
BEGIN UPDATE library_change_version SET version = version + 1 WHERE id = 1; END;
CREATE TRIGGER library_tags_changed_delete AFTER DELETE ON library_tags
BEGIN UPDATE library_change_version SET version = version + 1 WHERE id = 1; END;
