-- File name of the track's embedded cover in the artwork cache
-- (`<sha256 of the image>.<ext>`, shared by every track with the same art).
-- NULL when the file has no usable picture or has not been re-read since.
ALTER TABLE library_tracks ADD COLUMN artwork_key TEXT;
