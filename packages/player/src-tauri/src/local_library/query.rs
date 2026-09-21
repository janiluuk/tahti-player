//! Track queries: sorting, filters, facets, search, totals and playback
//! preparation, plus their Tauri commands.

use super::*;

/// Sortable track-table columns. A closed enum, never user text, so the
/// ORDER BY below is assembled from fixed SQL only.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum SortColumn {
    Title,
    Artist,
    Album,
    Genre,
    Year,
    TrackNo,
    Duration,
    Format,
    Size,
    Bitrate,
    Added,
    Rating,
    Plays,
    LastPlayed,
    Bpm,
    Key,
    Loudness,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct TrackSort {
    pub column: SortColumn,
    pub descending: bool,
}

/// Stable ORDER BY: the chosen column, blanks/NULLs always last, then title
/// and id so paging never repeats or skips a row between requests.
pub(super) fn order_clause(sort: Option<&TrackSort>) -> String {
    const TIE_BREAK: &str = "title COLLATE NOCASE, id";
    let Some(sort) = sort else {
        return format!("ORDER BY {TIE_BREAK}");
    };
    let dir = if sort.descending { "DESC" } else { "ASC" };
    let text = |expr: &str| format!("({expr} = ''), {expr} COLLATE NOCASE {dir}");
    let nullable = |expr: &str| format!("({expr} IS NULL), {expr} {dir}");
    let primary = match sort.column {
        SortColumn::Title => return format!("ORDER BY title COLLATE NOCASE {dir}, id"),
        SortColumn::Artist => text(ARTIST_KEY),
        SortColumn::Album => format!(
            "{}, (disc_no IS NULL), disc_no, (track_no IS NULL), track_no",
            text("album")
        ),
        SortColumn::Genre => text("genre"),
        SortColumn::Bpm => nullable("bpm"),
        SortColumn::Key => nullable("musical_key"),
        SortColumn::Loudness => nullable("loudness_lufs"),
        SortColumn::Year => nullable("year"),
        SortColumn::TrackNo => nullable("track_no"),
        SortColumn::Bitrate => nullable("bitrate_kbps"),
        SortColumn::Duration => format!("duration {dir}"),
        SortColumn::Format => format!("format {dir}"),
        SortColumn::Size => format!("size_bytes {dir}"),
        SortColumn::Added => format!("added_at {dir}"),
        SortColumn::Rating => format!("rating {dir}"),
        SortColumn::Plays => format!("play_count {dir}"),
        SortColumn::LastPlayed => nullable("last_played_at"),
    };
    format!("ORDER BY {primary}, {TIE_BREAK}")
}

#[derive(Serialize, specta::Type)]
pub struct LibraryPage {
    pub tracks: Vec<LibraryTrack>,
    #[specta(type = Number<i64>)]
    pub total: i64,
}

/// What a browse tab groups by.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum FacetKind {
    Artists,
    Albums,
    Genres,
    Folders,
}

/// One group in a browse tab. For albums `secondary` is the album artist.
#[derive(Debug, Clone, Serialize, specta::Type, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct FacetGroup {
    pub name: String,
    pub secondary: String,
    #[specta(type = Option<Number<i64>>)]
    pub year: Option<i64>,
    #[specta(type = Number<i64>)]
    pub track_count: i64,
    pub duration_sec: f64,
    #[specta(type = Number<i64>)]
    pub size_bytes: i64,
}

/// Narrows the track list to one group from `library_facets`.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct FacetFilter {
    pub kind: FacetKind,
    pub value: String,
    /// Album artist, for `Albums`.
    pub secondary: Option<String>,
}

/// Everything in the catalog, for the "on this device" totals line --
/// deliberately separate from cloud storage usage.
#[derive(Debug, Serialize, specta::Type, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct LibraryTotals {
    #[specta(type = Number<i64>)]
    pub track_count: i64,
    pub duration_sec: f64,
    #[specta(type = Number<i64>)]
    pub size_bytes: i64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum Availability {
    Available,
    Missing,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum AnalysisState {
    Analyzed,
    Unanalyzed,
}

/// Range and attribute filters that combine with search and a browse group.
/// Every field is optional; an unset field never restricts anything.
#[derive(Debug, Clone, Default, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct TrackFilters {
    pub year_min: Option<i32>,
    pub year_max: Option<i32>,
    /// Seconds.
    pub duration_min: Option<f64>,
    pub duration_max: Option<f64>,
    pub bitrate_min: Option<i32>,
    #[serde(default)]
    pub formats: Vec<String>,
    pub root_id: Option<String>,
    /// `YYYY-MM-DD`; tracks added on or after this day.
    pub added_since: Option<String>,
    pub availability: Option<Availability>,
    /// At least this many stars (1-5).
    pub rating_min: Option<i32>,
    /// One of `catalog::COLORS`.
    pub color: Option<String>,
    /// Tracks carrying this tag (case-insensitive).
    pub tag: Option<String>,
    /// Effective BPM (user correction, else tag, else estimate).
    pub bpm_min: Option<f64>,
    pub bpm_max: Option<f64>,
    /// Effective key in `analysis_dsp::key_name` form, e.g. `Am`.
    pub key: Option<String>,
    /// Integrated loudness in LUFS.
    pub loudness_min: Option<f64>,
    pub loudness_max: Option<f64>,
    pub analysis: Option<AnalysisState>,
}

/// Values available to build filter controls from the current catalog.
#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct FilterOptions {
    pub formats: Vec<String>,
    pub year_min: Option<i32>,
    pub year_max: Option<i32>,
}

/// A bound WHERE parameter (filters mix text, integers and reals).
#[derive(Debug, Clone)]
pub(super) enum Bind {
    Text(String),
    Int(i64),
    Real(f64),
}

macro_rules! bind_all {
    ($query:expr, $binds:expr) => {{
        let mut query = $query;
        for value in $binds {
            query = match value {
                Bind::Text(v) => query.bind(v.clone()),
                Bind::Int(v) => query.bind(*v),
                Bind::Real(v) => query.bind(*v),
            };
        }
        query
    }};
}

/// Everything that decides which tracks match and in what order.
#[derive(Debug, Clone, Copy, Default)]
pub struct ListQuery<'a> {
    pub search: &'a str,
    pub filter: Option<&'a FacetFilter>,
    pub filters: Option<&'a TrackFilters>,
    pub sort: Option<&'a TrackSort>,
}

/// Grouping key shared by the artist facet, the album facet and their
/// filters. Album artist wins over track artist so compilations stay
/// together. Keep identical to `0005_browse_indexes.sql`.
pub(super) const ARTIST_KEY: &str = "COALESCE(NULLIF(album_artist, ''), NULLIF(artist, ''), '')";

/// Builds the FTS5 trigram MATCH expression for a search box value: every
/// whitespace-separated term becomes a quoted substring that must appear in
/// some column (AND across terms). Trigram indexes can't answer terms under
/// 3 characters, so those searches return `None` and use the LIKE scan.
pub(super) fn fts_match_query(search: &str) -> Option<String> {
    let terms: Vec<&str> = search.split_whitespace().collect();
    if terms.is_empty() || terms.iter().any(|term| term.chars().count() < 3) {
        return None;
    }
    Some(
        terms
            .iter()
            .map(|term| format!("\"{}\"", term.replace('"', "\"\"")))
            .collect::<Vec<_>>()
            .join(" "),
    )
}

pub async fn list(pool: &SqlitePool, search: &str, offset: i64) -> Result<LibraryPage, String> {
    list_filtered(pool, search, None, None, offset).await
}

/// WHERE clause (with its bound text parameters) for a search and/or browse
/// group. Shared by paging and by select-all so both always agree on what
/// "matching" means.
pub(super) fn where_clause(query: &ListQuery) -> (String, Vec<Bind>) {
    let search = query.search.trim();
    let filter = query.filter;
    let mut conditions: Vec<String> = Vec::new();
    let mut binds: Vec<Bind> = Vec::new();
    if let Some(filter) = filter {
        match filter.kind {
            FacetKind::Artists => {
                conditions.push(format!("{ARTIST_KEY} COLLATE NOCASE = ?"));
                binds.push(Bind::Text(filter.value.clone()));
            }
            FacetKind::Albums => {
                conditions.push("album COLLATE NOCASE = ?".into());
                binds.push(Bind::Text(filter.value.clone()));
                conditions.push(format!("{ARTIST_KEY} COLLATE NOCASE = ?"));
                binds.push(Bind::Text(filter.secondary.clone().unwrap_or_default()));
            }
            FacetKind::Genres => {
                conditions.push("genre COLLATE NOCASE = ?".into());
                binds.push(Bind::Text(filter.value.clone()));
            }
            FacetKind::Folders => {
                conditions.push("folder = ?".into());
                binds.push(Bind::Text(filter.value.clone()));
            }
        }
    }
    if !search.is_empty() {
        if let Some(query) = fts_match_query(search) {
            conditions.push(
                "rowid IN (SELECT rowid FROM library_tracks_fts WHERE library_tracks_fts MATCH ?)"
                    .into(),
            );
            binds.push(Bind::Text(query));
        } else {
            let like = format!(
                "%{}%",
                search
                    .replace('\\', "\\\\")
                    .replace('%', "\\%")
                    .replace('_', "\\_")
            );
            conditions.push("(title LIKE ? ESCAPE '\\' OR artist LIKE ? ESCAPE '\\' OR album LIKE ? ESCAPE '\\' OR path LIKE ? ESCAPE '\\')".into());
            binds.extend(std::iter::repeat(Bind::Text(like)).take(4));
        }
    }
    if let Some(f) = query.filters {
        if let Some(v) = f.year_min {
            conditions.push("year >= ?".into());
            binds.push(Bind::Int(v.into()));
        }
        if let Some(v) = f.year_max {
            conditions.push("year <= ?".into());
            binds.push(Bind::Int(v.into()));
        }
        if let Some(v) = f.duration_min {
            conditions.push("duration >= ?".into());
            binds.push(Bind::Real(v));
        }
        if let Some(v) = f.duration_max {
            conditions.push("duration <= ?".into());
            binds.push(Bind::Real(v));
        }
        if let Some(v) = f.bitrate_min {
            conditions.push("bitrate_kbps >= ?".into());
            binds.push(Bind::Int(v.into()));
        }
        if !f.formats.is_empty() {
            let marks = vec!["?"; f.formats.len()].join(",");
            conditions.push(format!("format IN ({marks})"));
            binds.extend(f.formats.iter().map(|v| Bind::Text(v.to_ascii_lowercase())));
        }
        if let Some(v) = &f.root_id {
            conditions.push("root_id = ?".into());
            binds.push(Bind::Text(v.clone()));
        }
        if let Some(v) = &f.added_since {
            conditions.push("added_at >= ?".into());
            binds.push(Bind::Text(v.clone()));
        }
        match f.availability {
            Some(Availability::Available) => conditions.push("available = 1".into()),
            Some(Availability::Missing) => conditions.push("available = 0".into()),
            None => {}
        }
        if let Some(v) = f.rating_min.filter(|v| *v > 0) {
            conditions.push("rating >= ?".into());
            binds.push(Bind::Int(v.into()));
        }
        if let Some(v) = f.color.as_ref().filter(|v| !v.is_empty()) {
            conditions.push("color = ?".into());
            binds.push(Bind::Text(v.clone()));
        }
        if let Some(v) = f.tag.as_ref().filter(|v| !v.trim().is_empty()) {
            conditions.push("id IN (SELECT tt.track_id FROM library_track_tags tt JOIN library_tags t ON t.id = tt.tag_id WHERE t.name = ?)".into());
            binds.push(Bind::Text(v.trim().to_owned()));
        }
        if let Some(v) = f.bpm_min {
            conditions.push("bpm >= ?".into());
            binds.push(Bind::Real(v));
        }
        if let Some(v) = f.bpm_max {
            conditions.push("bpm <= ?".into());
            binds.push(Bind::Real(v));
        }
        if let Some(v) = f.key.as_ref().filter(|v| !v.trim().is_empty()) {
            conditions.push("musical_key = ?".into());
            // Accept any spelling ("A minor", "8A", "Bbm"); an unknown one matches nothing.
            binds.push(Bind::Text(analysis_dsp::normalize_key(v).unwrap_or_else(|| v.trim().to_owned())));
        }
        if let Some(v) = f.loudness_min {
            conditions.push("loudness_lufs >= ?".into());
            binds.push(Bind::Real(v));
        }
        if let Some(v) = f.loudness_max {
            conditions.push("loudness_lufs <= ?".into());
            binds.push(Bind::Real(v));
        }
        match f.analysis {
            Some(AnalysisState::Analyzed) => conditions.push("analyzed = 1".into()),
            Some(AnalysisState::Unanalyzed) => conditions.push("analyzed = 0".into()),
            None => {}
        }
    }
    let where_sql = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };
    (where_sql, binds)
}

/// One page of tracks (100) matching `query`, in its sort.
pub async fn list_query(
    pool: &SqlitePool,
    query: &ListQuery<'_>,
    offset: i64,
) -> Result<LibraryPage, String> {
    let (where_sql, binds) = where_clause(query);
    let count_sql = format!("SELECT COUNT(*) FROM library_tracks {where_sql}");
    let total = bind_all!(sqlx::query_scalar::<_, i64>(&count_sql), &binds)
        .fetch_one(pool)
        .await
        .map_err(|err| err.to_string())?;
    let page_sql = format!(
        "SELECT * FROM library_tracks {where_sql} {} LIMIT 100 OFFSET ?",
        order_clause(query.sort)
    );
    let tracks = bind_all!(sqlx::query_as::<_, LibraryTrack>(&page_sql), &binds)
        .bind(offset.max(0))
        .fetch_all(pool)
        .await
        .map_err(|err| err.to_string())?;
    Ok(LibraryPage { tracks, total })
}

pub async fn list_filtered(
    pool: &SqlitePool,
    search: &str,
    filter: Option<&FacetFilter>,
    sort: Option<&TrackSort>,
    offset: i64,
) -> Result<LibraryPage, String> {
    let query = ListQuery {
        search,
        filter,
        filters: None,
        sort,
    };
    list_query(pool, &query, offset).await
}

/// Every id matching `query`, in exactly the order paging shows them -- the
/// basis of "select all N" and "play all" across pages.
pub async fn matching_ids_query(
    pool: &SqlitePool,
    query: &ListQuery<'_>,
) -> Result<Vec<String>, String> {
    let (where_sql, binds) = where_clause(query);
    let sql = format!(
        "SELECT id FROM library_tracks {where_sql} {}",
        order_clause(query.sort)
    );
    bind_all!(sqlx::query_scalar::<_, String>(&sql), &binds)
        .fetch_all(pool)
        .await
        .map_err(|err| err.to_string())
}

pub async fn matching_ids(
    pool: &SqlitePool,
    search: &str,
    filter: Option<&FacetFilter>,
    sort: Option<&TrackSort>,
) -> Result<Vec<String>, String> {
    let query = ListQuery {
        search,
        filter,
        filters: None,
        sort,
    };
    matching_ids_query(pool, &query).await
}

pub async fn filter_options(pool: &SqlitePool) -> Result<FilterOptions, String> {
    let formats = sqlx::query_scalar::<_, String>(
        "SELECT DISTINCT format FROM library_tracks ORDER BY format",
    )
    .fetch_all(pool)
    .await
    .map_err(|err| err.to_string())?;
    let (year_min, year_max) = sqlx::query_as::<_, (Option<i32>, Option<i32>)>(
        "SELECT MIN(year), MAX(year) FROM library_tracks",
    )
    .fetch_one(pool)
    .await
    .map_err(|err| err.to_string())?;
    Ok(FilterOptions {
        formats,
        year_min,
        year_max,
    })
}

/// A track ready to hand to the player: its row plus the verified file path.
#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct PlaybackItem {
    pub track: LibraryTrack,
    pub path: String,
}

#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct PlaybackBatch {
    /// Playable tracks, in the order the ids were given.
    pub items: Vec<PlaybackItem>,
    /// Requested tracks whose file is missing (now persisted as unavailable).
    #[specta(type = Number<usize>)]
    pub unavailable: usize,
}

/// Loads rows for `ids` (chunked under SQLite's variable limit), keeps the
/// requested order, checks each file exists in one blocking pass and persists
/// any availability change. Unknown ids are ignored.
pub async fn prepare_playback(pool: &SqlitePool, ids: &[String]) -> Result<PlaybackBatch, String> {
    let mut rows: std::collections::HashMap<String, LibraryTrack> =
        std::collections::HashMap::with_capacity(ids.len());
    for chunk in ids.chunks(500) {
        let marks = vec!["?"; chunk.len()].join(",");
        let sql = format!("SELECT * FROM library_tracks WHERE id IN ({marks})");
        let mut query = sqlx::query_as::<_, LibraryTrack>(&sql);
        for id in chunk {
            query = query.bind(id);
        }
        for track in query.fetch_all(pool).await.map_err(|err| err.to_string())? {
            rows.insert(track.id.clone(), track);
        }
    }
    let ordered: Vec<LibraryTrack> = ids.iter().filter_map(|id| rows.remove(id)).collect();
    let checked = tauri::async_runtime::spawn_blocking(move || {
        ordered
            .into_iter()
            .map(|track| {
                let exists = std::fs::metadata(&track.path)
                    .map(|meta| meta.is_file())
                    .unwrap_or(false);
                (track, exists)
            })
            .collect::<Vec<_>>()
    })
    .await
    .map_err(|err| err.to_string())?;
    let mut batch = PlaybackBatch {
        items: Vec::with_capacity(checked.len()),
        unavailable: 0,
    };
    for (track, exists) in checked {
        if exists != track.available {
            mark_availability(pool, &track.id, exists).await?;
        }
        if exists {
            batch.items.push(PlaybackItem {
                path: track.path.clone(),
                track,
            });
        } else {
            batch.unavailable += 1;
        }
    }
    Ok(batch)
}

/// Groups the whole catalog for a browse tab, straight from the indexes in
/// `0005_browse_indexes.sql`.
pub async fn facets(pool: &SqlitePool, kind: FacetKind) -> Result<Vec<FacetGroup>, String> {
    let totals = "COUNT(*) AS track_count, COALESCE(SUM(duration), 0.0) AS duration_sec, COALESCE(SUM(size_bytes), 0) AS size_bytes";
    let sql = match kind {
        FacetKind::Artists => format!("SELECT MIN({ARTIST_KEY}) AS name, '' AS secondary, NULL AS year, {totals} FROM library_tracks GROUP BY {ARTIST_KEY} COLLATE NOCASE ORDER BY name COLLATE NOCASE"),
        FacetKind::Albums => format!("SELECT MIN(album) AS name, MIN({ARTIST_KEY}) AS secondary, MAX(year) AS year, {totals} FROM library_tracks GROUP BY album COLLATE NOCASE, {ARTIST_KEY} COLLATE NOCASE ORDER BY name COLLATE NOCASE, secondary COLLATE NOCASE"),
        FacetKind::Genres => format!("SELECT MIN(genre) AS name, '' AS secondary, NULL AS year, {totals} FROM library_tracks GROUP BY genre COLLATE NOCASE ORDER BY name COLLATE NOCASE"),
        FacetKind::Folders => format!("SELECT folder AS name, '' AS secondary, NULL AS year, {totals} FROM library_tracks GROUP BY folder ORDER BY name COLLATE NOCASE"),
    };
    sqlx::query_as::<_, FacetGroup>(&sql)
        .fetch_all(pool)
        .await
        .map_err(|err| err.to_string())
}

pub async fn totals(pool: &SqlitePool) -> Result<LibraryTotals, String> {
    sqlx::query_as::<_, LibraryTotals>(
        "SELECT COUNT(*) AS track_count, COALESCE(SUM(duration), 0.0) AS duration_sec, COALESCE(SUM(size_bytes), 0) AS size_bytes FROM library_tracks",
    )
    .fetch_one(pool)
    .await
    .map_err(|err| err.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn library_list(
    app: tauri::AppHandle,
    search: String,
    offset: i32,
    filter: Option<FacetFilter>,
    filters: Option<TrackFilters>,
    sort: Option<TrackSort>,
) -> Result<LibraryPage, String> {
    let query = ListQuery {
        search: &search,
        filter: filter.as_ref(),
        filters: filters.as_ref(),
        sort: sort.as_ref(),
    };
    list_query(&pool(&app).await?, &query, offset.into()).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_filter_options(app: tauri::AppHandle) -> Result<FilterOptions, String> {
    filter_options(&pool(&app).await?).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_matching_ids(
    app: tauri::AppHandle,
    search: String,
    filter: Option<FacetFilter>,
    filters: Option<TrackFilters>,
    sort: Option<TrackSort>,
) -> Result<Vec<String>, String> {
    let query = ListQuery {
        search: &search,
        filter: filter.as_ref(),
        filters: filters.as_ref(),
        sort: sort.as_ref(),
    };
    matching_ids_query(&pool(&app).await?, &query).await
}

/// Verifies and orders a batch of tracks for the player and grants the
/// asset protocol access to each file (same as `library_resolve`, in bulk).
#[tauri::command]
#[specta::specta]
pub async fn library_prepare_playback(
    app: tauri::AppHandle,
    ids: Vec<String>,
) -> Result<PlaybackBatch, String> {
    let batch = prepare_playback(&pool(&app).await?, &ids).await?;
    let scope = app.asset_protocol_scope();
    for item in &batch.items {
        scope.allow_file(&item.path).map_err(|err| err.to_string())?;
    }
    Ok(batch)
}

#[tauri::command]
#[specta::specta]
pub async fn library_facets(
    app: tauri::AppHandle,
    kind: FacetKind,
) -> Result<Vec<FacetGroup>, String> {
    facets(&pool(&app).await?, kind).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_totals(app: tauri::AppHandle) -> Result<LibraryTotals, String> {
    totals(&pool(&app).await?).await
}
