-- The Composers browse tab groups and filters from this, like genre in 0005.
CREATE INDEX library_tracks_composer ON library_tracks(composer COLLATE NOCASE);
