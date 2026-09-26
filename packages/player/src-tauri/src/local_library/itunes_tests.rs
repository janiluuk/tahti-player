use std::io::Cursor;
use std::path::{Path, PathBuf};

use percent_encoding::{utf8_percent_encode, AsciiSet, NON_ALPHANUMERIC};
use sqlx::SqlitePool;

use super::backup::RootMapping;
use super::catalog::{apply_edits, record_play, set_rating, EditField, FieldEdit};
use super::itunes_import::{commit, preview, LOVED_TAG};
use super::itunes_xml::{location_to_path, parse_library};
use super::playlists::{create_playlist, list_playlists};
use super::test_support::{entry_titles, pool, write_wav_tagged};
use super::{import_paths, list_query, LibraryTrack, ListQuery};

const LIBRARY: &str = include_str!("fixtures/itunes/library.xml");
const WINDOWS: &str = include_str!("fixtures/itunes/windows.xml");
const PATH_CHARS: &AsciiSet = &NON_ALPHANUMERIC.remove(b'/').remove(b'-').remove(b'_').remove(b'.');

async fn tracks(pool: &SqlitePool) -> Vec<LibraryTrack> {
    let query = ListQuery { search: "", filter: None, filters: None, sort: None };
    list_query(pool, &query, 0).await.unwrap().tracks
}

fn by_title(all: &[LibraryTrack], title: &str) -> LibraryTrack {
    all.iter().find(|t| t.title == title).unwrap_or_else(|| panic!("no track {title}")).clone()
}

async fn tags_of(pool: &SqlitePool, id: &str) -> Vec<String> {
    sqlx::query_scalar("SELECT t.name FROM library_track_tags tt JOIN library_tags t ON t.id = tt.tag_id WHERE tt.track_id = ?")
        .bind(id)
        .fetch_all(pool)
        .await
        .unwrap()
}

/// The music folder the fixture points at: WAVs (one under a Unicode
/// folder and name), the MP3 fixture, and a protected-AAC file the importer
/// cannot read. `Gone.flac` and `Missing AAC.m4a` are deliberately absent.
fn make_music(root: &Path) {
    std::fs::create_dir_all(root.join("Band")).unwrap();
    std::fs::create_dir_all(root.join("Björk")).unwrap();
    write_wav_tagged(&root.join("Band/Alpha.wav"), &[("INAM", "Alpha"), ("IART", "Band"), ("IPRD", "Record")]);
    write_wav_tagged(&root.join("Band/Beta.wav"), &[("INAM", "Beta"), ("IART", "Band")]);
    write_wav_tagged(&root.join("Björk/Jóga.wav"), &[("INAM", "Jóga")]);
    std::fs::copy(concat!(env!("CARGO_MANIFEST_DIR"), "/src/local_library/fixtures/tone.mp3"), root.join("Band/tone.mp3")).unwrap();
    std::fs::write(root.join("Band/Protected.m4p"), b"not audio").unwrap();
}

fn write_library(dir: &Path, music: &Path, template: &str) -> PathBuf {
    let encoded = utf8_percent_encode(&music.to_string_lossy(), PATH_CHARS).to_string();
    let xml = dir.join("iTunes Music Library.xml");
    std::fs::write(&xml, template.replace("{ROOT}", &encoded)).unwrap();
    xml
}

#[test]
fn locations_decode_to_local_paths() {
    assert_eq!(location_to_path("file://localhost/Users/me/Music/A%20B/c.mp3").as_deref(), Some("/Users/me/Music/A B/c.mp3"));
    assert_eq!(location_to_path("file:///Users/me/Bj%C3%B6rk/J%C3%B3ga.m4a").as_deref(), Some("/Users/me/Björk/Jóga.m4a"));
    assert_eq!(location_to_path("FILE:///x/100%25.flac").as_deref(), Some("/x/100%.flac"));
    let windows = location_to_path("file://localhost/C:/Users/Old/Music/a%23b.mp3").unwrap();
    assert_eq!(windows.replace('\\', "/"), "C:/Users/Old/Music/a#b.mp3");
    let bare_drive = location_to_path("file:///D:/Music/x.mp3").unwrap();
    assert_eq!(bare_drive.replace('\\', "/"), "D:/Music/x.mp3");
    let unc = location_to_path("file://nas/share/Music/x.flac").unwrap();
    assert_eq!(unc.replace('\\', "/"), "//nas/share/Music/x.flac");
    assert_eq!(location_to_path("http://radio.example/stream"), None);
    assert_eq!(location_to_path("file://"), None);
}

#[test]
fn parses_tracks_playlists_and_folders_from_the_fixture() {
    let library = parse_library(Cursor::new(LIBRARY.replace("{ROOT}", "/music"))).unwrap();
    assert_eq!(library.music_folder.as_deref(), Some("file://localhost/music/"));
    assert_eq!(library.tracks.len(), 9);
    let alpha = &library.tracks[0];
    assert_eq!((alpha.track_id, alpha.name.as_str(), alpha.album.as_str(), alpha.genre.as_str()), (101, "Alpha", "Another Album", "Ambient"));
    assert_eq!((alpha.year, alpha.bpm, alpha.play_count, alpha.skip_count), (Some(1999), Some(122), 5, 2));
    assert_eq!(alpha.stars(), Some(4));
    assert!(alpha.loved);
    assert_eq!(alpha.date_added.as_deref(), Some("2010-05-01 10:00:00"));
    assert_eq!(alpha.last_played.as_deref(), Some("2021-03-04 05:06:07"));
    let joga = &library.tracks[1];
    assert_eq!(joga.comments, "Fish & chips \u{2665}", "entity and character references decoded");
    assert_eq!((joga.track_number, joga.disc_number, joga.album_artist.as_str()), (Some(3), Some(1), "Björk"));
    assert_eq!(library.tracks[7].location, None, "stream has no location");
    assert_eq!(library.tracks[8].stars(), None, "album-derived rating is not the user's");

    let names: Vec<(&str, bool, bool)> = library.playlists.iter().map(|p| (p.name.as_str(), p.builtin, p.folder)).collect();
    assert_eq!(
        names,
        [("Library", true, false), ("Music", true, false), ("Parties", false, true), ("2019", false, true), ("Night & Day", false, false), ("Top Rated", false, false), ("Empty", false, false)]
    );
    assert_eq!(library.playlists[4].track_ids, [102, 101, 104, 108, 101]);
    assert_eq!(library.playlists[4].parent_persistent_id.as_deref(), Some("PPPP000000000203"));
    assert!(library.playlists[6].track_ids.is_empty());
}

#[test]
fn rejects_files_that_are_not_a_library() {
    assert!(parse_library(Cursor::new("not xml at all")).is_err());
    assert!(parse_library(Cursor::new("<plist><array><string>x</string></array></plist>")).is_err());
    assert!(parse_library(Cursor::new("<plist><dict><key>Other</key><string>x</string></dict></plist>")).is_err());
    let truncated = &LIBRARY[..LIBRARY.len() / 2];
    assert!(parse_library(Cursor::new(truncated)).is_err());
}

#[test]
fn streams_a_large_generated_library() {
    let count = 20_000;
    let mut xml = String::from("<?xml version=\"1.0\"?><plist version=\"1.0\"><dict><key>Tracks</key><dict>");
    for i in 0..count {
        xml.push_str(&format!(
            "<key>{i}</key><dict><key>Track ID</key><integer>{i}</integer><key>Name</key><string>Track {i}</string>\
             <key>Persistent ID</key><string>P{i:015}</string><key>Location</key><string>file:///m/{i}.flac</string></dict>"
        ));
    }
    xml.push_str("</dict><key>Playlists</key><array><dict><key>Name</key><string>All</string><key>Playlist Persistent ID</key><string>X</string><key>Playlist Items</key><array>");
    for i in 0..count {
        xml.push_str(&format!("<dict><key>Track ID</key><integer>{i}</integer></dict>"));
    }
    xml.push_str("</array></dict></array></dict></plist>");
    let started = std::time::Instant::now();
    let library = parse_library(std::io::BufReader::new(Cursor::new(xml.into_bytes()))).unwrap();
    eprintln!("parsed {count} tracks in {:?}", started.elapsed());
    assert_eq!(library.tracks.len(), count);
    assert_eq!(library.tracks[count - 1].name, format!("Track {}", count - 1));
    assert_eq!(library.playlists[0].track_ids.len(), count);
}

#[tokio::test]
async fn preview_then_commit_links_imports_overlays_and_recreates_playlists() {
    let music = tempfile::tempdir().unwrap();
    make_music(music.path());
    let xml_dir = tempfile::tempdir().unwrap();
    let xml = write_library(xml_dir.path(), music.path(), LIBRARY);
    let pool = pool().await;

    // Alpha is already in the catalog, with one local play and a hand edit.
    import_paths(&pool, vec![music.path().join("Band/Alpha.wav")]).await;
    let alpha_id = tracks(&pool).await[0].id.clone();
    record_play(&pool, &alpha_id).await.unwrap();
    apply_edits(&pool, std::slice::from_ref(&alpha_id), &[FieldEdit { field: EditField::Comment, value: Some("mine".into()) }]).await.unwrap();
    create_playlist(&pool, "Top Rated").await.unwrap();

    let p = preview(&pool, &xml, &[]).await.unwrap();
    assert_eq!(p.tracks, 9);
    assert_eq!((p.tracks_in_catalog, p.tracks_to_import, p.tracks_missing, p.tracks_unsupported, p.tracks_not_local, p.duplicate_tracks), (1, 3, 2, 1, 1, 1));
    assert_eq!((p.playlists, p.playlist_entries, p.playlist_folders, p.builtin_playlists_skipped, p.playlists_already_imported), (3, 6, 2, 2, 0));
    assert_eq!(p.previously_imported, 0);
    assert!(p.missing_examples.iter().any(|m| m.ends_with("Gone.flac")));
    assert!(p.missing_examples.iter().any(|m| m.ends_with("Missing AAC.m4a")), "AAC entry reported missing, not dropped");
    assert!(p.unsupported_examples[0].ends_with("Protected.m4p"));
    assert_eq!(p.music_folder.as_deref().map(|f| f.trim_end_matches('/').to_owned()), Some(music.path().to_string_lossy().into_owned()));
    assert_eq!(tracks(&pool).await.len(), 1, "preview writes nothing");

    let r = commit(&pool, &xml, &[]).await.unwrap();
    assert_eq!((r.tracks_linked, r.tracks_imported, r.tracks_failed, r.tracks_missing, r.tracks_unsupported, r.tracks_not_local), (1, 3, 0, 2, 1, 1));
    assert_eq!(r.duplicate_tracks, 1);
    assert_eq!(r.plays_added, 5 + 3 + 2 + 1);
    assert_eq!((r.ratings_applied, r.loved_tagged, r.bpm_applied), (1, 1, 1));
    assert_eq!((r.playlists_created, r.playlists_renamed, r.playlist_entries, r.playlist_entries_unavailable, r.playlist_entries_skipped), (3, 1, 6, 1, 1));

    let all = tracks(&pool).await;
    assert_eq!(all.len(), 4, "the NFD duplicate entry did not add a second Jóga");
    let alpha = by_title(&all, "Alpha");
    assert_eq!((alpha.play_count, alpha.rating), (6, 4));
    assert_eq!(alpha.album, "Record", "the file's own album tag is kept");
    assert_eq!((alpha.genre.as_str(), alpha.year), ("Ambient", Some(1999)), "gaps filled from the XML");
    assert_eq!(alpha.comment, "mine", "a hand edit is never replaced");
    assert_eq!(alpha.added_at, "2010-05-01 10:00:00");
    assert_eq!(alpha.bpm, Some(122.0));
    assert!(alpha.last_played_at.as_deref().unwrap() > "2021-03-04 05:06:07", "the later local play wins");
    assert_eq!(tags_of(&pool, &alpha.id).await, [LOVED_TAG]);
    let skips: i64 = sqlx::query_scalar("SELECT skip_count FROM library_tracks WHERE id=?").bind(&alpha.id).fetch_one(&pool).await.unwrap();
    assert_eq!(skips, 2);

    let joga = by_title(&all, "Jóga");
    assert!(joga.path.ends_with("Jóga.wav"));
    assert_eq!((joga.artist.as_str(), joga.album_artist.as_str(), joga.album.as_str()), ("Björk", "Björk", "Homogenic"));
    assert_eq!((joga.track_no, joga.disc_no, joga.play_count), (Some(3), Some(1), 5));
    assert_eq!(joga.comment, "Fish & chips \u{2665}");
    let overridden: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM library_track_overrides WHERE track_id=? AND extracted=''")
        .bind(&joga.id)
        .fetch_one(&pool)
        .await
        .unwrap();
    assert!(overridden >= 5, "filled fields are overrides over an empty file tag");
    let beta = by_title(&all, "Beta");
    assert_eq!(beta.rating, 0, "computed album rating not applied");
    assert_eq!(by_title(&all, "Tone MP3").format, "mp3", "the MP3 file's own title tag is kept");

    let playlists = list_playlists(&pool).await.unwrap();
    let names: Vec<&str> = playlists.iter().map(|p| p.name.as_str()).collect();
    assert!(names.contains(&"Parties / 2019 / Night & Day"), "{names:?}");
    assert!(names.contains(&"Top Rated (iTunes)"), "a taken name is not overwritten: {names:?}");
    assert!(names.contains(&"Empty"));
    assert!(!names.contains(&"Library") && !names.contains(&"Music") && !names.contains(&"Parties"));
    let night = playlists.iter().find(|p| p.name == "Parties / 2019 / Night & Day").unwrap();
    assert_eq!(entry_titles(&pool, &night.id).await, ["Jóga", "Alpha", "Gone", "Alpha"], "order and repeats kept");
    assert_eq!(night.unavailable_count, 1);
    let folder: String = sqlx::query_scalar("SELECT folder_path FROM library_itunes_playlists WHERE persistent_id='PPPP000000000204'")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(folder, "Parties / 2019");

    // Running the same import again changes nothing, even after a local edit.
    set_rating(&pool, std::slice::from_ref(&alpha.id), 1).await.unwrap();
    let again = preview(&pool, &xml, &[]).await.unwrap();
    assert_eq!((again.tracks_in_catalog, again.tracks_to_import, again.playlists, again.playlists_already_imported), (4, 0, 0, 3));
    assert_eq!(again.previously_imported, 5, "every linked XML entry, duplicates included");
    let r2 = commit(&pool, &xml, &[]).await.unwrap();
    assert_eq!((r2.tracks_imported, r2.plays_added, r2.skips_added, r2.ratings_applied, r2.fields_filled, r2.loved_tagged), (0, 0, 0, 0, 0, 0));
    assert_eq!((r2.playlists_created, r2.playlists_already_imported), (0, 3));
    let after = tracks(&pool).await;
    assert_eq!(after.len(), 4);
    assert_eq!(by_title(&after, "Alpha").play_count, 6);
    assert_eq!(by_title(&after, "Alpha").rating, 1, "the user's own rating is kept");
    assert_eq!(by_title(&after, "Jóga").play_count, 5);
    assert_eq!(list_playlists(&pool).await.unwrap().len(), 4);

    // Plays made in iTunes since the last export are added, and only those.
    let grown = LIBRARY.replace("<key>Play Count</key><integer>5</integer>", "<key>Play Count</key><integer>7</integer>");
    let xml = write_library(xml_dir.path(), music.path(), &grown);
    let r3 = commit(&pool, &xml, &[]).await.unwrap();
    assert_eq!(r3.plays_added, 2);
    assert_eq!(by_title(&tracks(&pool).await, "Alpha").play_count, 8);
}

#[tokio::test]
async fn windows_library_resolves_through_a_prefix_remap() {
    let music = tempfile::tempdir().unwrap();
    std::fs::create_dir_all(music.path().join("Music/Band")).unwrap();
    write_wav_tagged(&music.path().join("Music/Band/Alpha.wav"), &[("INAM", "Alpha"), ("IART", "Band")]);
    let xml_dir = tempfile::tempdir().unwrap();
    let xml = xml_dir.path().join("windows.xml");
    std::fs::write(&xml, WINDOWS).unwrap();
    let pool = pool().await;

    let unmapped = preview(&pool, &xml, &[]).await.unwrap();
    assert_eq!((unmapped.tracks_missing, unmapped.tracks_to_import), (1, 0));
    let folder = unmapped.music_folder.unwrap().replace('\\', "/");
    assert_eq!(folder, "C:/Users/Old/Music/iTunes/iTunes Media/");

    let mappings = vec![RootMapping { from: folder, to: music.path().to_string_lossy().into_owned() }];
    let mapped = preview(&pool, &xml, &mappings).await.unwrap();
    assert_eq!((mapped.tracks_missing, mapped.tracks_to_import), (0, 1));
    let result = commit(&pool, &xml, &mappings).await.unwrap();
    assert_eq!((result.tracks_imported, result.plays_added), (1, 4));
    let all = tracks(&pool).await;
    assert_eq!(all.len(), 1);
    assert_eq!(PathBuf::from(&all[0].path), music.path().join("Music/Band/Alpha.wav").canonicalize().unwrap());
}

#[tokio::test]
async fn a_track_removed_and_imported_again_gets_its_plays_back() {
    let music = tempfile::tempdir().unwrap();
    std::fs::create_dir_all(music.path().join("Music/Band")).unwrap();
    write_wav_tagged(&music.path().join("Music/Band/Alpha.wav"), &[("INAM", "Alpha")]);
    let xml_dir = tempfile::tempdir().unwrap();
    let xml = xml_dir.path().join("windows.xml");
    std::fs::write(&xml, WINDOWS).unwrap();
    let mappings = vec![RootMapping { from: "C:/Users/Old/Music/iTunes/iTunes Media".into(), to: music.path().to_string_lossy().into_owned() }];
    let pool = pool().await;
    commit(&pool, &xml, &mappings).await.unwrap();
    let id = tracks(&pool).await[0].id.clone();
    super::remove(&pool, &id).await.unwrap();
    let result = commit(&pool, &xml, &mappings).await.unwrap();
    assert_eq!((result.tracks_imported, result.plays_added), (1, 4));
    assert_eq!(tracks(&pool).await[0].play_count, 4);
}
