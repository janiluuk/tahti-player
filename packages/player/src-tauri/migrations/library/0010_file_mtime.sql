-- Modification time (unix seconds) of the file when it was last read, so a
-- rescan can tell that a known file changed (external tag edit) and re-read
-- it. NULL until first seen by a rescan, which records it without re-reading.
ALTER TABLE library_tracks ADD COLUMN mtime INTEGER;
