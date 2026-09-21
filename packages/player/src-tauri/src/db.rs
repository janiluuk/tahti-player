use std::path::Path;

use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePool, SqliteSynchronous};

pub fn configure(options: SqliteConnectOptions) -> SqliteConnectOptions {
    options
        .journal_mode(SqliteJournalMode::Wal)
        // WAL makes NORMAL durable across app crashes (only an OS crash can
        // lose the last commits) and skips an fsync per commit.
        .synchronous(SqliteSynchronous::Normal)
        .foreign_keys(true)
        .pragma("cache_size", "-32768")
        .pragma("temp_store", "MEMORY")
        .pragma("mmap_size", "268435456")
}

pub async fn open(path: &Path) -> Result<SqlitePool, String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|err| format!("Failed to create database directory: {err}"))?;
    }

    let options = configure(
        SqliteConnectOptions::new()
            .filename(path)
            .create_if_missing(true),
    );

    SqlitePool::connect_with(options)
        .await
        .map_err(|err| format!("Failed to open database: {err}"))
}
