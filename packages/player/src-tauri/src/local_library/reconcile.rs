//! Incremental reconciliation steps used by root scans (Phase 6): moved-file
//! detection so a rename keeps its catalog ID, and re-reading known files
//! that changed on disk (external tag edits).

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

use sqlx::SqlitePool;

use super::{folder_of, import_batch, ImportResult, LibraryRoot};

fn mtime_secs(path: &Path) -> Option<i64> {
    let modified = std::fs::metadata(path).ok()?.modified().ok()?;
    Some(modified.duration_since(UNIX_EPOCH).ok()?.as_secs() as i64)
}

/// Pairs vanished tracks with newly seen files by identical file name and
/// byte size, only when the pairing is one-to-one on both sides. Returns
/// `(track id, new path)` pairs; anything ambiguous is left to import as new.
pub fn pair_moves(
    vanished: &[(String, PathBuf, i64)],
    fresh: &[(PathBuf, i64)],
) -> Vec<(String, PathBuf)> {
    let key = |path: &Path, size: i64| (path.file_name().map(|n| n.to_os_string()), size);
    let mut old: HashMap<_, Vec<&String>> = HashMap::new();
    for (id, path, size) in vanished {
        old.entry(key(path, *size)).or_default().push(id);
    }
    let mut new: HashMap<_, Vec<&PathBuf>> = HashMap::new();
    for (path, size) in fresh {
        new.entry(key(path, *size)).or_default().push(path);
    }
    old.into_iter()
        .filter_map(|(k, ids)| {
            let paths = new.get(&k)?;
            (ids.len() == 1 && paths.len() == 1).then(|| (ids[0].clone(), paths[0].clone()))
        })
        .collect()
}

/// Re-points root tracks whose file vanished at a new file that appeared in
/// the same scan (a rename or move). Returns the moved count and the fresh
/// paths that were *not* consumed as moves.
pub async fn relink_moved(
    pool: &SqlitePool,
    root: &LibraryRoot,
    fresh: Vec<PathBuf>,
) -> Result<(usize, Vec<PathBuf>), String> {
    if fresh.is_empty() {
        return Ok((0, fresh));
    }
    let rows = sqlx::query_as::<_, (String, String, i64)>(
        "SELECT id, path, size_bytes FROM library_tracks WHERE root_id = ?",
    )
    .bind(&root.id)
    .fetch_all(pool)
    .await
    .map_err(|err| err.to_string())?;
    let (pairs, fresh) = tauri::async_runtime::spawn_blocking(move || {
        let vanished: Vec<(String, PathBuf, i64)> = rows
            .into_iter()
            .map(|(id, path, size)| (id, PathBuf::from(path), size))
            .filter(|(_, path, _)| !path.is_file())
            .collect();
        let sized: Vec<(PathBuf, i64)> = fresh
            .iter()
            .filter_map(|path| Some((path.clone(), std::fs::metadata(path).ok()?.len() as i64)))
            .collect();
        let pairs = pair_moves(&vanished, &sized);
        (pairs, fresh)
    })
    .await
    .map_err(|err| err.to_string())?;
    let mut moved = 0usize;
    let mut consumed = std::collections::HashSet::new();
    for (id, path) in pairs {
        let text = path.to_string_lossy().into_owned();
        let done = sqlx::query(
            "UPDATE library_tracks SET path=?, folder=?, available=1, unavailable_since=NULL, mtime=NULL WHERE id=?",
        )
        .bind(&text)
        .bind(folder_of(&text))
        .bind(&id)
        .execute(pool)
        .await;
        if done.is_ok() {
            moved += 1;
            consumed.insert(path);
        }
    }
    Ok((moved, fresh.into_iter().filter(|p| !consumed.contains(p)).collect()))
}

/// Re-reads available root tracks whose size or mtime changed since they
/// were last read, and records the mtime for tracks that have none yet
/// (without re-reading them). Returns how many were re-read.
pub async fn refresh_changed(pool: &SqlitePool, root: &LibraryRoot) -> Result<usize, String> {
    let rows = sqlx::query_as::<_, (String, String, i64, Option<i64>)>(
        "SELECT id, path, size_bytes, mtime FROM library_tracks WHERE root_id = ? AND available = 1",
    )
    .bind(&root.id)
    .fetch_all(pool)
    .await
    .map_err(|err| err.to_string())?;
    let (changed, stamps) = tauri::async_runtime::spawn_blocking(move || {
        let mut changed = Vec::new();
        let mut stamps = Vec::new();
        for (id, path, size, stored) in rows {
            let meta = std::fs::metadata(&path).ok();
            let (Some(meta), Some(now)) = (meta, mtime_secs(Path::new(&path))) else {
                continue;
            };
            let size_changed = meta.len() as i64 != size;
            match stored {
                Some(then) if size_changed || then != now => changed.push(PathBuf::from(path)),
                Some(_) => {}
                None if size_changed => changed.push(PathBuf::from(path)),
                None => stamps.push((id, now)),
            }
        }
        (changed, stamps)
    })
    .await
    .map_err(|err| err.to_string())?;
    if !stamps.is_empty() {
        let mut tx = pool.begin().await.map_err(|err| err.to_string())?;
        for (id, mtime) in stamps {
            sqlx::query("UPDATE library_tracks SET mtime=? WHERE id=?")
                .bind(mtime)
                .bind(id)
                .execute(&mut *tx)
                .await
                .map_err(|err| err.to_string())?;
        }
        tx.commit().await.map_err(|err| err.to_string())?;
    }
    let count = changed.len();
    if count == 0 {
        return Ok(0);
    }
    let mut result = ImportResult::default();
    for batch in changed.chunks(50) {
        import_batch(pool, batch.to_vec(), Some(&root.id), &mut result).await;
    }
    // Stamp the re-read files so they are not re-read again next scan.
    let paths: Vec<PathBuf> = changed;
    let stamped = tauri::async_runtime::spawn_blocking(move || {
        paths
            .into_iter()
            .filter_map(|p| Some((p.to_string_lossy().into_owned(), mtime_secs(&p)?)))
            .collect::<Vec<_>>()
    })
    .await
    .map_err(|err| err.to_string())?;
    for (path, mtime) in stamped {
        let _ = sqlx::query("UPDATE library_tracks SET mtime=? WHERE path=?")
            .bind(mtime)
            .bind(path)
            .execute(pool)
            .await;
    }
    Ok(count.saturating_sub(result.errors.len()))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn v(id: &str, path: &str, size: i64) -> (String, PathBuf, i64) {
        (id.into(), PathBuf::from(path), size)
    }

    #[test]
    fn a_unique_name_and_size_match_is_a_move() {
        let pairs = pair_moves(
            &[v("t1", "/m/a/song.flac", 100)],
            &[(PathBuf::from("/m/b/song.flac"), 100)],
        );
        assert_eq!(pairs, vec![("t1".to_string(), PathBuf::from("/m/b/song.flac"))]);
    }

    #[test]
    fn different_size_or_ambiguous_pairings_are_not_moves() {
        assert!(pair_moves(
            &[v("t1", "/m/a/song.flac", 100)],
            &[(PathBuf::from("/m/b/song.flac"), 101)],
        )
        .is_empty());
        assert!(pair_moves(
            &[v("t1", "/m/a/song.flac", 100)],
            &[
                (PathBuf::from("/m/b/song.flac"), 100),
                (PathBuf::from("/m/c/song.flac"), 100),
            ],
        )
        .is_empty());
    }
}
