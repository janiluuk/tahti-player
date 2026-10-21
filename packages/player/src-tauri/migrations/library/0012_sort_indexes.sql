-- Sort indexes for the two columns whose "blanks last" ordering cannot use
-- a plain column index (measured 300-400 ms per 100k-row sort without).
-- Each must match the ORDER BY built in local_library/mod.rs
-- (`order_clause`) exactly, once per direction.
CREATE INDEX library_tracks_sort_artist_asc ON library_tracks(
    (COALESCE(NULLIF(album_artist, ''), NULLIF(artist, ''), '') = ''),
    COALESCE(NULLIF(album_artist, ''), NULLIF(artist, ''), '') COLLATE NOCASE ASC,
    title COLLATE NOCASE, id
);
CREATE INDEX library_tracks_sort_artist_desc ON library_tracks(
    (COALESCE(NULLIF(album_artist, ''), NULLIF(artist, ''), '') = ''),
    COALESCE(NULLIF(album_artist, ''), NULLIF(artist, ''), '') COLLATE NOCASE DESC,
    title COLLATE NOCASE, id
);
CREATE INDEX library_tracks_sort_album_asc ON library_tracks(
    (album = ''), album COLLATE NOCASE ASC,
    (disc_no IS NULL), disc_no, (track_no IS NULL), track_no,
    title COLLATE NOCASE, id
);
CREATE INDEX library_tracks_sort_album_desc ON library_tracks(
    (album = ''), album COLLATE NOCASE DESC,
    (disc_no IS NULL), disc_no, (track_no IS NULL), track_no,
    title COLLATE NOCASE, id
);
