use serde_json::{json, Value};

pub fn list_methods(domain: &str) -> Result<Value, String> {
    let result = match domain {
        "Queue" => json!({
            "domain": "Queue",
            "description": "Manage the playback queue — add, remove, reorder tracks and control navigation.",
            "methods": [
                "getQueue",
                "getCurrentItem",
                "addToQueue",
                "addNext",
                "addAt",
                "removeByIds",
                "removeByIndices",
                "clearQueue",
                "reorder",
                "goToNext",
                "goToPrevious",
                "goToIndex",
                "goToId",
                "updateItemState"
            ]
        }),
        "Playback" => json!({
            "domain": "Playback",
            "description": "Control audio playback state, transport, and seeking.",
            "methods": [
                "getState",
                "play",
                "pause",
                "stop",
                "toggle",
                "seekTo",
                "getVolume",
                "setVolume",
                "isMuted",
                "setMuted",
                "isShuffleEnabled",
                "setShuffleEnabled",
                "getRepeatMode",
                "setRepeatMode"
            ]
        }),
        "Metadata" => json!({
            "domain": "Metadata",
            "description": "Search for music and fetch artist, album, and track metadata.",
            "methods": [
                "search",
                "fetchArtistBio",
                "fetchArtistSocialStats",
                "fetchArtistAlbums",
                "fetchArtistTopTracks",
                "fetchArtistPlaylists",
                "fetchArtistRelatedArtists",
                "fetchAlbumDetails"
            ]
        }),
        "Favorites" => json!({
            "domain": "Favorites",
            "description": "Manage favorite tracks, albums, and artists.",
            "methods": [
                "getTracks",
                "getAlbums",
                "getArtists",
                "addTrack",
                "removeTrack",
                "isTrackFavorite",
                "addAlbum",
                "removeAlbum",
                "isAlbumFavorite",
                "addArtist",
                "removeArtist",
                "isArtistFavorite"
            ]
        }),
        "Playlists" => json!({
            "domain": "Playlists",
            "description": "Create, edit, import, and manage playlists.",
            "methods": [
                "getIndex",
                "getPlaylist",
                "createPlaylist",
                "deletePlaylist",
                "addTracks",
                "removeTracks",
                "reorderTracks",
                "importPlaylist",
                "saveQueueAsPlaylist"
            ]
        }),
        "Dashboard" => json!({
            "domain": "Dashboard",
            "description": "Fetch trending and editorial content from music providers.",
            "methods": [
                "fetchTopTracks",
                "fetchTopArtists",
                "fetchTopAlbums",
                "fetchEditorialPlaylists",
                "fetchNewReleases"
            ]
        }),
        "Providers" => json!({
            "domain": "Providers",
            "description": "Query registered music providers (metadata, streaming, dashboard, etc.).",
            "methods": [
                "list",
                "get"
            ]
        }),
        _ => {
            return Err(format!(
                "Unknown domain: '{domain}'. Available domains: Queue, Playback, Metadata, Favorites, Playlists, Dashboard, Providers."
            ))
        }
    };

    Ok(result)
}
