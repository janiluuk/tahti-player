//! Smart playlists (desktop-pro-library.md Phase 5): a saved set of
//! all/any rules over catalog fields, ratings/tags, dates/play counts and
//! analysis, with a sort and an optional limit. Nothing is stored about the
//! result: every read re-evaluates the rules against the live catalog, so
//! edits, plays and new analysis show up immediately. `snapshot` turns the
//! current result into an ordinary, fixed playlist.
//!
//! Rules are assembled into SQL from a closed set of fields and operators;
//! every value is a bound parameter.

use serde::{Deserialize, Serialize};
use specta_typescript::Number;
use sqlx::{Row, SqlitePool};

use super::analysis_dsp::normalize_key;
use super::playlists::{add_tracks, create_playlist, PlaylistSummary};
use super::{order_clause, pool, Bind, LibraryPage, LibraryTrack, SortColumn, TrackSort};

const MAX_RESULT: i64 = 20_000;
const MAX_RULES: usize = 30;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum RuleField {
    Title,
    Artist,
    Album,
    Genre,
    Format,
    Tag,
    Year,
    Rating,
    PlayCount,
    Duration,
    Bpm,
    Key,
    Loudness,
    /// Days since last played; a track never played counts as "not played".
    LastPlayed,
    /// Days since the track was added.
    Added,
    /// Whether analysis has run (`isSet` / `isNotSet`).
    Analyzed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum RuleOp {
    Is,
    IsNot,
    Contains,
    NotContains,
    AtLeast,
    AtMost,
    Between,
    /// Dates: within the last `value` days.
    InLastDays,
    /// Dates: not within the last `value` days (never-played included).
    NotInLastDays,
    IsSet,
    IsNotSet,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SmartRule {
    pub field: RuleField,
    pub op: RuleOp,
    #[serde(default)]
    pub value: String,
    /// Upper bound for `between`.
    #[serde(default)]
    pub value2: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SmartDefinition {
    pub name: String,
    /// All rules must match (true) or any of them (false).
    pub match_all: bool,
    pub rules: Vec<SmartRule>,
    pub sort: SortColumn,
    pub descending: bool,
    /// Keep only the first N tracks in that sort.
    #[specta(type = Option<Number<i64>>)]
    pub limit: Option<i64>,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SmartPlaylist {
    pub id: String,
    #[serde(flatten)]
    pub definition: SmartDefinition,
    pub created_at: String,
}

fn numeric(field: RuleField) -> Option<&'static str> {
    Some(match field {
        RuleField::Year => "year",
        RuleField::Rating => "rating",
        RuleField::PlayCount => "play_count",
        RuleField::Duration => "duration",
        RuleField::Bpm => "bpm",
        RuleField::Loudness => "loudness_lufs",
        _ => return None,
    })
}

fn text(field: RuleField) -> Option<&'static str> {
    Some(match field {
        RuleField::Title => "title",
        RuleField::Artist => "artist",
        RuleField::Album => "album",
        RuleField::Genre => "genre",
        RuleField::Format => "format",
        RuleField::Key => "musical_key",
        _ => return None,
    })
}

fn number(value: &str) -> Result<f64, String> {
    value.trim().parse::<f64>().ok().filter(|v| v.is_finite()).ok_or_else(|| format!("Not a number: {value}"))
}

/// SQL condition (with bound values) for one rule, or why it is invalid.
fn rule_sql(rule: &SmartRule) -> Result<(String, Vec<Bind>), String> {
    let bad = || format!("{:?} does not support {:?}", rule.field, rule.op);
    if let Some(column) = numeric(rule.field) {
        return Ok(match rule.op {
            RuleOp::Is => (format!("{column} = ?"), vec![Bind::Real(number(&rule.value)?)]),
            RuleOp::IsNot => (format!("({column} IS NULL OR {column} <> ?)"), vec![Bind::Real(number(&rule.value)?)]),
            RuleOp::AtLeast => (format!("{column} >= ?"), vec![Bind::Real(number(&rule.value)?)]),
            RuleOp::AtMost => (format!("{column} <= ?"), vec![Bind::Real(number(&rule.value)?)]),
            RuleOp::Between => {
                let (a, b) = (number(&rule.value)?, number(&rule.value2)?);
                (format!("{column} BETWEEN ? AND ?"), vec![Bind::Real(a.min(b)), Bind::Real(a.max(b))])
            }
            RuleOp::IsSet => (format!("{column} IS NOT NULL"), vec![]),
            RuleOp::IsNotSet => (format!("{column} IS NULL"), vec![]),
            _ => return Err(bad()),
        });
    }
    if let Some(column) = text(rule.field) {
        let is_key = rule.field == RuleField::Key;
        let value = if is_key && matches!(rule.op, RuleOp::Is | RuleOp::IsNot) {
            normalize_key(&rule.value).ok_or_else(|| format!("Not a musical key: {}", rule.value))?
        } else {
            rule.value.trim().to_owned()
        };
        let like = format!("%{}%", value.replace('\\', "\\\\").replace('%', "\\%").replace('_', "\\_"));
        return Ok(match rule.op {
            RuleOp::Is => (format!("{column} = ? COLLATE NOCASE"), vec![Bind::Text(value)]),
            RuleOp::IsNot => (format!("COALESCE({column}, '') <> ? COLLATE NOCASE"), vec![Bind::Text(value)]),
            RuleOp::Contains => (format!("{column} LIKE ? ESCAPE '\\'"), vec![Bind::Text(like)]),
            RuleOp::NotContains => (format!("COALESCE({column}, '') NOT LIKE ? ESCAPE '\\'"), vec![Bind::Text(like)]),
            RuleOp::IsSet => (format!("COALESCE({column}, '') <> ''"), vec![]),
            RuleOp::IsNotSet => (format!("COALESCE({column}, '') = ''"), vec![]),
            _ => return Err(bad()),
        });
    }
    let tag_exists = "EXISTS (SELECT 1 FROM library_track_tags tt JOIN library_tags t ON t.id = tt.tag_id WHERE tt.track_id = library_tracks.id";
    Ok(match (rule.field, rule.op) {
        (RuleField::Tag, RuleOp::Is) => (format!("{tag_exists} AND t.name = ?)"), vec![Bind::Text(rule.value.trim().to_owned())]),
        (RuleField::Tag, RuleOp::IsNot) => (format!("NOT {tag_exists} AND t.name = ?)"), vec![Bind::Text(rule.value.trim().to_owned())]),
        (RuleField::Tag, RuleOp::IsSet) => (format!("{tag_exists})"), vec![]),
        (RuleField::Tag, RuleOp::IsNotSet) => (format!("NOT {tag_exists})"), vec![]),
        (RuleField::LastPlayed, RuleOp::InLastDays) => ("last_played_at >= datetime('now', ?)".into(), vec![Bind::Text(days_ago(&rule.value)?)]),
        (RuleField::LastPlayed, RuleOp::NotInLastDays) => (
            "(last_played_at IS NULL OR last_played_at < datetime('now', ?))".into(),
            vec![Bind::Text(days_ago(&rule.value)?)],
        ),
        (RuleField::LastPlayed, RuleOp::IsSet) => ("last_played_at IS NOT NULL".into(), vec![]),
        (RuleField::LastPlayed, RuleOp::IsNotSet) => ("last_played_at IS NULL".into(), vec![]),
        (RuleField::Added, RuleOp::InLastDays) => ("added_at >= datetime('now', ?)".into(), vec![Bind::Text(days_ago(&rule.value)?)]),
        (RuleField::Added, RuleOp::NotInLastDays) => ("added_at < datetime('now', ?)".into(), vec![Bind::Text(days_ago(&rule.value)?)]),
        (RuleField::Analyzed, RuleOp::IsSet) => ("analyzed = 1".into(), vec![]),
        (RuleField::Analyzed, RuleOp::IsNotSet) => ("analyzed = 0".into(), vec![]),
        _ => return Err(bad()),
    })
}

fn days_ago(value: &str) -> Result<String, String> {
    let days = number(value)?;
    if !(0.0..=36_500.0).contains(&days) {
        return Err("Days must be between 0 and 36500".into());
    }
    Ok(format!("-{} days", days.round() as i64))
}

/// `WHERE ...` for the definition (unavailable files are never listed).
fn where_sql(def: &SmartDefinition) -> Result<(String, Vec<Bind>), String> {
    if def.rules.len() > MAX_RULES {
        return Err(format!("At most {MAX_RULES} rules"));
    }
    let mut parts = Vec::new();
    let mut binds = Vec::new();
    for rule in &def.rules {
        let (sql, values) = rule_sql(rule)?;
        parts.push(format!("({sql})"));
        binds.extend(values);
    }
    let joined = if parts.is_empty() {
        "1".to_owned()
    } else {
        parts.join(if def.match_all { " AND " } else { " OR " })
    };
    Ok((format!("WHERE available = 1 AND ({joined})"), binds))
}

macro_rules! bind_values {
    ($query:expr, $binds:expr) => {{
        let mut query = $query;
        for value in $binds.iter() {
            query = match value {
                Bind::Text(v) => query.bind(v.clone()),
                Bind::Int(v) => query.bind(*v),
                Bind::Real(v) => query.bind(*v),
            };
        }
        query
    }};
}

fn clean(def: &SmartDefinition) -> Result<SmartDefinition, String> {
    let name = def.name.trim();
    if name.is_empty() {
        return Err("Give the smart playlist a name".into());
    }
    if let Some(limit) = def.limit {
        if limit < 1 {
            return Err("The limit must be at least 1".into());
        }
    }
    let mut def = def.clone();
    def.name = name.chars().take(120).collect();
    where_sql(&def)?; // reject an invalid rule at save time, not at first open
    Ok(def)
}

fn name_error(err: sqlx::Error) -> String {
    match &err {
        sqlx::Error::Database(db) if db.is_unique_violation() => "A smart playlist with that name already exists".into(),
        _ => err.to_string(),
    }
}

fn from_row(row: &sqlx::sqlite::SqliteRow) -> Result<SmartPlaylist, String> {
    let rules: String = row.get("rules");
    let sort: String = row.get("sort_field");
    Ok(SmartPlaylist {
        id: row.get("id"),
        definition: SmartDefinition {
            name: row.get("name"),
            match_all: row.get::<i64, _>("match_all") != 0,
            rules: serde_json::from_str(&rules).map_err(|e| e.to_string())?,
            sort: serde_json::from_value(serde_json::Value::String(sort)).unwrap_or(SortColumn::Title),
            descending: row.get::<i64, _>("sort_descending") != 0,
            limit: row.get("max_tracks"),
        },
        created_at: row.get("created_at"),
    })
}

fn sort_name(sort: SortColumn) -> String {
    serde_json::to_value(sort).ok().and_then(|v| v.as_str().map(str::to_owned)).unwrap_or_else(|| "title".into())
}

pub async fn list_smart(pool: &SqlitePool) -> Result<Vec<SmartPlaylist>, String> {
    sqlx::query("SELECT * FROM library_smart_playlists ORDER BY name COLLATE NOCASE")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?
        .iter()
        .map(from_row)
        .collect()
}

pub async fn get_smart(pool: &SqlitePool, id: &str) -> Result<SmartPlaylist, String> {
    let row = sqlx::query("SELECT * FROM library_smart_playlists WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Smart playlist not found")?;
    from_row(&row)
}

pub async fn save_smart(pool: &SqlitePool, id: Option<&str>, def: &SmartDefinition) -> Result<SmartPlaylist, String> {
    let def = clean(def)?;
    let rules = serde_json::to_string(&def.rules).map_err(|e| e.to_string())?;
    let id = match id {
        Some(id) => {
            let done = sqlx::query(
                "UPDATE library_smart_playlists SET name=?, match_all=?, rules=?, sort_field=?, sort_descending=?, max_tracks=? WHERE id=?",
            )
            .bind(&def.name)
            .bind(def.match_all)
            .bind(&rules)
            .bind(sort_name(def.sort))
            .bind(def.descending)
            .bind(def.limit)
            .bind(id)
            .execute(pool)
            .await
            .map_err(name_error)?;
            if done.rows_affected() == 0 {
                return Err("Smart playlist not found".into());
            }
            id.to_owned()
        }
        None => {
            let id = uuid::Uuid::new_v4().to_string();
            sqlx::query(
                "INSERT INTO library_smart_playlists (id, name, match_all, rules, sort_field, sort_descending, max_tracks) VALUES (?,?,?,?,?,?,?)",
            )
            .bind(&id)
            .bind(&def.name)
            .bind(def.match_all)
            .bind(&rules)
            .bind(sort_name(def.sort))
            .bind(def.descending)
            .bind(def.limit)
            .execute(pool)
            .await
            .map_err(name_error)?;
            id
        }
    };
    get_smart(pool, &id).await
}

pub async fn delete_smart(pool: &SqlitePool, id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM library_smart_playlists WHERE id = ?").bind(id).execute(pool).await.map_err(|e| e.to_string())?;
    Ok(())
}

fn ordering(def: &SmartDefinition) -> String {
    order_clause(Some(&TrackSort { column: def.sort, descending: def.descending }))
}

/// Number of tracks a definition matches right now (limit applied).
pub async fn count_matches(pool: &SqlitePool, def: &SmartDefinition) -> Result<i64, String> {
    let (where_sql, binds) = where_sql(def)?;
    let sql = format!("SELECT COUNT(*) FROM library_tracks {where_sql}");
    let total: i64 = bind_values!(sqlx::query(&sql), binds).fetch_one(pool).await.map_err(|e| e.to_string())?.get(0);
    Ok(def.limit.map_or(total, |limit| total.min(limit)))
}

/// One page (100) of the live result, in the definition's sort.
pub async fn evaluate_page(pool: &SqlitePool, def: &SmartDefinition, offset: i64) -> Result<LibraryPage, String> {
    let total = count_matches(pool, def).await?;
    let (where_sql, binds) = where_sql(def)?;
    let offset = offset.max(0);
    let remaining = (total - offset).clamp(0, 100);
    let sql = format!("SELECT * FROM library_tracks {where_sql} {} LIMIT ? OFFSET ?", ordering(def));
    let tracks = bind_values!(sqlx::query_as::<_, LibraryTrack>(&sql), binds)
        .bind(remaining)
        .bind(offset)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(LibraryPage { tracks, total })
}

/// Every matching id in order (for play/queue/snapshot), capped.
pub async fn evaluate_ids(pool: &SqlitePool, def: &SmartDefinition) -> Result<Vec<String>, String> {
    let (where_sql, binds) = where_sql(def)?;
    let limit = def.limit.unwrap_or(MAX_RESULT).min(MAX_RESULT);
    let sql = format!("SELECT id FROM library_tracks {where_sql} {} LIMIT ?", ordering(def));
    let rows = bind_values!(sqlx::query_scalar::<_, String>(&sql), binds)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(rows)
}

/// Saves the current result as an ordinary playlist that no longer changes.
pub async fn snapshot(pool: &SqlitePool, id: &str, name: &str) -> Result<PlaylistSummary, String> {
    let def = get_smart(pool, id).await?.definition;
    let ids = evaluate_ids(pool, &def).await?;
    let playlist = create_playlist(pool, name).await?;
    add_tracks(pool, &playlist.id, &ids, None).await?;
    super::playlists::get_playlist(pool, &playlist.id).await
}

// ---------------------------------------------------------------- commands

#[tauri::command]
#[specta::specta]
pub async fn smart_list(app: tauri::AppHandle) -> Result<Vec<SmartPlaylist>, String> {
    list_smart(&pool(&app).await?).await
}

#[tauri::command]
#[specta::specta]
pub async fn smart_save(app: tauri::AppHandle, id: Option<String>, definition: SmartDefinition) -> Result<SmartPlaylist, String> {
    save_smart(&pool(&app).await?, id.as_deref(), &definition).await
}

#[tauri::command]
#[specta::specta]
pub async fn smart_delete(app: tauri::AppHandle, id: String) -> Result<(), String> {
    delete_smart(&pool(&app).await?, &id).await
}

/// Evaluates a saved smart playlist, or an unsaved draft when `definition`
/// is given (live preview while editing rules).
#[tauri::command]
#[specta::specta]
pub async fn smart_evaluate(
    app: tauri::AppHandle,
    id: Option<String>,
    definition: Option<SmartDefinition>,
    offset: u32,
) -> Result<LibraryPage, String> {
    let pool = pool(&app).await?;
    let def = match definition {
        Some(def) => def,
        None => get_smart(&pool, &id.ok_or("Missing smart playlist id")?).await?.definition,
    };
    evaluate_page(&pool, &def, i64::from(offset)).await
}

#[tauri::command]
#[specta::specta]
pub async fn smart_track_ids(app: tauri::AppHandle, id: String) -> Result<Vec<String>, String> {
    let pool = pool(&app).await?;
    evaluate_ids(&pool, &get_smart(&pool, &id).await?.definition).await
}

#[tauri::command]
#[specta::specta]
pub async fn smart_snapshot(app: tauri::AppHandle, id: String, name: String) -> Result<PlaylistSummary, String> {
    snapshot(&pool(&app).await?, &id, &name).await
}

