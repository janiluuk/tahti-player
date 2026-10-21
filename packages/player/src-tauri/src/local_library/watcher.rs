//! Watched roots (desktop-pro-library.md Phase 6): OS filesystem events on
//! every library root feed a debounced, incremental reconcile.
//!
//! The reconcile is the same idempotent `scan_root` the manual "Rescan"
//! uses (new files imported, vanished files marked missing, returned files
//! recovered), so IDs, playlists and user overrides are never touched by a
//! rename or delete. A slow fallback full rescan covers what events miss
//! (unmounted/remounted drives, dropped events, network shares).

use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::Duration;

use notify::{EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use tauri::{Emitter, Manager};

use super::{list_roots, pool, reset_cancel_import, scan_root, LibraryRoot, LibraryState};

pub const ROOTS_CHANGED_EVENT: &str = "library://roots-changed";

/// Quiet period after the last event before reconciling; a bulk copy fires
/// thousands of events and must collapse into one scan.
const DEBOUNCE: Duration = Duration::from_secs(3);
/// Safety net for missed events and unmounted/remounted drives.
const FALLBACK_RESCAN: Duration = Duration::from_secs(600);

#[derive(Default)]
pub struct WatchControl {
    watcher: Mutex<Option<RecommendedWatcher>>,
    /// Set while a reconcile runs so a burst never starts overlapping scans.
    scanning: AtomicBool,
}

/// Which roots a batch of changed paths belongs to. A root whose folder
/// itself changed (or vanished) is matched by its own path.
pub fn affected_roots(roots: &[(String, PathBuf)], changed: &[PathBuf]) -> HashSet<String> {
    roots
        .iter()
        .filter(|(_, root)| {
            changed
                .iter()
                .any(|path| path.starts_with(root) || root.starts_with(path))
        })
        .map(|(id, _)| id.clone())
        .collect()
}

fn is_content_event(kind: &EventKind) -> bool {
    matches!(
        kind,
        EventKind::Create(_) | EventKind::Remove(_) | EventKind::Modify(_) | EventKind::Any
    )
}

const SETTING_KEY: &str = "watch_roots";

/// Watching is on unless the user paused it.
pub async fn watching_enabled(pool: &sqlx::SqlitePool) -> bool {
    sqlx::query_scalar::<_, String>("SELECT value FROM library_settings WHERE key = ?")
        .bind(SETTING_KEY)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
        .map_or(true, |value| value != "off")
}

pub async fn set_watching_enabled(pool: &sqlx::SqlitePool, enabled: bool) -> Result<(), String> {
    sqlx::query(
        "INSERT INTO library_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    )
    .bind(SETTING_KEY)
    .bind(if enabled { "on" } else { "off" })
    .execute(pool)
    .await
    .map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn library_watching(app: tauri::AppHandle) -> Result<bool, String> {
    Ok(watching_enabled(&pool(&app).await?).await)
}

/// Turns folder watching on or off (persisted); manual rescan always works.
#[tauri::command]
#[specta::specta]
pub async fn library_set_watching(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    set_watching_enabled(&pool(&app).await?, enabled).await?;
    restart(&app).await;
    Ok(())
}

/// (Re)starts watching every registered root. Call at startup and after any
/// change to the root list; the previous watcher (and its task) is dropped.
pub async fn restart(app: &tauri::AppHandle) {
    let Ok(db) = pool(app).await else { return };
    let control = &app.state::<LibraryState>().watch;
    if !watching_enabled(&db).await {
        // Dropping the watcher also ends the previous reconcile task.
        *control.watcher.lock().unwrap() = None;
        return;
    }
    let Ok(roots) = list_roots(&db).await else { return };
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<Vec<PathBuf>>();
    let mut watcher = match notify::recommended_watcher(move |event: notify::Result<notify::Event>| {
        if let Ok(event) = event {
            if is_content_event(&event.kind) {
                let _ = tx.send(event.paths);
            }
        }
    }) {
        Ok(watcher) => watcher,
        Err(err) => {
            log::warn!("library watcher unavailable: {err}");
            return;
        }
    };
    for root in &roots {
        // A missing drive fails here; the fallback rescan picks it up later.
        if let Err(err) = watcher.watch(Path::new(&root.path), RecursiveMode::Recursive) {
            log::warn!("not watching {}: {err}", root.path);
        }
    }
    *control.watcher.lock().unwrap() = Some(watcher);

    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let mut pending: Vec<PathBuf> = Vec::new();
        let mut fallback = tokio::time::interval(FALLBACK_RESCAN);
        fallback.tick().await; // first tick is immediate
        loop {
            tokio::select! {
                batch = rx.recv() => match batch {
                    // Sender dropped: a newer `restart` replaced this watcher.
                    None => break,
                    Some(paths) => pending.extend(paths),
                },
                _ = tokio::time::sleep(DEBOUNCE), if !pending.is_empty() => {
                    let changed = std::mem::take(&mut pending);
                    reconcile(&app, Some(&changed)).await;
                }
                _ = fallback.tick() => reconcile(&app, None).await,
            }
        }
    });
}

/// Reconciles the roots touched by `changed` (all roots when `None`) and
/// tells the UI when the catalog changed.
async fn reconcile(app: &tauri::AppHandle, changed: Option<&[PathBuf]>) {
    let control = &app.state::<LibraryState>().watch;
    if control.scanning.swap(true, Ordering::SeqCst) {
        return;
    }
    let mut total = super::RootScanResult::default();
    if let Ok(db) = pool(app).await {
        if let Ok(roots) = list_roots(&db).await {
            let keyed: Vec<(String, PathBuf)> = roots
                .iter()
                .map(|root| (root.id.clone(), PathBuf::from(&root.path)))
                .collect();
            let wanted = changed.map(|paths| affected_roots(&keyed, paths));
            reset_cancel_import(app);
            for root in roots.iter().filter(|root: &&LibraryRoot| {
                wanted.as_ref().map_or(true, |ids| ids.contains(&root.id))
            }) {
                let scanned = scan_root(app, &db, root).await;
                total.imported += scanned.imported;
                total.missing += scanned.missing;
                total.recovered += scanned.recovered;
                total.moved += scanned.moved;
                total.updated += scanned.updated;
            }
        }
    }
    control.scanning.store(false, Ordering::SeqCst);
    if total.imported + total.missing + total.recovered + total.moved + total.updated > 0 {
        let _ = app.emit(ROOTS_CHANGED_EVENT, total);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn roots() -> Vec<(String, PathBuf)> {
        vec![
            ("a".into(), PathBuf::from("/music/a")),
            ("b".into(), PathBuf::from("/music/b")),
        ]
    }

    #[test]
    fn maps_changed_paths_to_their_root_only() {
        let hit = affected_roots(&roots(), &[PathBuf::from("/music/a/x/new.flac")]);
        assert_eq!(hit, HashSet::from(["a".to_string()]));
    }

    #[test]
    fn a_sibling_with_a_shared_name_prefix_is_not_a_match() {
        let hit = affected_roots(&roots(), &[PathBuf::from("/music/ab/new.flac")]);
        assert!(hit.is_empty());
    }

    #[test]
    fn an_event_on_a_parent_of_a_root_hits_it() {
        let hit = affected_roots(&roots(), &[PathBuf::from("/music")]);
        assert_eq!(hit.len(), 2);
    }

    #[tokio::test]
    async fn watching_defaults_on_and_persists_the_pause() {
        let dir = tempfile::tempdir().unwrap();
        let pool = crate::local_library::open(&dir.path().join("library.db")).await.unwrap();
        assert!(watching_enabled(&pool).await);
        set_watching_enabled(&pool, false).await.unwrap();
        assert!(!watching_enabled(&pool).await);
        set_watching_enabled(&pool, true).await.unwrap();
        assert!(watching_enabled(&pool).await);
    }

    #[test]
    fn access_events_are_ignored() {
        assert!(!is_content_event(&EventKind::Access(notify::event::AccessKind::Any)));
        assert!(is_content_event(&EventKind::Create(notify::event::CreateKind::File)));
    }
}
