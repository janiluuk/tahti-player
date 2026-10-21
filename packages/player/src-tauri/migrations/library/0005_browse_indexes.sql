-- Faceted browsing (desktop-pro-library.md Phase 2): artists, albums,
-- genres and folders all group/filter straight from indexes.
ALTER TABLE library_tracks ADD COLUMN folder TEXT NOT NULL DEFAULT '';
-- Directory of `path` including its trailing separator (either style):
-- strip the trailing run of non-separator characters.
UPDATE library_tracks
SET folder = rtrim(path, replace(replace(path, '/', ''), '\', ''));

CREATE INDEX library_tracks_folder ON library_tracks(folder);
CREATE INDEX library_tracks_genre ON library_tracks(genre COLLATE NOCASE);
CREATE INDEX library_tracks_album ON library_tracks(album COLLATE NOCASE);
-- Must match `ARTIST_KEY` in local_library/mod.rs exactly to be used.
CREATE INDEX library_tracks_artist_key ON library_tracks(
    COALESCE(NULLIF(album_artist, ''), NULLIF(artist, ''), '') COLLATE NOCASE
);
