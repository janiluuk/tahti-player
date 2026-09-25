use sqlx::sqlite::SqlitePool;

use super::test_support::{pool, seed_generated_rows, seed_varied_rows, write_wav, write_wav_tagged};
use super::{
    facets, filter_options, folder_of, import_paths, list, list_filtered, list_query, matching_ids,
    matching_ids_query, order_ids, prepare_playback, remove, totals, Availability, FacetFilter,
    FacetKind, ListQuery, SortColumn, TrackFilters, TrackSort,
};

const ALL_SORTS: [SortColumn; 11] = [
    SortColumn::Title,
    SortColumn::Artist,
    SortColumn::Album,
    SortColumn::Genre,
    SortColumn::Year,
    SortColumn::TrackNo,
    SortColumn::Duration,
    SortColumn::Format,
    SortColumn::Size,
    SortColumn::Bitrate,
    SortColumn::Added,
];

#[tokio::test]
async fn list_filters_by_search_across_fields() {
    let dir = tempfile::tempdir().unwrap();
    let a = dir.path().join("a.wav");
    let b = dir.path().join("b.wav");
    write_wav(&a, "Alpha", "Band One");
    write_wav(&b, "Beta", "Band Two");

    let pool = pool().await;
    import_paths(&pool, vec![a, b]).await;

    let page = list(&pool, "Band One", 0).await.unwrap();
    assert_eq!(page.total, 1);
    assert_eq!(page.tracks[0].title, "Alpha");
}

#[tokio::test]
async fn list_search_escapes_sql_wildcards() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("song.wav");
    write_wav(&path, "100% Real", "Artist");

    let pool = pool().await;
    import_paths(&pool, vec![path]).await;

    assert_eq!(list(&pool, "100% Real", 0).await.unwrap().total, 1);
    assert_eq!(list(&pool, "100_ Real", 0).await.unwrap().total, 0);
}

#[tokio::test]
async fn paginates_and_searches_1k_generated_rows() {
    let pool = pool().await;
    seed_generated_rows(&pool, 1_000).await;

    let page = list(&pool, "", 0).await.unwrap();
    assert_eq!(page.total, 1_000);
    assert_eq!(page.tracks.len(), 100, "list() pages at 100 rows");

    // Titles are zero-padded per-row ("Generated Track 000007"), so this
    // substring is unambiguous — unlike artist/album, which repeat every
    // 250/40 rows and would need modular arithmetic to hand-count.
    let filtered = list(&pool, "000007", 0).await.unwrap();
    assert_eq!(filtered.total, 1);
    assert_eq!(filtered.tracks[0].title, "Generated Track 000007");
}

#[tokio::test]
async fn paginates_10k_generated_rows() {
    let pool = pool().await;
    seed_generated_rows(&pool, 10_000).await;

    let page = list(&pool, "", 0).await.unwrap();
    assert_eq!(page.total, 10_000);

    let last_page = list(&pool, "", 9_900).await.unwrap();
    assert_eq!(last_page.tracks.len(), 100);
}

/// 100k-row fixture: real, deterministic, and exercised on demand rather
/// than on every `cargo test` run — matches the plan's "generated metadata
/// fixtures at 1k/10k/100k rows" without adding ~100k-row insert latency to
/// the default test suite. Run explicitly with:
/// `cargo test --package tahti-player -- --ignored paginates_100k_generated_rows`
#[tokio::test]
#[ignore = "100k-row insert is slow; run explicitly, not on every `cargo test`"]
async fn paginates_100k_generated_rows() {
    let pool = pool().await;
    seed_generated_rows(&pool, 100_000).await;

    let started = std::time::Instant::now();
    let page = list(&pool, "", 0).await.unwrap();
    let browse = started.elapsed();
    assert_eq!(page.total, 100_000);

    let started = std::time::Instant::now();
    let found = list(&pool, "Track 099999", 0).await.unwrap();
    let search = started.elapsed();
    assert_eq!(found.total, 1);

    let mut facet_times = Vec::new();
    for kind in [FacetKind::Artists, FacetKind::Albums, FacetKind::Genres, FacetKind::Folders] {
        let started = std::time::Instant::now();
        let groups = facets(&pool, kind).await.unwrap();
        facet_times.push((kind, groups.len(), started.elapsed()));
    }
    let started = std::time::Instant::now();
    let artist_filter = FacetFilter { kind: FacetKind::Artists, value: "Generated Artist 007".into(), secondary: None };
    let filtered = list_filtered(&pool, "", Some(&artist_filter), None, 0).await.unwrap();
    let filter_time = started.elapsed();
    let mut sort_times = Vec::new();
    for column in ALL_SORTS {
        let sort = TrackSort { column, descending: false };
        let started = std::time::Instant::now();
        list_filtered(&pool, "", None, Some(&sort), 0).await.unwrap();
        list_filtered(&pool, "", None, Some(&sort), 50_000).await.unwrap();
        sort_times.push((column, started.elapsed()));
    }
    eprintln!("100k sorts (first page + page 500): {sort_times:?}");
    for column in [SortColumn::Artist, SortColumn::Album] {
        let sort = TrackSort { column, descending: true };
        let started = std::time::Instant::now();
        list_filtered(&pool, "", None, Some(&sort), 50_000).await.unwrap();
        let took = started.elapsed();
        eprintln!("100k {column:?} descending page 500: {took:?}");
        assert!(took.as_millis() < 100, "indexed {column:?} desc sort took {took:?}");
    }
    for (column, took) in &sort_times {
        assert!(took.as_millis() < 1500, "{column:?} sort took {took:?}");
    }
    eprintln!("100k rows: first page {browse:?}, indexed search {search:?}, facets {facet_times:?}, filtered page ({} rows) {filter_time:?}", filtered.total);
    for (kind, _, took) in &facet_times {
        assert!(took.as_millis() < 1500, "{kind:?} facets took {took:?}");
    }
    // Generous ceilings (debug build, shared CI); the point is "not a scan".
    assert!(browse.as_millis() < 500, "browse took {browse:?}");
    assert!(search.as_millis() < 250, "search took {search:?}");
}

#[tokio::test]
async fn search_matches_substrings_case_insensitively_via_the_index() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("song.wav");
    write_wav(&path, "Harbour Lights", "Vladislav Delay");
    let pool = pool().await;
    import_paths(&pool, vec![path]).await;

    assert_eq!(list(&pool, "arbour", 0).await.unwrap().total, 1);
    assert_eq!(list(&pool, "VLADIS", 0).await.unwrap().total, 1);
    assert_eq!(list(&pool, "harbour delay", 0).await.unwrap().total, 1, "terms AND across columns");
    assert_eq!(list(&pool, "harbour nothing", 0).await.unwrap().total, 0);
    // Short terms fall back to the LIKE scan and still match.
    assert_eq!(list(&pool, "Vl", 0).await.unwrap().total, 1);
}

#[tokio::test]
async fn search_index_follows_updates_and_deletes() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("song.wav");
    write_wav(&path, "Before Title", "Artist");
    let pool = pool().await;
    import_paths(&pool, vec![path.clone()]).await;
    assert_eq!(list(&pool, "Before", 0).await.unwrap().total, 1);

    // Re-import with new tags upserts the row; the index must follow.
    write_wav(&path, "After Title", "Artist");
    import_paths(&pool, vec![path]).await;
    assert_eq!(list(&pool, "Before", 0).await.unwrap().total, 0);
    assert_eq!(list(&pool, "After", 0).await.unwrap().total, 1);

    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();
    remove(&pool, &id).await.unwrap();
    assert_eq!(list(&pool, "After", 0).await.unwrap().total, 0);
}

#[tokio::test]
async fn search_survives_fts_syntax_in_user_input() {
    let pool = pool().await;
    seed_generated_rows(&pool, 10).await;
    for query in ["\"quoted\"", "a OR b NOT c", "title:foo*", "(((", "\"\"\""] {
        assert!(list(&pool, query, 0).await.is_ok(), "query {query:?} must not error");
    }
}

async fn browse_fixture() -> (tempfile::TempDir, SqlitePool) {
    let dir = tempfile::tempdir().unwrap();
    let a = dir.path().join("Anima");
    let b = dir.path().join("Loose");
    std::fs::create_dir_all(&a).unwrap();
    std::fs::create_dir_all(&b).unwrap();
    // Two tracks of one album (artist differs by case), one compilation
    // track whose album artist overrides its artist, one untagged-genre loose file.
    write_wav_tagged(&a.join("1.wav"), &[("INAM", "One"), ("IART", "Vladislav Delay"), ("IPRD", "Anima"), ("IGNR", "Dub Techno"), ("ICRD", "2001")]);
    write_wav_tagged(&a.join("2.wav"), &[("INAM", "Two"), ("IART", "VLADISLAV DELAY"), ("IPRD", "Anima"), ("IGNR", "dub techno"), ("ICRD", "2001")]);
    write_wav_tagged(&b.join("3.wav"), &[("INAM", "Three"), ("IART", "Guest"), ("IPRD", "Anima"), ("IGNR", "Ambient")]);
    write_wav_tagged(&b.join("4.wav"), &[("INAM", "Four"), ("IART", "Solo")]);
    let pool = pool().await;
    let paths = ["Anima/1.wav", "Anima/2.wav", "Loose/3.wav", "Loose/4.wav"]
        .map(|p| dir.path().join(p))
        .to_vec();
    let result = import_paths(&pool, paths).await;
    assert_eq!(result.imported, 4, "{:?}", result.errors);
    (dir, pool)
}

#[test]
fn folder_of_keeps_the_trailing_separator_in_either_style() {
    assert_eq!(folder_of("/music/a/b.flac"), "/music/a/");
    assert_eq!(folder_of("C:\\music\\a\\b.flac"), "C:\\music\\a\\");
    assert_eq!(folder_of("bare.flac"), "");
}

#[tokio::test]
async fn facets_group_artists_case_insensitively_with_totals() {
    let (_dir, pool) = browse_fixture().await;
    let artists = facets(&pool, FacetKind::Artists).await.unwrap();
    let names: Vec<&str> = artists.iter().map(|g| g.name.as_str()).collect();
    assert_eq!(names.len(), 3, "{names:?}");
    let delay = artists.iter().find(|g| g.name.eq_ignore_ascii_case("vladislav delay")).unwrap();
    assert_eq!(delay.track_count, 2);
    assert!(delay.size_bytes > 0 && delay.duration_sec > 0.0);

    let all = totals(&pool).await.unwrap();
    assert_eq!(all.track_count, 4);
    assert_eq!(all.size_bytes, artists.iter().map(|g| g.size_bytes).sum::<i64>());
}

#[tokio::test]
async fn facets_cover_albums_genres_and_folders() {
    let (_dir, pool) = browse_fixture().await;
    let albums = facets(&pool, FacetKind::Albums).await.unwrap();
    let anima: Vec<_> = albums.iter().filter(|g| g.name == "Anima").collect();
    assert_eq!(anima.len(), 2, "same album name under different artists stays separate");
    assert!(anima.iter().any(|g| g.track_count == 2 && g.year == Some(2001)));

    let genres = facets(&pool, FacetKind::Genres).await.unwrap();
    let dub = genres.iter().find(|g| g.name.eq_ignore_ascii_case("dub techno")).unwrap();
    assert_eq!(dub.track_count, 2, "genre grouping ignores case");
    assert!(genres.iter().any(|g| g.name.is_empty()), "untagged tracks form an unknown group");

    let folders = facets(&pool, FacetKind::Folders).await.unwrap();
    assert_eq!(folders.len(), 2);
    assert!(folders.iter().all(|g| g.name.ends_with('/') || g.name.ends_with('\\')));
}

#[tokio::test]
async fn list_filtered_narrows_by_each_facet_and_combines_with_search() {
    let (_dir, pool) = browse_fixture().await;
    let artist = FacetFilter { kind: FacetKind::Artists, value: "vladislav delay".into(), secondary: None };
    assert_eq!(list_filtered(&pool, "", Some(&artist), None, 0).await.unwrap().total, 2);
    assert_eq!(list_filtered(&pool, "Two", Some(&artist), None, 0).await.unwrap().total, 1);
    assert_eq!(list_filtered(&pool, "Three", Some(&artist), None, 0).await.unwrap().total, 0);

    let album = FacetFilter { kind: FacetKind::Albums, value: "Anima".into(), secondary: Some("Guest".into()) };
    let page = list_filtered(&pool, "", Some(&album), None, 0).await.unwrap();
    assert_eq!((page.total, page.tracks[0].title.as_str()), (1, "Three"));

    let genre = FacetFilter { kind: FacetKind::Genres, value: "Ambient".into(), secondary: None };
    assert_eq!(list_filtered(&pool, "", Some(&genre), None, 0).await.unwrap().total, 1);
    let unknown = FacetFilter { kind: FacetKind::Genres, value: String::new(), secondary: None };
    assert_eq!(list_filtered(&pool, "", Some(&unknown), None, 0).await.unwrap().total, 1);

    let folder = facets(&pool, FacetKind::Folders).await.unwrap().remove(0).name;
    let in_folder = FacetFilter { kind: FacetKind::Folders, value: folder, secondary: None };
    assert_eq!(list_filtered(&pool, "", Some(&in_folder), None, 0).await.unwrap().total, 2);
}

#[tokio::test]
async fn every_sort_column_runs_in_both_directions() {
    let (_dir, pool) = browse_fixture().await;
    for column in ALL_SORTS {
        for descending in [false, true] {
            let sort = TrackSort { column, descending };
            let page = list_filtered(&pool, "", None, Some(&sort), 0).await;
            assert_eq!(page.unwrap().total, 4, "{column:?} desc={descending}");
        }
    }
}

#[tokio::test]
async fn sorting_puts_blank_values_last_in_both_directions() {
    let (_dir, pool) = browse_fixture().await;
    // Genres: two "dub techno", "Ambient", and one blank (Solo).
    for descending in [false, true] {
        let sort = TrackSort { column: SortColumn::Genre, descending };
        let tracks = list_filtered(&pool, "", None, Some(&sort), 0).await.unwrap().tracks;
        assert_eq!(tracks.last().unwrap().title, "Four", "desc={descending}");
    }
    let asc = TrackSort { column: SortColumn::Genre, descending: false };
    let titles: Vec<String> = list_filtered(&pool, "", None, Some(&asc), 0).await.unwrap().tracks.into_iter().map(|t| t.title).collect();
    assert_eq!(titles[0], "Three", "Ambient sorts before Dub Techno");
    // Year: 2001 twice, NULL twice.
    for descending in [false, true] {
        let sort = TrackSort { column: SortColumn::Year, descending };
        let tracks = list_filtered(&pool, "", None, Some(&sort), 0).await.unwrap().tracks;
        assert!(tracks[0].year.is_some() && tracks[3].year.is_none(), "desc={descending}");
    }
}

#[tokio::test]
async fn descending_reverses_the_primary_order() {
    let (_dir, pool) = browse_fixture().await;
    let by = |descending| TrackSort { column: SortColumn::Title, descending };
    let asc: Vec<String> = list_filtered(&pool, "", None, Some(&by(false)), 0).await.unwrap().tracks.into_iter().map(|t| t.title).collect();
    let mut desc: Vec<String> = list_filtered(&pool, "", None, Some(&by(true)), 0).await.unwrap().tracks.into_iter().map(|t| t.title).collect();
    desc.reverse();
    assert_eq!(asc, desc);
}

#[tokio::test]
async fn paging_a_sort_with_many_ties_neither_repeats_nor_skips_rows() {
    let pool = pool().await;
    seed_generated_rows(&pool, 450).await; // artists repeat every 250 rows, albums every 40
    for column in [SortColumn::Artist, SortColumn::Album, SortColumn::Format, SortColumn::Year] {
        for descending in [false, true] {
            let sort = TrackSort { column, descending };
            let mut seen = std::collections::HashSet::new();
            let mut offset = 0;
            loop {
                let page = list_filtered(&pool, "", None, Some(&sort), offset).await.unwrap();
                if page.tracks.is_empty() {
                    break;
                }
                offset += page.tracks.len() as i64;
                for track in page.tracks {
                    assert!(seen.insert(track.id), "{column:?} repeated a row");
                }
            }
            assert_eq!(seen.len(), 450, "{column:?} desc={descending} skipped rows");
        }
    }
}

#[tokio::test]
async fn order_ids_matches_the_paging_order_and_skips_unknown_ids() {
    let pool = pool().await;
    seed_generated_rows(&pool, 60).await;
    let sort = TrackSort { column: SortColumn::Artist, descending: true };
    let all = matching_ids(&pool, "", None, Some(&sort)).await.unwrap();
    // Pick a few scattered ids in a scrambled order, plus one that doesn't exist.
    let mut picked = vec![all[40].clone(), all[3].clone(), "no-such-id".to_owned(), all[17].clone()];
    let ordered = order_ids(&pool, &picked, Some(&sort)).await.unwrap();
    assert_eq!(ordered, vec![all[3].clone(), all[17].clone(), all[40].clone()]);
    picked.clear();
    assert!(order_ids(&pool, &picked, None).await.unwrap().is_empty());
}

#[tokio::test]
async fn matching_ids_follow_the_exact_paging_order_for_any_sort_search_and_filter() {
    let pool = pool().await;
    seed_generated_rows(&pool, 450).await;
    let artist = FacetFilter { kind: FacetKind::Artists, value: "Generated Artist 007".into(), secondary: None };
    let cases: [(&str, Option<&FacetFilter>, Option<TrackSort>); 4] = [
        ("", None, None),
        ("Track 00", None, Some(TrackSort { column: SortColumn::Artist, descending: true })),
        ("", Some(&artist), Some(TrackSort { column: SortColumn::Album, descending: false })),
        ("Generated", None, Some(TrackSort { column: SortColumn::Size, descending: true })),
    ];
    for (search, filter, sort) in cases {
        let ids = matching_ids(&pool, search, filter, sort.as_ref()).await.unwrap();
        let mut paged = Vec::new();
        let mut offset = 0;
        loop {
            let page = list_filtered(&pool, search, filter, sort.as_ref(), offset).await.unwrap();
            if page.tracks.is_empty() {
                break;
            }
            offset += page.tracks.len() as i64;
            paged.extend(page.tracks.into_iter().map(|t| t.id));
        }
        assert_eq!(ids, paged, "search={search:?} sort={sort:?}");
        assert_eq!(
            ids.len() as i64,
            list_filtered(&pool, search, filter, sort.as_ref(), 0).await.unwrap().total
        );
    }
}

#[tokio::test]
async fn prepare_playback_keeps_requested_order_and_skips_missing_files() {
    let dir = tempfile::tempdir().unwrap();
    let paths: Vec<_> = ["a", "b", "c"].iter().map(|n| dir.path().join(format!("{n}.wav"))).collect();
    for (path, title) in paths.iter().zip(["A", "B", "C"]) {
        write_wav(path, title, "Artist");
    }
    let pool = pool().await;
    import_paths(&pool, paths.clone()).await;
    let mut id_of = std::collections::HashMap::new();
    for track in list(&pool, "", 0).await.unwrap().tracks {
        id_of.insert(track.title.clone(), track.id);
    }
    let (a, b, c) = (id_of["A"].clone(), id_of["B"].clone(), id_of["C"].clone());
    std::fs::remove_file(&paths[1]).unwrap();

    let ids = vec![c.clone(), b.clone(), "no-such-id".to_string(), a.clone()];
    let batch = prepare_playback(&pool, &ids).await.unwrap();

    let titles: Vec<&str> = batch.items.iter().map(|i| i.track.title.as_str()).collect();
    assert_eq!(titles, ["C", "A"], "requested order, missing and unknown skipped");
    assert_eq!(batch.unavailable, 1);
    assert!(batch.items.iter().all(|i| std::path::Path::new(&i.path).is_file()));
    let all = list(&pool, "", 0).await.unwrap().tracks;
    let missing = all.iter().find(|t| t.id == b).unwrap();
    assert!(!missing.available, "missing state persisted");
}

#[tokio::test]
async fn prepare_playback_handles_more_ids_than_one_sql_chunk() {
    let pool = pool().await;
    seed_generated_rows(&pool, 1_200).await;
    let ids = matching_ids(&pool, "", None, None).await.unwrap();
    let batch = prepare_playback(&pool, &ids).await.unwrap();
    // Generated rows point at files that do not exist, so all are unavailable --
    // the point is that every chunk was read and accounted for.
    assert_eq!(batch.items.len() + batch.unavailable, 1_200);
}

async fn count_with(pool: &SqlitePool, filters: TrackFilters) -> i64 {
    let query = ListQuery { filters: Some(&filters), ..Default::default() };
    list_query(pool, &query, 0).await.unwrap().total
}

#[tokio::test]
async fn each_range_filter_restricts_and_unset_filters_do_not() {
    let pool = pool().await;
    seed_varied_rows(&pool, 700).await;
    let all = count_with(&pool, TrackFilters::default()).await;
    assert_eq!(all, 700);

    let years = count_with(&pool, TrackFilters { year_min: Some(2000), year_max: Some(2004), ..Default::default() }).await;
    assert_eq!(years, 700 / 35 * 5, "5 of 35 years");
    assert_eq!(count_with(&pool, TrackFilters { year_min: Some(2100), ..Default::default() }).await, 0);

    let long = count_with(&pool, TrackFilters { duration_min: Some(300.0), ..Default::default() }).await;
    let short = count_with(&pool, TrackFilters { duration_max: Some(299.9), ..Default::default() }).await;
    assert_eq!(long + short, 700);

    assert_eq!(count_with(&pool, TrackFilters { formats: vec!["FLAC".into()], ..Default::default() }).await, 234, "case-insensitive format");
    assert_eq!(count_with(&pool, TrackFilters { formats: vec!["flac".into(), "wav".into()], ..Default::default() }).await, 467);
    assert!(count_with(&pool, TrackFilters { bitrate_min: Some(1000), ..Default::default() }).await < all);
    assert_eq!(count_with(&pool, TrackFilters { added_since: Some("2000-01-01".into()), ..Default::default() }).await, all);
    assert_eq!(count_with(&pool, TrackFilters { added_since: Some("2999-01-01".into()), ..Default::default() }).await, 0);
    assert_eq!(count_with(&pool, TrackFilters { availability: Some(Availability::Available), ..Default::default() }).await, all);
    assert_eq!(count_with(&pool, TrackFilters { availability: Some(Availability::Missing), ..Default::default() }).await, 0);
    assert_eq!(count_with(&pool, TrackFilters { root_id: Some("nope".into()), ..Default::default() }).await, 0);
}

#[tokio::test]
async fn filters_combine_with_search_and_a_browse_group() {
    let pool = pool().await;
    seed_varied_rows(&pool, 700).await;
    let artist = FacetFilter { kind: FacetKind::Artists, value: "Varied Artist 7".into(), secondary: None };
    let filters = TrackFilters { formats: vec!["wav".into()], ..Default::default() };
    let query = ListQuery { search: "Varied Track", filter: Some(&artist), filters: Some(&filters), sort: None };
    let page = list_query(&pool, &query, 0).await.unwrap();
    assert!(page.total > 0);
    assert!(page.tracks.iter().all(|t| t.artist == "Varied Artist 7" && t.format == "wav"));
    let none = ListQuery { search: "no such text", ..query };
    assert_eq!(list_query(&pool, &none, 0).await.unwrap().total, 0);
}

#[tokio::test]
async fn filter_options_list_formats_and_year_span() {
    let pool = pool().await;
    assert_eq!(filter_options(&pool).await.unwrap().year_min, None);
    seed_varied_rows(&pool, 100).await;
    let options = filter_options(&pool).await.unwrap();
    assert_eq!(options.formats, ["flac", "mp3", "wav"]);
    assert_eq!((options.year_min, options.year_max), (Some(1990), Some(2024)));
}

/// Phase 2 exit demo on a 10k fixture: artist + format + year filters, sort by
/// album/disc/track, select all matches across pages, queue in displayed order.
#[tokio::test]
async fn exit_demo_filter_sort_select_all_in_displayed_order() {
    let pool = pool().await;
    seed_varied_rows(&pool, 10_000).await;
    let filter = FacetFilter { kind: FacetKind::Genres, value: "Techno".into(), secondary: None };
    let filters = TrackFilters {
        formats: vec!["wav".into(), "flac".into()],
        year_min: Some(2000),
        year_max: Some(2010),
        ..Default::default()
    };
    let sort = TrackSort { column: SortColumn::Album, descending: false };
    let query = ListQuery { search: "", filter: Some(&filter), filters: Some(&filters), sort: Some(&sort) };

    let ids = matching_ids_query(&pool, &query).await.unwrap();
    let first_page = list_query(&pool, &query, 0).await.unwrap();
    assert_eq!(ids.len() as i64, first_page.total, "select-all covers every page");
    assert!(ids.len() > 100, "spans several pages: {}", ids.len());

    // Displayed order: album, then disc, then track.
    let mut rows = Vec::new();
    let mut offset = 0;
    loop {
        let page = list_query(&pool, &query, offset).await.unwrap();
        if page.tracks.is_empty() {
            break;
        }
        offset += page.tracks.len() as i64;
        rows.extend(page.tracks);
    }
    assert_eq!(rows.iter().map(|t| t.id.clone()).collect::<Vec<_>>(), ids);
    let key = |t: &super::LibraryTrack| (t.album.to_lowercase(), t.disc_no, t.track_no);
    assert!(rows.windows(2).all(|w| key(&w[0]) <= key(&w[1])), "album/disc/track order");
    assert!(rows.iter().all(|t| t.genre == "Techno" && (2000..=2010).contains(&t.year.unwrap())));

    let batch = super::prepare_playback(&pool, &ids[..50]).await.unwrap();
    assert_eq!(batch.items.len() + batch.unavailable, 50);
}
