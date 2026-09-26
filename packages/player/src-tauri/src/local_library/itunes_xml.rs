//! Streaming reader for an iTunes / Music.app library export
//! (`iTunes Music Library.xml`, an XML property list).
//!
//! Libraries can be well over 100 MB, so the file is never loaded as a whole
//! or turned into a DOM: `quick-xml` yields events from a buffered reader,
//! each track dict and playlist is built on its own, reduced to the fields
//! the import uses, and dropped.

use std::io::BufRead;

use quick_xml::events::Event;
use quick_xml::Reader;

const NOT_A_LIBRARY: &str = "This is not an iTunes or Music library XML file.";

#[derive(Debug, Clone, Default, PartialEq)]
pub struct XmlTrack {
    pub track_id: i64,
    pub persistent_id: String,
    pub name: String,
    pub artist: String,
    pub album_artist: String,
    pub album: String,
    pub genre: String,
    pub comments: String,
    pub year: Option<i64>,
    pub track_number: Option<i64>,
    pub disc_number: Option<i64>,
    pub bpm: Option<i64>,
    /// UTC, `YYYY-MM-DD HH:MM:SS` (the catalog's own date format).
    pub date_added: Option<String>,
    /// iTunes scale 0-100 (20 per star).
    pub rating: Option<i64>,
    /// True when `rating` is derived from the album rating, not set by the user.
    pub rating_computed: bool,
    pub play_count: i64,
    pub last_played: Option<String>,
    pub skip_count: i64,
    pub loved: bool,
    /// Milliseconds.
    pub total_time: Option<i64>,
    /// `file://` URL; absent for streams and cloud-only items.
    pub location: Option<String>,
}

impl XmlTrack {
    /// 0-5 stars, or `None` when the user never rated it.
    pub fn stars(&self) -> Option<i64> {
        if self.rating_computed {
            return None;
        }
        self.rating.map(|r| ((r.clamp(0, 100) + 10) / 20).clamp(0, 5)).filter(|&s| s > 0)
    }
}

#[derive(Debug, Clone, Default, PartialEq)]
pub struct XmlPlaylist {
    pub name: String,
    pub persistent_id: String,
    pub parent_persistent_id: Option<String>,
    pub folder: bool,
    /// The Library/master list and Music.app's own lists (Music, Movies,
    /// Podcasts, Purchased...), which are views, not user playlists.
    pub builtin: bool,
    pub track_ids: Vec<i64>,
}

#[derive(Debug, Default)]
pub struct XmlLibrary {
    /// `Music Folder` URL, useful to suggest a root remap.
    pub music_folder: Option<String>,
    pub tracks: Vec<XmlTrack>,
    pub playlists: Vec<XmlPlaylist>,
}

#[derive(Debug, Clone, PartialEq)]
enum Value {
    String(String),
    Integer(i64),
    Real(f64),
    Bool(bool),
    Date(String),
    Data,
    Dict(Vec<(String, Value)>),
    Array(Vec<Value>),
}

impl Value {
    fn text(&self) -> Option<&str> {
        match self {
            Value::String(s) | Value::Date(s) => Some(s),
            _ => None,
        }
    }

    fn int(&self) -> Option<i64> {
        match self {
            Value::Integer(n) => Some(*n),
            Value::Real(n) => Some(*n as i64),
            Value::String(s) => s.trim().parse().ok(),
            _ => None,
        }
    }

    fn truthy(&self) -> bool {
        matches!(self, Value::Bool(true))
    }
}

#[derive(Debug)]
enum Token {
    DictStart,
    DictEnd,
    ArrayStart,
    ArrayEnd,
    Key(String),
    Scalar(Value),
}

struct Tokens<R: BufRead> {
    reader: Reader<R>,
    buf: Vec<u8>,
}

fn xml_error(err: impl std::fmt::Display) -> String {
    format!("{NOT_A_LIBRARY} ({err})")
}

fn named_entity(name: &str) -> Option<char> {
    match name {
        "amp" => Some('&'),
        "lt" => Some('<'),
        "gt" => Some('>'),
        "quot" => Some('"'),
        "apos" => Some('\''),
        _ => None,
    }
}

impl<R: BufRead> Tokens<R> {
    fn new(source: R) -> Self {
        Self { reader: Reader::from_reader(source), buf: Vec::with_capacity(4096) }
    }

    /// Text content up to the end tag of the element just opened.
    fn read_text(&mut self) -> Result<String, String> {
        let mut out = String::new();
        loop {
            self.buf.clear();
            match self.reader.read_event_into(&mut self.buf).map_err(xml_error)? {
                Event::Text(text) => out.push_str(&text.decode().map_err(xml_error)?),
                Event::CData(data) => out.push_str(&data.decode().map_err(xml_error)?),
                Event::GeneralRef(reference) => {
                    let resolved = if reference.is_char_ref() {
                        reference.resolve_char_ref().map_err(xml_error)?
                    } else {
                        named_entity(&reference.decode().map_err(xml_error)?)
                    };
                    out.extend(resolved);
                }
                Event::End(_) => return Ok(out),
                Event::Eof => return Err(NOT_A_LIBRARY.into()),
                _ => {}
            }
        }
    }

    fn next(&mut self) -> Result<Option<Token>, String> {
        loop {
            self.buf.clear();
            let (name, empty) = match self.reader.read_event_into(&mut self.buf).map_err(xml_error)? {
                Event::Start(tag) => (String::from_utf8_lossy(tag.name().as_ref()).into_owned(), false),
                Event::Empty(tag) => (String::from_utf8_lossy(tag.name().as_ref()).into_owned(), true),
                Event::End(tag) => match tag.name().as_ref() {
                    b"dict" => return Ok(Some(Token::DictEnd)),
                    b"array" => return Ok(Some(Token::ArrayEnd)),
                    _ => continue,
                },
                Event::Eof => return Ok(None),
                _ => continue,
            };
            let token = match name.as_str() {
                "plist" => continue,
                "dict" if empty => Token::Scalar(Value::Dict(Vec::new())),
                "dict" => Token::DictStart,
                "array" if empty => Token::Scalar(Value::Array(Vec::new())),
                "array" => Token::ArrayStart,
                "true" => Token::Scalar(Value::Bool(true)),
                "false" => Token::Scalar(Value::Bool(false)),
                _ => {
                    let text = if empty { String::new() } else { self.read_text()? };
                    match name.as_str() {
                        "key" => Token::Key(text),
                        "string" => Token::Scalar(Value::String(text)),
                        "integer" => Token::Scalar(Value::Integer(text.trim().parse().unwrap_or_default())),
                        "real" => Token::Scalar(Value::Real(text.trim().parse().unwrap_or_default())),
                        "date" => Token::Scalar(Value::Date(text)),
                        "data" => Token::Scalar(Value::Data),
                        _ => continue,
                    }
                }
            };
            return Ok(Some(token));
        }
    }

    fn expect(&mut self) -> Result<Token, String> {
        self.next()?.ok_or_else(|| NOT_A_LIBRARY.to_owned())
    }

    fn value_from(&mut self, token: Token) -> Result<Value, String> {
        match token {
            Token::Scalar(value) => Ok(value),
            Token::DictStart => {
                let mut entries = Vec::new();
                loop {
                    match self.expect()? {
                        Token::DictEnd => return Ok(Value::Dict(entries)),
                        Token::Key(key) => {
                            let first = self.expect()?;
                            entries.push((key, self.value_from(first)?));
                        }
                        _ => return Err(NOT_A_LIBRARY.into()),
                    }
                }
            }
            Token::ArrayStart => {
                let mut items = Vec::new();
                loop {
                    match self.expect()? {
                        Token::ArrayEnd => return Ok(Value::Array(items)),
                        other => items.push(self.value_from(other)?),
                    }
                }
            }
            Token::DictEnd | Token::ArrayEnd | Token::Key(_) => Err(NOT_A_LIBRARY.into()),
        }
    }

    fn skip_value(&mut self) -> Result<(), String> {
        let first = self.expect()?;
        self.value_from(first).map(|_| ())
    }
}

fn to_catalog_date(value: &str) -> Option<String> {
    chrono::DateTime::parse_from_rfc3339(value.trim())
        .ok()
        .map(|d| d.with_timezone(&chrono::Utc).format("%Y-%m-%d %H:%M:%S").to_string())
}

fn track_from(entries: Vec<(String, Value)>) -> XmlTrack {
    let mut track = XmlTrack::default();
    for (key, value) in entries {
        let text = || value.text().map(|s| s.trim().to_owned()).unwrap_or_default();
        match key.as_str() {
            "Track ID" => track.track_id = value.int().unwrap_or_default(),
            "Persistent ID" => track.persistent_id = text(),
            "Name" => track.name = text(),
            "Artist" => track.artist = text(),
            "Album Artist" => track.album_artist = text(),
            "Album" => track.album = text(),
            "Genre" => track.genre = text(),
            "Comments" => track.comments = text(),
            "Year" => track.year = value.int(),
            "Track Number" => track.track_number = value.int(),
            "Disc Number" => track.disc_number = value.int(),
            "BPM" => track.bpm = value.int(),
            "Date Added" => track.date_added = value.text().and_then(to_catalog_date),
            "Rating" => track.rating = value.int(),
            "Rating Computed" => track.rating_computed = value.truthy(),
            "Play Count" => track.play_count = value.int().unwrap_or_default().max(0),
            "Play Date UTC" => track.last_played = value.text().and_then(to_catalog_date),
            "Skip Count" => track.skip_count = value.int().unwrap_or_default().max(0),
            "Loved" => track.loved = value.truthy(),
            "Total Time" => track.total_time = value.int(),
            "Location" => track.location = value.text().map(str::to_owned),
            _ => {}
        }
    }
    track
}

fn playlist_from(value: Value) -> Option<XmlPlaylist> {
    let Value::Dict(entries) = value else { return None };
    let mut playlist = XmlPlaylist::default();
    for (key, value) in entries {
        match key.as_str() {
            "Name" => playlist.name = value.text().unwrap_or_default().trim().to_owned(),
            "Playlist Persistent ID" => playlist.persistent_id = value.text().unwrap_or_default().to_owned(),
            "Parent Persistent ID" => playlist.parent_persistent_id = value.text().map(str::to_owned),
            "Folder" => playlist.folder = value.truthy(),
            "Master" if value.truthy() => playlist.builtin = true,
            "Distinguished Kind" => playlist.builtin = true,
            "Visible" if value == Value::Bool(false) => playlist.builtin = true,
            "Playlist Items" => {
                if let Value::Array(items) = value {
                    playlist.track_ids = items
                        .into_iter()
                        .filter_map(|item| match item {
                            Value::Dict(fields) => fields.into_iter().find(|(k, _)| k == "Track ID").and_then(|(_, v)| v.int()),
                            _ => None,
                        })
                        .collect();
                }
            }
            _ => {}
        }
    }
    (!playlist.persistent_id.is_empty()).then_some(playlist)
}

pub fn parse_library<R: BufRead>(source: R) -> Result<XmlLibrary, String> {
    let mut tokens = Tokens::new(source);
    if !matches!(tokens.next()?, Some(Token::DictStart)) {
        return Err(NOT_A_LIBRARY.into());
    }
    let mut library = XmlLibrary::default();
    let mut saw_tracks = false;
    loop {
        let key = match tokens.expect()? {
            Token::DictEnd => break,
            Token::Key(key) => key,
            _ => return Err(NOT_A_LIBRARY.into()),
        };
        match key.as_str() {
            "Tracks" => {
                saw_tracks = true;
                match tokens.expect()? {
                    Token::DictStart => {}
                    Token::Scalar(Value::Dict(_)) => continue,
                    _ => return Err(NOT_A_LIBRARY.into()),
                }
                loop {
                    match tokens.expect()? {
                        Token::DictEnd => break,
                        Token::Key(_) => {
                            let first = tokens.expect()?;
                            if let Value::Dict(entries) = tokens.value_from(first)? {
                                library.tracks.push(track_from(entries));
                            }
                        }
                        _ => return Err(NOT_A_LIBRARY.into()),
                    }
                }
            }
            "Playlists" => {
                match tokens.expect()? {
                    Token::ArrayStart => {}
                    Token::Scalar(Value::Array(_)) => continue,
                    _ => return Err(NOT_A_LIBRARY.into()),
                }
                loop {
                    match tokens.expect()? {
                        Token::ArrayEnd => break,
                        other => {
                            let value = tokens.value_from(other)?;
                            library.playlists.extend(playlist_from(value));
                        }
                    }
                }
            }
            "Music Folder" => {
                let first = tokens.expect()?;
                library.music_folder = tokens.value_from(first)?.text().map(str::to_owned);
            }
            _ => tokens.skip_value()?,
        }
    }
    if !saw_tracks {
        return Err(NOT_A_LIBRARY.into());
    }
    Ok(library)
}

/// A track `Location` (`file://` URL) as a local path: percent-escapes
/// decoded, `localhost` host dropped, `/C:/...` turned into `C:/...` and a
/// named host kept as a UNC-style `//host/...`. `None` for other schemes.
pub fn location_to_path(location: &str) -> Option<String> {
    let location = location.trim();
    let scheme = location.get(..7)?;
    if !scheme.eq_ignore_ascii_case("file://") {
        return None;
    }
    let rest = &location[7..];
    let index = rest.find('/')?;
    let (host, path) = (&rest[..index], &rest[index..]);
    let decoded = percent_encoding::percent_decode_str(path).decode_utf8_lossy().into_owned();
    let bytes = decoded.as_bytes();
    let mut out = if bytes.len() >= 3 && bytes[0] == b'/' && bytes[1].is_ascii_alphabetic() && bytes[2] == b':' {
        decoded[1..].to_owned()
    } else if host.is_empty() || host.eq_ignore_ascii_case("localhost") {
        decoded
    } else {
        let host = percent_encoding::percent_decode_str(host).decode_utf8_lossy();
        format!("//{host}{decoded}")
    };
    if cfg!(windows) {
        out = out.replace('/', "\\");
    }
    (!out.is_empty()).then_some(out)
}
