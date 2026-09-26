use std::collections::HashMap;
use std::path::Path;
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex};

use axum::extract::{Path as UrlPath, State};
use axum::http::{header, StatusCode};
use axum::response::IntoResponse;
use axum::routing::get;

use super::playlists;
use super::provider_import::{
    default_destination, run, write_error, ProviderEntryState, ProviderImportEntry, ProviderImportProgress,
    ProviderImportRequest,
};
use super::provider_space::{estimate, free_space, verdict, SpaceVerdict};
use super::test_support::pool;

const TONE: &[u8] = include_bytes!("fixtures/tone.mp3");

#[derive(Clone, Default)]
struct Server {
    hits: Arc<Mutex<HashMap<String, usize>>>,
    /// Names that fail with 500 until this many requests have been made.
    fail_first: Arc<Mutex<HashMap<String, usize>>>,
}

async fn serve_file(State(server): State<Server>, UrlPath(name): UrlPath<String>) -> axum::response::Response {
    let count = {
        let mut hits = server.hits.lock().unwrap();
        let count = hits.entry(name.clone()).or_default();
        *count += 1;
        *count
    };
    if server.fail_first.lock().unwrap().get(&name).is_some_and(|until| count <= *until) {
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
    }
    match name.as_str() {
        "missing" => StatusCode::NOT_FOUND.into_response(),
        "page" => ([(header::CONTENT_TYPE, "text/html")], "<html>log in</html>").into_response(),
        "notes" => ([(header::CONTENT_TYPE, "audio/mpeg")], "not really audio").into_response(),
        // Streamed without a Content-Length, so its size is unknown up front.
        "stream" => {
            let body = axum::body::Body::from_stream(futures::stream::iter([Ok::<_, std::io::Error>(
                axum::body::Bytes::from_static(TONE),
            )]));
            ([(header::CONTENT_TYPE, "audio/mpeg")], body).into_response()
        }
        _ => ([(header::CONTENT_TYPE, "audio/mpeg")], TONE).into_response(),
    }
}

async fn start(server: Server) -> String {
    let app = axum::Router::new().route("/{name}", get(serve_file)).with_state(server);
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    format!("http://{addr}")
}

fn entry(base: &str, id: &str, title: &str) -> ProviderImportEntry {
    ProviderImportEntry {
        remote_id: id.into(),
        title: title.into(),
        artist: "DJ Test".into(),
        download_url: format!("{base}/{id}"),
        file_name: None,
    }
}

fn request(folder: &Path, entries: Vec<ProviderImportEntry>) -> ProviderImportRequest {
    ProviderImportRequest {
        provider: "hearthis".into(),
        set_id: "set-1".into(),
        set_title: "Night Set".into(),
        destination: folder.to_string_lossy().into_owned(),
        entries,
        playlist_name: Some("Night Set".into()),
    }
}

fn client() -> reqwest::Client {
    reqwest::Client::new()
}

fn file_names(folder: &Path) -> Vec<String> {
    let mut names: Vec<String> = std::fs::read_dir(folder)
        .unwrap()
        .map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
        .collect();
    names.sort();
    names
}

fn silent(_: ProviderImportProgress) {}

#[tokio::test]
async fn imports_a_set_in_order_into_a_playlist_and_records_where_each_track_came_from() {
    let base = start(Server::default()).await;
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let req = request(dir.path(), vec![entry(&base, "a", "Opening"), entry(&base, "b", "Peak"), entry(&base, "c", "Closing")]);

    let result = run(&pool, &client(), &req, &AtomicBool::new(false), &silent).await.unwrap();

    assert_eq!(result.imported, 3, "failures: {:?}", result.failures);
    assert_eq!(result.track_ids.len(), 3);
    assert_eq!(
        file_names(dir.path()),
        ["01 - DJ Test - Opening.mp3", "02 - DJ Test - Peak.mp3", "03 - DJ Test - Closing.mp3"]
    );
    let playlist_id = result.playlist_id.expect("playlist");
    let ids = playlists::playable_track_ids(&pool, &playlist_id).await.unwrap();
    assert_eq!(ids, result.track_ids);
    let sources: Vec<(String, String)> =
        sqlx::query_as("SELECT remote_id, set_id FROM library_track_sources ORDER BY remote_id").fetch_all(&pool).await.unwrap();
    assert_eq!(sources, [("a".into(), "set-1".into()), ("b".into(), "set-1".into()), ("c".into(), "set-1".into())]);
}

#[tokio::test]
async fn one_failed_entry_does_not_stop_the_rest_and_leaves_no_partial_files() {
    let base = start(Server::default()).await;
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let req = request(
        dir.path(),
        vec![
            entry(&base, "missing", "Gone"),
            entry(&base, "a", "Works"),
            entry(&base, "page", "Login wall"),
            entry(&base, "notes", "Not audio"),
        ],
    );
    let events = Mutex::new(Vec::new());

    let result = run(&pool, &client(), &req, &AtomicBool::new(false), &|event| events.lock().unwrap().push(event))
        .await
        .unwrap();

    assert_eq!(result.imported, 1);
    let failed: Vec<&str> = result.failures.iter().map(|f| f.remote_id.as_str()).collect();
    assert_eq!(failed, ["missing", "page", "notes"]);
    assert!(result.failures[0].error.contains("404"), "{}", result.failures[0].error);
    assert!(result.failures[1].error.contains("web page"), "{}", result.failures[1].error);
    assert_eq!(file_names(dir.path()), ["02 - DJ Test - Works.mp3"]);
    let finals: Vec<(String, ProviderEntryState)> = events
        .lock()
        .unwrap()
        .iter()
        .filter(|e| e.state != ProviderEntryState::Downloading)
        .map(|e| (e.remote_id.clone(), e.state))
        .collect();
    assert_eq!(finals.len(), 4);
    assert!(finals.contains(&("a".into(), ProviderEntryState::Imported)));
    assert!(finals.contains(&("page".into(), ProviderEntryState::Failed)));
}

#[tokio::test]
async fn rerun_skips_finished_tracks_and_only_downloads_the_ones_that_failed() {
    let server = Server::default();
    server.fail_first.lock().unwrap().insert("b".into(), 1);
    let base = start(server.clone()).await;
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let req = request(dir.path(), vec![entry(&base, "a", "One"), entry(&base, "b", "Two")]);

    let first = run(&pool, &client(), &req, &AtomicBool::new(false), &silent).await.unwrap();
    assert_eq!((first.imported, first.failures.len()), (1, 1));

    let second = run(&pool, &client(), &req, &AtomicBool::new(false), &silent).await.unwrap();

    assert_eq!((second.imported, second.skipped, second.failures.len()), (1, 1, 0));
    assert_eq!(server.hits.lock().unwrap().get("a"), Some(&1), "finished track downloaded again");
    assert_eq!(second.track_ids[0], first.track_ids[0]);
    let playlist = second.playlist_id.unwrap();
    assert_eq!(first.playlist_id.as_deref(), Some(playlist.as_str()), "playlist reused");
    assert_eq!(playlists::playable_track_ids(&pool, &playlist).await.unwrap(), second.track_ids);
    let tracks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM library_tracks").fetch_one(&pool).await.unwrap();
    assert_eq!(tracks, 2);
}

#[tokio::test]
async fn cancelling_downloads_nothing_further() {
    let server = Server::default();
    let base = start(server.clone()).await;
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let req = request(dir.path(), vec![entry(&base, "a", "One"), entry(&base, "b", "Two")]);

    let result = run(&pool, &client(), &req, &AtomicBool::new(true), &silent).await.unwrap();

    assert!(result.cancelled);
    assert_eq!(result.imported, 0);
    assert!(result.playlist_id.is_none());
    assert!(file_names(dir.path()).is_empty());
    assert!(server.hits.lock().unwrap().is_empty());
}

#[tokio::test]
async fn a_different_file_with_the_same_name_is_kept_and_the_download_gets_a_suffix() {
    let base = start(Server::default()).await;
    let dir = tempfile::tempdir().unwrap();
    let existing = dir.path().join("01 - DJ Test - One.mp3");
    std::fs::write(&existing, b"someone else's file").unwrap();
    let pool = pool().await;
    let mut req = request(dir.path(), vec![entry(&base, "a", "One")]);
    req.playlist_name = None;

    let result = run(&pool, &client(), &req, &AtomicBool::new(false), &silent).await.unwrap();

    assert_eq!(result.imported, 1, "failures: {:?}", result.failures);
    assert_eq!(std::fs::read(&existing).unwrap(), b"someone else's file");
    assert_eq!(file_names(dir.path()), ["01 - DJ Test - One (2).mp3", "01 - DJ Test - One.mp3"]);
    assert!(result.playlist_id.is_none());
}

#[tokio::test]
async fn the_provider_file_name_decides_the_extension() {
    let base = start(Server::default()).await;
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let mut item = entry(&base, "a", "Tagged");
    item.file_name = Some("Original Name.MP3".into());
    let result = run(&pool, &client(), &request(dir.path(), vec![item]), &AtomicBool::new(false), &silent)
        .await
        .unwrap();
    assert_eq!(result.imported, 1, "failures: {:?}", result.failures);
    assert_eq!(file_names(dir.path()), ["01 - DJ Test - Tagged.mp3"]);
}

#[tokio::test]
async fn rejects_unknown_providers_and_relative_folders() {
    let pool = pool().await;
    let dir = tempfile::tempdir().unwrap();
    let mut req = request(dir.path(), vec![]);
    req.provider = "somewhere".into();
    assert!(run(&pool, &client(), &req, &AtomicBool::new(false), &silent).await.is_err());

    let mut req = request(dir.path(), vec![]);
    req.destination = "relative/folder".into();
    assert!(run(&pool, &client(), &req, &AtomicBool::new(false), &silent).await.is_err());
}

#[test]
fn default_destination_is_a_clean_folder_per_provider_and_set() {
    let root = Path::new("/Music");
    assert_eq!(
        default_destination(root, "hearthis", "Live: 10/10 ").unwrap(),
        Path::new("/Music/Tahti/hearthis.at/Live_ 10_10")
    );
    assert_eq!(default_destination(root, "hearthis", "...").unwrap(), Path::new("/Music/Tahti/hearthis.at/Untitled set"));
    assert!(default_destination(root, "nope", "x").is_err());
}

#[tokio::test]
async fn space_estimate_sums_reported_sizes_and_counts_the_rest_as_unknown() {
    let base = start(Server::default()).await;
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let req = request(
        &dir.path().join("not yet created"),
        vec![entry(&base, "a", "Sized"), entry(&base, "b", "Sized too"), entry(&base, "stream", "No length"), entry(&base, "missing", "Gone")],
    );

    let space = estimate(&pool, &client(), &req).await.unwrap();

    assert_eq!(space.needed_bytes, 2 * TONE.len() as u64);
    assert_eq!((space.sized, space.unknown_size, space.already_imported), (2, 2, 0));
    assert!(space.free_bytes.is_some_and(|free| free > 0));
    assert_eq!(space.verdict, verdict(space.needed_bytes, space.free_bytes));
    assert!(!dir.path().join("not yet created").exists(), "estimating must not create the folder");
}

#[tokio::test]
async fn space_estimate_leaves_out_tracks_already_in_the_library() {
    let server = Server::default();
    let base = start(server.clone()).await;
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let first = request(dir.path(), vec![entry(&base, "a", "One")]);
    run(&pool, &client(), &first, &AtomicBool::new(false), &silent).await.unwrap();
    let req = request(dir.path(), vec![entry(&base, "a", "One"), entry(&base, "stream", "Two")]);

    let space = estimate(&pool, &client(), &req).await.unwrap();

    assert_eq!((space.sized, space.unknown_size, space.already_imported), (0, 1, 1));
    assert_eq!(space.needed_bytes, 0);
    assert_eq!(server.hits.lock().unwrap().get("a"), Some(&1), "imported track sized again");
}

#[tokio::test]
async fn space_estimate_rejects_relative_folders() {
    let pool = pool().await;
    let mut req = request(Path::new("/tmp"), vec![]);
    req.destination = "relative".into();
    assert!(estimate(&pool, &client(), &req).await.is_err());
}

#[tokio::test]
async fn a_track_without_a_content_length_still_downloads() {
    let base = start(Server::default()).await;
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let req = request(dir.path(), vec![entry(&base, "stream", "Streamed")]);
    let result = run(&pool, &client(), &req, &AtomicBool::new(false), &silent).await.unwrap();
    assert_eq!(result.imported, 1, "failures: {:?}", result.failures);
}

#[test]
fn space_verdict_blocks_only_when_known_sizes_exceed_free_space() {
    const MB: u64 = 1024 * 1024;
    assert_eq!(verdict(100 * MB, None), SpaceVerdict::Unknown);
    assert_eq!(verdict(100 * MB, Some(10_000 * MB)), SpaceVerdict::Fits);
    assert_eq!(verdict(100 * MB, Some(300 * MB)), SpaceVerdict::Tight);
    assert_eq!(verdict(100 * MB, Some(99 * MB)), SpaceVerdict::NotEnough);
    assert_eq!(verdict(10_000 * MB, Some(10_500 * MB)), SpaceVerdict::Tight);
    assert_eq!(verdict(10_000 * MB, Some(11_500 * MB)), SpaceVerdict::Fits);
}

#[test]
fn free_space_measures_the_nearest_existing_folder() {
    let dir = tempfile::tempdir().unwrap();
    assert!(free_space(&dir.path().join("a/b/c")).is_some_and(|free| free > 0));
}

#[cfg(unix)]
#[test]
fn a_full_disk_says_so() {
    let folder = Path::new("/Music/Tahti/hearthis.at/Night Set");
    let full = write_error(folder, "Cannot write the file", &std::io::Error::from_raw_os_error(libc::ENOSPC));
    assert_eq!(full, "The disk is full. Free up space on the drive holding /Music/Tahti/hearthis.at/Night Set and retry");
    let other = write_error(folder, "Cannot write the file", &std::io::Error::from_raw_os_error(libc::EACCES));
    assert!(other.starts_with("Cannot write the file: "), "{other}");
}
