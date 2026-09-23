use serde_json::{json, Value};

use super::domains::list_methods;

pub fn method_details(domain: &str, method: &str) -> Result<Value, String> {
    let result = match (domain, method) {
        ("Queue", "getQueue") => json!({
            "domain": "Queue",
            "method": "getQueue",
            "description": "Get the current queue state.",
            "params": [],
            "returns": "Queue"
        }),
        ("Queue", "getCurrentItem") => json!({
            "domain": "Queue",
            "method": "getCurrentItem",
            "description": "Get the currently playing queue item.",
            "params": [],
            "returns": "QueueItem | undefined"
        }),
        ("Queue", "addToQueue") => json!({
            "domain": "Queue",
            "method": "addToQueue",
            "description": "Add tracks to the end of the queue.",
            "params": [{ "name": "tracks", "type": "Track[]" }],
            "returns": "void"
        }),
        ("Queue", "addNext") => json!({
            "domain": "Queue",
            "method": "addNext",
            "description": "Insert tracks immediately after the current item.",
            "params": [{ "name": "tracks", "type": "Track[]" }],
            "returns": "void"
        }),
        ("Queue", "addAt") => json!({
            "domain": "Queue",
            "method": "addAt",
            "description": "Insert tracks at a specific position.",
            "params": [
                { "name": "tracks", "type": "Track[]" },
                { "name": "index", "type": "number" }
            ],
            "returns": "void"
        }),
        ("Queue", "removeByIds") => json!({
            "domain": "Queue",
            "method": "removeByIds",
            "description": "Remove items from the queue by their IDs.",
            "params": [{ "name": "ids", "type": "string[]" }],
            "returns": "void"
        }),
        ("Queue", "removeByIndices") => json!({
            "domain": "Queue",
            "method": "removeByIndices",
            "description": "Remove items from the queue by their indices.",
            "params": [{ "name": "indices", "type": "number[]" }],
            "returns": "void"
        }),
        ("Queue", "clearQueue") => json!({
            "domain": "Queue",
            "method": "clearQueue",
            "description": "Remove all items from the queue.",
            "params": [],
            "returns": "void"
        }),
        ("Queue", "reorder") => json!({
            "domain": "Queue",
            "method": "reorder",
            "description": "Move a queue item from one position to another.",
            "params": [
                { "name": "fromIndex", "type": "number" },
                { "name": "toIndex", "type": "number" }
            ],
            "returns": "void"
        }),
        ("Queue", "goToNext") => json!({
            "domain": "Queue",
            "method": "goToNext",
            "description": "Skip to the next item.",
            "params": [],
            "returns": "void"
        }),
        ("Queue", "goToPrevious") => json!({
            "domain": "Queue",
            "method": "goToPrevious",
            "description": "Go back to the previous item.",
            "params": [],
            "returns": "void"
        }),
        ("Queue", "goToIndex") => json!({
            "domain": "Queue",
            "method": "goToIndex",
            "description": "Jump to a specific position in the queue.",
            "params": [{ "name": "index", "type": "number" }],
            "returns": "void"
        }),
        ("Queue", "goToId") => json!({
            "domain": "Queue",
            "method": "goToId",
            "description": "Jump to a specific queue item by its ID.",
            "params": [{ "name": "id", "type": "string" }],
            "returns": "void"
        }),
        ("Queue", "updateItemState") => json!({
            "domain": "Queue",
            "method": "updateItemState",
            "description": "Update the loading status of a queue item.",
            "params": [
                { "name": "id", "type": "string" },
                { "name": "updates", "type": "QueueItemStateUpdate" }
            ],
            "returns": "void"
        }),

        ("Playback", "getState") => json!({
            "domain": "Playback",
            "method": "getState",
            "description": "Get the current playback state (status, seek position, duration).",
            "params": [],
            "returns": "PlaybackState"
        }),
        ("Playback", "play") => json!({
            "domain": "Playback",
            "method": "play",
            "description": "Start or resume playback.",
            "params": [],
            "returns": "void"
        }),
        ("Playback", "pause") => json!({
            "domain": "Playback",
            "method": "pause",
            "description": "Pause playback.",
            "params": [],
            "returns": "void"
        }),
        ("Playback", "stop") => json!({
            "domain": "Playback",
            "method": "stop",
            "description": "Stop playback and reset position.",
            "params": [],
            "returns": "void"
        }),
        ("Playback", "toggle") => json!({
            "domain": "Playback",
            "method": "toggle",
            "description": "Toggle between play and pause.",
            "params": [],
            "returns": "void"
        }),
        ("Playback", "seekTo") => json!({
            "domain": "Playback",
            "method": "seekTo",
            "description": "Seek to a position in seconds.",
            "params": [{ "name": "seconds", "type": "number" }],
            "returns": "void"
        }),
        ("Playback", "getVolume") => json!({
            "domain": "Playback",
            "method": "getVolume",
            "description": "Get the current volume level (0 to 1).",
            "params": [],
            "returns": "number"
        }),
        ("Playback", "setVolume") => json!({
            "domain": "Playback",
            "method": "setVolume",
            "description": "Set the volume level (0 to 1, where 0 is silent and 1 is full volume).",
            "params": [{ "name": "volume", "type": "number" }],
            "returns": "void"
        }),
        ("Playback", "isMuted") => json!({
            "domain": "Playback",
            "method": "isMuted",
            "description": "Check whether audio output is muted.",
            "params": [],
            "returns": "boolean"
        }),
        ("Playback", "setMuted") => json!({
            "domain": "Playback",
            "method": "setMuted",
            "description": "Mute or unmute audio.",
            "params": [{ "name": "muted", "type": "boolean" }],
            "returns": "void"
        }),
        ("Playback", "isShuffleEnabled") => json!({
            "domain": "Playback",
            "method": "isShuffleEnabled",
            "description": "Check whether shuffle is enabled.",
            "params": [],
            "returns": "boolean"
        }),
        ("Playback", "setShuffleEnabled") => json!({
            "domain": "Playback",
            "method": "setShuffleEnabled",
            "description": "Enable or disable shuffle.",
            "params": [{ "name": "enabled", "type": "boolean" }],
            "returns": "void"
        }),
        ("Playback", "getRepeatMode") => json!({
            "domain": "Playback",
            "method": "getRepeatMode",
            "description": "Get the current repeat mode: \"off\" (no repeat), \"all\" (repeat entire queue), or \"one\" (repeat current track).",
            "params": [],
            "returns": "\"off\" | \"all\" | \"one\""
        }),
        ("Playback", "setRepeatMode") => json!({
            "domain": "Playback",
            "method": "setRepeatMode",
            "description": "Set the repeat mode: \"off\" (no repeat), \"all\" (repeat entire queue), or \"one\" (repeat current track).",
            "params": [{ "name": "mode", "type": "\"off\" | \"all\" | \"one\"" }],
            "returns": "void"
        }),

        ("Metadata", "search") => json!({
            "domain": "Metadata",
            "method": "search",
            "description": "Search for artists, albums, tracks, and playlists.",
            "params": [
                { "name": "params", "type": "SearchParams" },
                { "name": "providerId", "type": "string?" }
            ],
            "returns": "SearchResults"
        }),
        ("Metadata", "fetchArtistBio") => json!({
            "domain": "Metadata",
            "method": "fetchArtistBio",
            "description": "Fetch an artist's biography and tags.",
            "params": [
                { "name": "artistId", "type": "string" },
                { "name": "providerId", "type": "string?" }
            ],
            "returns": "ArtistBio"
        }),
        ("Metadata", "fetchArtistSocialStats") => json!({
            "domain": "Metadata",
            "method": "fetchArtistSocialStats",
            "description": "Fetch an artist's social media stats (followers, track count, etc.).",
            "params": [
                { "name": "artistId", "type": "string" },
                { "name": "providerId", "type": "string?" }
            ],
            "returns": "ArtistSocialStats"
        }),
        ("Metadata", "fetchArtistAlbums") => json!({
            "domain": "Metadata",
            "method": "fetchArtistAlbums",
            "description": "Fetch an artist's album discography.",
            "params": [
                { "name": "artistId", "type": "string" },
                { "name": "providerId", "type": "string?" }
            ],
            "returns": "AlbumRef[]"
        }),
        ("Metadata", "fetchArtistTopTracks") => json!({
            "domain": "Metadata",
            "method": "fetchArtistTopTracks",
            "description": "Fetch an artist's most popular tracks.",
            "params": [
                { "name": "artistId", "type": "string" },
                { "name": "providerId", "type": "string?" }
            ],
            "returns": "TrackRef[]"
        }),
        ("Metadata", "fetchArtistPlaylists") => json!({
            "domain": "Metadata",
            "method": "fetchArtistPlaylists",
            "description": "Fetch playlists associated with an artist.",
            "params": [
                { "name": "artistId", "type": "string" },
                { "name": "providerId", "type": "string?" }
            ],
            "returns": "PlaylistRef[]"
        }),
        ("Metadata", "fetchArtistRelatedArtists") => json!({
            "domain": "Metadata",
            "method": "fetchArtistRelatedArtists",
            "description": "Fetch artists similar to the given artist.",
            "params": [
                { "name": "artistId", "type": "string" },
                { "name": "providerId", "type": "string?" }
            ],
            "returns": "ArtistRef[]"
        }),
        ("Metadata", "fetchAlbumDetails") => json!({
            "domain": "Metadata",
            "method": "fetchAlbumDetails",
            "description": "Fetch full album details including track listing.",
            "params": [
                { "name": "albumId", "type": "string" },
                { "name": "providerId", "type": "string?" }
            ],
            "returns": "Album"
        }),

        ("Favorites", "getTracks") => json!({
            "domain": "Favorites",
            "method": "getTracks",
            "description": "Get all favorite tracks.",
            "params": [],
            "returns": "FavoriteEntry<Track>[]"
        }),
        ("Favorites", "getAlbums") => json!({
            "domain": "Favorites",
            "method": "getAlbums",
            "description": "Get all favorite albums.",
            "params": [],
            "returns": "FavoriteEntry<AlbumRef>[]"
        }),
        ("Favorites", "getArtists") => json!({
            "domain": "Favorites",
            "method": "getArtists",
            "description": "Get all favorite artists.",
            "params": [],
            "returns": "FavoriteEntry<ArtistRef>[]"
        }),
        ("Favorites", "addTrack") => json!({
            "domain": "Favorites",
            "method": "addTrack",
            "description": "Add a track to favorites.",
            "params": [{ "name": "track", "type": "Track" }],
            "returns": "void"
        }),
        ("Favorites", "removeTrack") => json!({
            "domain": "Favorites",
            "method": "removeTrack",
            "description": "Remove a track from favorites by its provider reference.",
            "params": [{ "name": "source", "type": "ProviderRef" }],
            "returns": "void"
        }),
        ("Favorites", "isTrackFavorite") => json!({
            "domain": "Favorites",
            "method": "isTrackFavorite",
            "description": "Check if a track is in favorites.",
            "params": [{ "name": "source", "type": "ProviderRef" }],
            "returns": "boolean"
        }),
        ("Favorites", "addAlbum") => json!({
            "domain": "Favorites",
            "method": "addAlbum",
            "description": "Add an album to favorites.",
            "params": [{ "name": "ref", "type": "AlbumRef" }],
            "returns": "void"
        }),
        ("Favorites", "removeAlbum") => json!({
            "domain": "Favorites",
            "method": "removeAlbum",
            "description": "Remove an album from favorites by its provider reference.",
            "params": [{ "name": "source", "type": "ProviderRef" }],
            "returns": "void"
        }),
        ("Favorites", "isAlbumFavorite") => json!({
            "domain": "Favorites",
            "method": "isAlbumFavorite",
            "description": "Check if an album is in favorites.",
            "params": [{ "name": "source", "type": "ProviderRef" }],
            "returns": "boolean"
        }),
        ("Favorites", "addArtist") => json!({
            "domain": "Favorites",
            "method": "addArtist",
            "description": "Add an artist to favorites.",
            "params": [{ "name": "ref", "type": "ArtistRef" }],
            "returns": "void"
        }),
        ("Favorites", "removeArtist") => json!({
            "domain": "Favorites",
            "method": "removeArtist",
            "description": "Remove an artist from favorites by its provider reference.",
            "params": [{ "name": "source", "type": "ProviderRef" }],
            "returns": "void"
        }),
        ("Favorites", "isArtistFavorite") => json!({
            "domain": "Favorites",
            "method": "isArtistFavorite",
            "description": "Check if an artist is in favorites.",
            "params": [{ "name": "source", "type": "ProviderRef" }],
            "returns": "boolean"
        }),

        ("Playlists", "getIndex") => json!({
            "domain": "Playlists",
            "method": "getIndex",
            "description": "Get the list of all playlists with summary info.",
            "params": [],
            "returns": "PlaylistIndexEntry[]"
        }),
        ("Playlists", "getPlaylist") => json!({
            "domain": "Playlists",
            "method": "getPlaylist",
            "description": "Get a playlist by ID with all its items.",
            "params": [{ "name": "id", "type": "string" }],
            "returns": "Playlist | null"
        }),
        ("Playlists", "createPlaylist") => json!({
            "domain": "Playlists",
            "method": "createPlaylist",
            "description": "Create a new empty playlist. Returns the playlist ID.",
            "params": [{ "name": "name", "type": "string" }],
            "returns": "string"
        }),
        ("Playlists", "deletePlaylist") => json!({
            "domain": "Playlists",
            "method": "deletePlaylist",
            "description": "Delete a playlist by ID.",
            "params": [{ "name": "id", "type": "string" }],
            "returns": "void"
        }),
        ("Playlists", "addTracks") => json!({
            "domain": "Playlists",
            "method": "addTracks",
            "description": "Add tracks to a playlist. Returns the created playlist items.",
            "params": [
                { "name": "playlistId", "type": "string" },
                { "name": "tracks", "type": "Track[]" }
            ],
            "returns": "PlaylistItem[]"
        }),
        ("Playlists", "removeTracks") => json!({
            "domain": "Playlists",
            "method": "removeTracks",
            "description": "Remove items from a playlist by their item IDs.",
            "params": [
                { "name": "playlistId", "type": "string" },
                { "name": "itemIds", "type": "string[]" }
            ],
            "returns": "void"
        }),
        ("Playlists", "reorderTracks") => json!({
            "domain": "Playlists",
            "method": "reorderTracks",
            "description": "Move a track within a playlist from one position to another.",
            "params": [
                { "name": "playlistId", "type": "string" },
                { "name": "from", "type": "number" },
                { "name": "to", "type": "number" }
            ],
            "returns": "void"
        }),
        ("Playlists", "importPlaylist") => json!({
            "domain": "Playlists",
            "method": "importPlaylist",
            "description": "Import a full playlist object. Returns the new playlist ID.",
            "params": [{ "name": "playlist", "type": "Playlist" }],
            "returns": "string"
        }),
        ("Playlists", "saveQueueAsPlaylist") => json!({
            "domain": "Playlists",
            "method": "saveQueueAsPlaylist",
            "description": "Save the current queue as a new playlist. Returns the playlist ID.",
            "params": [{ "name": "name", "type": "string" }],
            "returns": "string"
        }),

        ("Dashboard", "fetchTopTracks") => json!({
            "domain": "Dashboard",
            "method": "fetchTopTracks",
            "description": "Fetch top/trending tracks, optionally from a specific provider.",
            "params": [{ "name": "providerId", "type": "string?" }],
            "returns": "AttributedResult<Track>[]"
        }),
        ("Dashboard", "fetchTopArtists") => json!({
            "domain": "Dashboard",
            "method": "fetchTopArtists",
            "description": "Fetch top/trending artists, optionally from a specific provider.",
            "params": [{ "name": "providerId", "type": "string?" }],
            "returns": "AttributedResult<ArtistRef>[]"
        }),
        ("Dashboard", "fetchTopAlbums") => json!({
            "domain": "Dashboard",
            "method": "fetchTopAlbums",
            "description": "Fetch top/trending albums, optionally from a specific provider.",
            "params": [{ "name": "providerId", "type": "string?" }],
            "returns": "AttributedResult<AlbumRef>[]"
        }),
        ("Dashboard", "fetchEditorialPlaylists") => json!({
            "domain": "Dashboard",
            "method": "fetchEditorialPlaylists",
            "description": "Fetch editorial/curated playlists, optionally from a specific provider.",
            "params": [{ "name": "providerId", "type": "string?" }],
            "returns": "AttributedResult<PlaylistRef>[]"
        }),
        ("Dashboard", "fetchNewReleases") => json!({
            "domain": "Dashboard",
            "method": "fetchNewReleases",
            "description": "Fetch new album releases, optionally from a specific provider.",
            "params": [{ "name": "providerId", "type": "string?" }],
            "returns": "AttributedResult<AlbumRef>[]"
        }),

        ("Providers", "list") => json!({
            "domain": "Providers",
            "method": "list",
            "description": "List all registered providers, optionally filtered by kind (metadata, streaming, lyrics, dashboard).",
            "params": [{ "name": "kind", "type": "string?" }],
            "returns": "ProviderDescriptor[]"
        }),
        ("Providers", "get") => json!({
            "domain": "Providers",
            "method": "get",
            "description": "Get a specific provider by ID and kind.",
            "params": [
                { "name": "id", "type": "string" },
                { "name": "kind", "type": "string" }
            ],
            "returns": "ProviderDescriptor | undefined"
        }),

        _ => {
            let domain_check = list_methods(domain);
            match domain_check {
                Ok(domain_info) => {
                    let available = domain_info["methods"]
                        .as_array()
                        .map(|methods| {
                            methods
                                .iter()
                                .filter_map(|method| method.as_str())
                                .collect::<Vec<_>>()
                                .join(", ")
                        })
                        .unwrap_or_default();
                    return Err(format!(
                        "Unknown method '{method}' in domain '{domain}'. Available methods: {available}."
                    ));
                }
                Err(_) => {
                    return Err(format!(
                        "Unknown domain: '{domain}'. Available domains: Queue, Playback, Metadata, Favorites, Playlists, Dashboard, Providers."
                    ));
                }
            }
        }
    };

    Ok(result)
}
