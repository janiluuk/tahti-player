-- Composer as the file's tags state it, read on import, re-read and relink
-- like the other text tags (desktop-pro-library.md Phase 1). Existing rows
-- stay blank until their file is read again.
ALTER TABLE library_tracks ADD COLUMN composer TEXT NOT NULL DEFAULT '';
CREATE INDEX library_tracks_composer_sort ON library_tracks ((composer = ''), composer COLLATE NOCASE);
CREATE INDEX library_tracks_composer_sort_desc ON library_tracks ((composer = ''), composer COLLATE NOCASE DESC);
