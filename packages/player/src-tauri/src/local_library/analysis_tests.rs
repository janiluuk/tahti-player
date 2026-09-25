use std::path::Path;
use std::sync::atomic::Ordering;
use std::sync::Arc;

use sqlx::SqlitePool;

use super::analysis::{analyze_tracks, clear_analysis, detail, restore_corrections, set_corrections, AnalysisControl};
use super::catalog::{add_tag, record_play, set_rating};
use super::smart_playlists::{evaluate_ids, snapshot, save_smart, RuleField, RuleOp, SmartDefinition, SmartRule};
use super::test_support::pool;
use super::{import_paths, list_query, AnalysisState, ListQuery, LibraryTrack, SortColumn, TrackFilters, TrackSort};

const RATE: u32 = 44_100;

/// Mono PCM16 WAV with a kick every beat at `bpm` (plus a `genre` INFO tag).
pub(super) fn write_kick_wav(path: &Path, bpm: f64, seconds: f64, genre: &str) {
    let total = (seconds * f64::from(RATE)) as usize;
    let mut samples = vec![0i16; total];
    let beat = 60.0 / bpm * f64::from(RATE);
    let mut at = 0.0;
    while (at as usize) < total {
        let start = at as usize;
        for i in 0..4000.min(total - start) {
            let t = i as f64 / f64::from(RATE);
            let v = (2.0 * std::f64::consts::PI * 55.0 * t).sin() * (-t * 35.0).exp() * 0.8;
            samples[start + i] = (v * 32767.0) as i16;
        }
        at += beat;
    }
    let data_len = (samples.len() * 2) as u32;
    let mut info = b"INFO".to_vec();
    let mut value = genre.as_bytes().to_vec();
    value.push(0);
    let len = value.len() as u32;
    if value.len() % 2 != 0 {
        value.push(0);
    }
    info.extend_from_slice(b"IGNR");
    info.extend_from_slice(&len.to_le_bytes());
    info.extend_from_slice(&value);
    let mut bytes = b"RIFF".to_vec();
    bytes.extend_from_slice(&(4 + 24 + 8 + info.len() as u32 + 8 + data_len).to_le_bytes());
    bytes.extend_from_slice(b"WAVEfmt ");
    bytes.extend_from_slice(&16u32.to_le_bytes());
    bytes.extend_from_slice(&1u16.to_le_bytes());
    bytes.extend_from_slice(&1u16.to_le_bytes());
    bytes.extend_from_slice(&RATE.to_le_bytes());
    bytes.extend_from_slice(&(RATE * 2).to_le_bytes());
    bytes.extend_from_slice(&2u16.to_le_bytes());
    bytes.extend_from_slice(&16u16.to_le_bytes());
    bytes.extend_from_slice(b"LIST");
    bytes.extend_from_slice(&(info.len() as u32).to_le_bytes());
    bytes.extend_from_slice(&info);
    bytes.extend_from_slice(b"data");
    bytes.extend_from_slice(&data_len.to_le_bytes());
    for s in samples {
        bytes.extend_from_slice(&s.to_le_bytes());
    }
    std::fs::write(path, bytes).unwrap();
}

async fn tracks(pool: &SqlitePool) -> Vec<LibraryTrack> {
    let query = ListQuery { search: "", filter: None, filters: None, sort: None };
    list_query(pool, &query, 0).await.unwrap().tracks
}

async fn id_of(pool: &SqlitePool, file: &str) -> String {
    tracks(pool).await.into_iter().find(|t| t.path.ends_with(file)).unwrap().id
}

fn control() -> Arc<AnalysisControl> {
    Arc::new(AnalysisControl::default())
}

/// house.wav @128, slow.wav @90, both 20 s; returns (pool, dir).
async fn library() -> (SqlitePool, tempfile::TempDir) {
    let dir = tempfile::tempdir().unwrap();
    write_kick_wav(&dir.path().join("house.wav"), 128.0, 20.0, "House");
    write_kick_wav(&dir.path().join("slow.wav"), 90.0, 20.0, "Ambient");
    let pool = pool().await;
    let result = import_paths(&pool, vec![dir.path().join("house.wav"), dir.path().join("slow.wav")]).await;
    assert_eq!(result.imported, 2);
    (pool, dir)
}

#[tokio::test]
async fn analysis_fills_results_then_reuses_them_and_reanalyzes_only_on_force() {
    let (pool, _dir) = library().await;
    let control = control();
    let first = analyze_tracks(&pool, &[], false, &control, &|_| {}).await.unwrap();
    assert_eq!((first.analyzed, first.reused, first.failed, first.cancelled), (2, 0, 0, false));

    let house = id_of(&pool, "house.wav").await;
    let d = detail(&pool, &house).await.unwrap();
    assert!(d.analyzed && !d.stale);
    assert_eq!(d.peaks.len(), 400);
    assert!(d.peaks.iter().any(|&p| p > 100));
    assert!(d.loudness_lufs.is_some() || d.true_peak_dbtp.is_some());
    assert!((d.bpm_estimate.unwrap() - 128.0).abs() < 2.5, "{:?}", d.bpm_estimate);
    assert_eq!(d.bpm, d.bpm_estimate, "the estimate is what filters see until something better exists");

    let second = analyze_tracks(&pool, &[], false, &control, &|_| {}).await.unwrap();
    assert_eq!((second.analyzed, second.reused), (0, 2));
    let forced = analyze_tracks(&pool, std::slice::from_ref(&house), true, &control, &|_| {}).await.unwrap();
    assert_eq!((forced.analyzed, forced.reused), (1, 0));
}

#[tokio::test]
async fn a_changed_file_is_analyzed_again_and_reported_stale_meanwhile() {
    let (pool, dir) = library().await;
    let control = control();
    analyze_tracks(&pool, &[], false, &control, &|_| {}).await.unwrap();
    let slow = id_of(&pool, "slow.wav").await;
    write_kick_wav(&dir.path().join("slow.wav"), 100.0, 21.0, "Ambient");
    assert!(detail(&pool, &slow).await.unwrap().stale);
    let again = analyze_tracks(&pool, &[], false, &control, &|_| {}).await.unwrap();
    assert_eq!((again.analyzed, again.reused), (1, 1));
    assert!(!detail(&pool, &slow).await.unwrap().stale);
}

#[tokio::test]
async fn cancel_stops_the_job_and_a_rerun_resumes_from_saved_results() {
    let (pool, _dir) = library().await;
    let control = control();
    let house = id_of(&pool, "house.wav").await;
    analyze_tracks(&pool, &[house], false, &control, &|_| {}).await.unwrap();

    control.cancel.store(true, Ordering::SeqCst);
    let stopped = analyze_tracks(&pool, &[], false, &control, &|_| {}).await.unwrap();
    assert!(stopped.cancelled);
    assert_eq!(stopped.analyzed, 0);

    control.cancel.store(false, Ordering::SeqCst);
    let resumed = analyze_tracks(&pool, &[], false, &control, &|_| {}).await.unwrap();
    assert_eq!((resumed.analyzed, resumed.reused, resumed.cancelled), (1, 1, false));
}

#[tokio::test]
async fn progress_reports_every_track() {
    let (pool, _dir) = library().await;
    let seen = std::sync::Mutex::new(Vec::new());
    analyze_tracks(&pool, &[], false, &control(), &|p| seen.lock().unwrap().push((p.done, p.total))).await.unwrap();
    let seen = seen.into_inner().unwrap();
    assert_eq!(seen.last(), Some(&(2, 2)));
    assert!(seen.iter().all(|&(_, total)| total == 2));
}

#[tokio::test]
async fn corrections_beat_tags_beat_estimates_and_undo_restores() {
    let (pool, _dir) = library().await;
    analyze_tracks(&pool, &[], false, &control(), &|_| {}).await.unwrap();
    let house = id_of(&pool, "house.wav").await;
    let ids = vec![house.clone()];
    let estimate = detail(&pool, &house).await.unwrap().bpm_estimate.unwrap();

    // A tag value outranks the estimate...
    sqlx::query("UPDATE library_analysis SET tag_bpm = 126.0, tag_key = 'Am' WHERE track_id = ?").bind(&house).execute(&pool).await.unwrap();
    super::analysis::refresh_effective(&pool, &ids).await.unwrap();
    let d = detail(&pool, &house).await.unwrap();
    assert_eq!((d.bpm, d.key.as_deref()), (Some(126.0), Some("Am")));
    assert_eq!(d.bpm_estimate, Some(estimate), "the estimate is kept, not overwritten");

    // ...and a correction outranks the tag.
    let undo = set_corrections(&pool, &ids, Some(64.0 * 2.0 + 1.5), Some("F# minor")).await.unwrap();
    let d = detail(&pool, &house).await.unwrap();
    assert_eq!((d.bpm, d.key.as_deref(), d.user_bpm), (Some(129.5), Some("F#m"), Some(129.5)));
    assert_eq!(d.tag_bpm, Some(126.0));

    restore_corrections(&pool, &undo).await.unwrap();
    let d = detail(&pool, &house).await.unwrap();
    assert_eq!((d.bpm, d.user_bpm, d.user_key), (Some(126.0), None, None));

    // Clearing a correction, and rejecting nonsense.
    set_corrections(&pool, &ids, Some(100.0), None).await.unwrap();
    set_corrections(&pool, &ids, Some(0.0), None).await.unwrap();
    assert_eq!(detail(&pool, &house).await.unwrap().user_bpm, None);
    assert!(set_corrections(&pool, &ids, Some(999.0), None).await.is_err());
    assert!(set_corrections(&pool, &ids, None, Some("H flat")).await.is_err());
}

#[tokio::test]
async fn a_correction_survives_reanalysis_and_clearing_analysis_keeps_it() {
    let (pool, _dir) = library().await;
    let control = control();
    analyze_tracks(&pool, &[], false, &control, &|_| {}).await.unwrap();
    let house = id_of(&pool, "house.wav").await;
    set_corrections(&pool, std::slice::from_ref(&house), Some(64.0), None).await.unwrap();
    analyze_tracks(&pool, std::slice::from_ref(&house), true, &control, &|_| {}).await.unwrap();
    assert_eq!(detail(&pool, &house).await.unwrap().bpm, Some(64.0));
    clear_analysis(&pool, std::slice::from_ref(&house)).await.unwrap();
    let d = detail(&pool, &house).await.unwrap();
    assert!(!d.analyzed);
    assert_eq!(d.bpm, Some(64.0));
}

#[tokio::test]
async fn filters_and_sorts_use_the_effective_values() {
    let (pool, _dir) = library().await;
    let all = tracks(&pool).await;
    let filtered = |filters: TrackFilters, sort: Option<TrackSort>| {
        let pool = pool.clone();
        async move {
            let query = ListQuery { search: "", filter: None, filters: Some(&filters), sort: sort.as_ref() };
            list_query(&pool, &query, 0).await.unwrap().tracks.len()
        }
    };
    assert_eq!(filtered(TrackFilters { analysis: Some(AnalysisState::Unanalyzed), ..Default::default() }, None).await, all.len());
    assert_eq!(filtered(TrackFilters { analysis: Some(AnalysisState::Analyzed), ..Default::default() }, None).await, 0);

    analyze_tracks(&pool, &[], false, &control(), &|_| {}).await.unwrap();
    assert_eq!(filtered(TrackFilters { analysis: Some(AnalysisState::Analyzed), ..Default::default() }, None).await, 2);
    assert_eq!(filtered(TrackFilters { bpm_min: Some(120.0), bpm_max: Some(135.0), ..Default::default() }, None).await, 1);
    assert_eq!(filtered(TrackFilters { bpm_max: Some(100.0), ..Default::default() }, None).await, 1);

    let sort = TrackSort { column: SortColumn::Bpm, descending: false };
    let query = ListQuery { search: "", filter: None, filters: None, sort: Some(&sort) };
    let ordered = list_query(&pool, &query, 0).await.unwrap().tracks;
    assert!(ordered[0].path.ends_with("slow.wav") && ordered[1].path.ends_with("house.wav"));
}

fn rule(field: RuleField, op: RuleOp, value: &str, value2: &str) -> SmartRule {
    SmartRule { field, op, value: value.into(), value2: value2.into() }
}

fn definition(rules: Vec<SmartRule>, match_all: bool) -> SmartDefinition {
    SmartDefinition { name: "Set".into(), match_all, rules, sort: SortColumn::Title, descending: false, limit: None }
}

#[tokio::test]
async fn smart_playlist_exit_demo_house_120_to_128_rated_not_played_in_30_days_updates_live() {
    let (pool, _dir) = library().await;
    analyze_tracks(&pool, &[], false, &control(), &|_| {}).await.unwrap();
    let house = id_of(&pool, "house.wav").await;
    let slow = id_of(&pool, "slow.wav").await;

    let def = definition(
        vec![
            rule(RuleField::Genre, RuleOp::Is, "house", ""),
            rule(RuleField::Bpm, RuleOp::Between, "120", "128.9"),
            rule(RuleField::Rating, RuleOp::AtLeast, "4", ""),
            rule(RuleField::LastPlayed, RuleOp::NotInLastDays, "30", ""),
        ],
        true,
    );
    let saved = save_smart(&pool, None, &def).await.unwrap();
    let live = || async { evaluate_ids(&pool, &saved.definition).await.unwrap() };

    assert!(live().await.is_empty(), "unrated so far");
    set_rating(&pool, std::slice::from_ref(&house), 5).await.unwrap();
    assert_eq!(live().await, vec![house.clone()], "rating it adds it");

    record_play(&pool, &house).await.unwrap();
    assert!(live().await.is_empty(), "playing it today removes it");

    sqlx::query("UPDATE library_tracks SET last_played_at = datetime('now', '-40 days') WHERE id = ?").bind(&house).execute(&pool).await.unwrap();
    assert_eq!(live().await, vec![house.clone()], "back after 40 quiet days");

    set_corrections(&pool, std::slice::from_ref(&house), Some(140.0), None).await.unwrap();
    assert!(live().await.is_empty(), "a BPM correction moves it out of the range");
    let _ = slow;
}

#[tokio::test]
async fn smart_rules_any_tags_limit_sort_and_snapshot() {
    let (pool, _dir) = library().await;
    let house = id_of(&pool, "house.wav").await;
    let slow = id_of(&pool, "slow.wav").await;
    add_tag(&pool, std::slice::from_ref(&slow), "chill").await.unwrap();

    let any = definition(
        vec![rule(RuleField::Tag, RuleOp::Is, "CHILL", ""), rule(RuleField::Genre, RuleOp::Contains, "hou", "")],
        false,
    );
    assert_eq!(evaluate_ids(&pool, &any).await.unwrap().len(), 2);
    let all = definition(any.rules.clone(), true);
    assert!(evaluate_ids(&pool, &all).await.unwrap().is_empty());

    let untagged = definition(vec![rule(RuleField::Tag, RuleOp::IsNotSet, "", "")], true);
    assert_eq!(evaluate_ids(&pool, &untagged).await.unwrap(), vec![house.clone()]);

    let mut limited = definition(vec![], true);
    limited.sort = SortColumn::Title;
    limited.descending = true;
    limited.limit = Some(1);
    let ids = evaluate_ids(&pool, &limited).await.unwrap();
    assert_eq!(ids.len(), 1);
    let saved = save_smart(&pool, None, &SmartDefinition { name: "Limited".into(), ..limited }).await.unwrap();

    let fixed = snapshot(&pool, &saved.id, "Fixed copy").await.unwrap();
    assert_eq!(fixed.name, "Fixed copy");
    set_rating(&pool, &[house], 3).await.unwrap();
    let entries = super::playlists::playable_track_ids(&pool, &fixed.id).await.unwrap();
    assert_eq!(entries, ids, "a snapshot no longer follows the rules");
}

#[tokio::test]
async fn invalid_smart_rules_are_rejected_when_saved() {
    let (pool, _dir) = library().await;
    for bad in [
        rule(RuleField::Bpm, RuleOp::Contains, "1", ""),
        rule(RuleField::Bpm, RuleOp::AtLeast, "fast", ""),
        rule(RuleField::Key, RuleOp::Is, "not a key", ""),
        rule(RuleField::LastPlayed, RuleOp::InLastDays, "-5", ""),
        rule(RuleField::Title, RuleOp::InLastDays, "5", ""),
    ] {
        assert!(save_smart(&pool, None, &definition(vec![bad.clone()], true)).await.is_err(), "{bad:?}");
    }
    let mut unnamed = definition(vec![], true);
    unnamed.name = "  ".into();
    assert!(save_smart(&pool, None, &unnamed).await.is_err());
    save_smart(&pool, None, &definition(vec![], true)).await.unwrap();
    assert!(save_smart(&pool, None, &definition(vec![], true)).await.unwrap_err().contains("already exists"));
}

/// `cargo test --release --lib analysis_throughput -- --ignored --nocapture`
#[test]
#[ignore = "timing measurement; run in release"]
fn analysis_throughput_on_a_five_minute_track() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("long.wav");
    write_kick_wav(&path, 124.0, 300.0, "House");
    let started = std::time::Instant::now();
    let analysis = super::analysis::analyze_file(&path, 300 * 44_100, &|| false).unwrap();
    let elapsed = started.elapsed();
    println!(
        "5 min mono 44.1 kHz: {:.2} s ({:.0}x realtime), bpm {:?}, key {:?}",
        elapsed.as_secs_f64(),
        300.0 / elapsed.as_secs_f64(),
        analysis.bpm.map(|b| b.value),
        analysis.key.map(|k| k.value),
    );
}
