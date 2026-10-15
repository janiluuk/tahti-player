//! Tells the webview when the catalog changed. Triggers bump
//! `library_change_version` on every write to tracks or tags (migration
//! 0024), whichever code path made it: commands, the folder watcher, imports,
//! analysis, restores. A background task reads the counter once a second and
//! emits `LIBRARY_CHANGED_EVENT` when it moved, so a burst of writes becomes
//! one event.

use std::time::Duration;

use serde::Serialize;
use specta_typescript::Number;
use sqlx::SqlitePool;
use tauri::Emitter;

use super::pool;

pub const LIBRARY_CHANGED_EVENT: &str = "library://changed";

const POLL: Duration = Duration::from_secs(1);

#[derive(Debug, Clone, Copy, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct LibraryChangeVersion {
    #[specta(type = Number<i64>)]
    pub version: i64,
}

pub async fn change_version(pool: &SqlitePool) -> Result<i64, String> {
    sqlx::query_scalar::<_, i64>("SELECT version FROM library_change_version WHERE id = 1")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())
}

/// Polls the counter and emits when it moves. Started once, when the catalog opens.
pub fn watch(app: tauri::AppHandle, pool: SqlitePool) {
    tauri::async_runtime::spawn(async move {
        let mut seen = change_version(&pool).await.unwrap_or(0);
        loop {
            tokio::time::sleep(POLL).await;
            let Ok(version) = change_version(&pool).await else {
                continue;
            };
            if version != seen {
                seen = version;
                let _ = app.emit(LIBRARY_CHANGED_EVENT, LibraryChangeVersion { version });
            }
        }
    });
}

/// The current counter, so a view can tell whether what it shows is stale.
#[tauri::command]
#[specta::specta]
pub async fn library_change_version(app: tauri::AppHandle) -> Result<LibraryChangeVersion, String> {
    Ok(LibraryChangeVersion { version: change_version(&pool(&app).await?).await? })
}
