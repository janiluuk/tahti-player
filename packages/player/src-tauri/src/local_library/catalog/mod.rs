//! Catalog editing and organization (desktop-pro-library.md Phase 4):
//! metadata edits kept apart from extracted tags, ratings, colors, tags and
//! play counts, and exact/similar duplicate review.
//! See `migrations/library/0007_catalog_editing.sql`.
//!
//! Edited values live in the `library_tracks` columns (search, sort and
//! indexes are unchanged). `library_track_overrides` records which fields the
//! user set and what the file's own tag said, so a rescan re-applies the edit
//! (`reapply_overrides`) and "revert to file tag" is exact.

use std::collections::{BTreeMap, HashMap, HashSet};
use std::sync::atomic::Ordering;
use serde::{Deserialize, Serialize};
use specta_typescript::Number;
use sqlx::{Row, SqliteConnection, SqlitePool};
use tauri::{Emitter, Manager};

pub mod duplicates;
pub mod edits;
pub mod plays;
pub mod user_data;

pub use duplicates::*;
pub use edits::*;
pub use plays::*;
pub use user_data::*;
use super::{pool, LibraryState, LibraryTrack};

/// Color labels a track can carry. A closed set, so the UI can render a fixed
/// palette and a filter never has to guess.
pub const COLORS: [&str; 7] = ["red", "orange", "yellow", "green", "blue", "purple", "gray"];

const COMMENT_LIMIT: usize = 500;

const CHUNK: usize = 500;

const HASH_PROGRESS_EVENT: &str = "library://hash-progress";
