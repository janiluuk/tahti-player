-- BPM, key and ReplayGain read from the file's own tags on every import,
-- re-read and relink (desktop-pro-library.md Phase 1). They are file facts,
-- like title or genre, so a re-read replaces them (a removed tag becomes NULL).
-- User corrections stay in `library_analysis_user` and computed estimates in
-- `library_analysis`; `analysis::refresh_effective` still picks
-- user > tag > estimate for `library_tracks.bpm` / `musical_key`.
-- ReplayGain is stored only; playback gain does not use it.
ALTER TABLE library_tracks ADD COLUMN tag_bpm REAL;
ALTER TABLE library_tracks ADD COLUMN tag_key TEXT;
ALTER TABLE library_tracks ADD COLUMN replaygain_track_gain REAL;
ALTER TABLE library_tracks ADD COLUMN replaygain_track_peak REAL;
ALTER TABLE library_tracks ADD COLUMN replaygain_album_gain REAL;
ALTER TABLE library_tracks ADD COLUMN replaygain_album_peak REAL;

-- Until now tags were only read during analysis; keep what it found.
UPDATE library_tracks SET
    tag_bpm = (SELECT a.tag_bpm FROM library_analysis a WHERE a.track_id = library_tracks.id),
    tag_key = (SELECT a.tag_key FROM library_analysis a WHERE a.track_id = library_tracks.id)
WHERE id IN (SELECT track_id FROM library_analysis);
