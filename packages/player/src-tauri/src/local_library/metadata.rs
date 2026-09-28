use std::fs::File;
use std::path::Path;

use symphonia::core::codecs::DecoderOptions;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::{MetadataOptions, StandardTagKey, Tag};
use symphonia::core::probe::Hint;

use super::analysis_dsp::normalize_key;
use super::LibraryTrack;

/// RIFF INFO values (unlike Vorbis/ID3) retain their NUL terminator in `tag.value`.
fn tag_string(tag: &Tag) -> String {
    tag.value.to_string().trim_end_matches('\0').to_owned()
}

/// First run of digits in `"3/12"`, `"03"`, `"CD 2"`.
fn leading_number(value: &str) -> Option<i64> {
    value
        .split(|c: char| !c.is_ascii_digit())
        .find(|part| !part.is_empty())?
        .parse()
        .ok()
}

/// First plausible 4-digit year in `"2019"`, `"2019-05-01"`, `"May 2019"`.
fn parse_year(value: &str) -> Option<i64> {
    value
        .split(|c: char| !c.is_ascii_digit())
        .find(|part| part.len() == 4)?
        .parse::<i64>()
        .ok()
        .filter(|year| (1000..=2999).contains(year))
}

const MAX_COMMENT_CHARS: usize = 500;

fn apply_tags(track: &mut LibraryTrack, tags: &[Tag]) {
    for tag in tags {
        match tag.std_key {
            Some(StandardTagKey::TrackTitle) => track.title = tag_string(tag),
            Some(StandardTagKey::Artist) => track.artist = tag_string(tag),
            Some(StandardTagKey::AlbumArtist) => track.album_artist = tag_string(tag),
            Some(StandardTagKey::Album) => track.album = tag_string(tag),
            Some(StandardTagKey::Genre) => track.genre = tag_string(tag),
            Some(StandardTagKey::Composer) => track.composer = tag_string(tag).trim().to_owned(),
            Some(StandardTagKey::Comment) => {
                track.comment = tag_string(tag).chars().take(MAX_COMMENT_CHARS).collect();
            }
            Some(StandardTagKey::TrackNumber) => track.track_no = leading_number(&tag_string(tag)),
            Some(StandardTagKey::DiscNumber) => track.disc_no = leading_number(&tag_string(tag)),
            Some(StandardTagKey::Date) => track.year = parse_year(&tag_string(tag)),
            // A release date only stands in when there is no plain date tag.
            Some(StandardTagKey::OriginalDate) if track.year.is_none() => {
                track.year = parse_year(&tag_string(tag));
            }
            _ => {}
        }
    }
}

pub fn read(path: &Path) -> Result<LibraryTrack, String> {
    let path = path.canonicalize().map_err(|err| err.to_string())?;
    let extension = path.extension().and_then(|value| value.to_str()).unwrap_or_default().to_lowercase();
    if !super::import::is_supported_extension(&extension) {
        return Err(format!(
            "Native import supports {} files",
            super::import::SUPPORTED_AUDIO_EXTENSIONS.join(", ").to_uppercase()
        ));
    }
    let file = File::open(&path).map_err(|err| err.to_string())?;
    let size = file.metadata().map_err(|err| err.to_string())?.len();
    let format = detect_format(&path, &extension);
    let mut hint = Hint::new();
    hint.with_extension(&format);
    let mut probed = symphonia::default::get_probe()
        .format(&hint, MediaSourceStream::new(Box::new(file), Default::default()), &FormatOptions::default(), &MetadataOptions::default())
        .map_err(|err| format!("Not a playable {} file, its contents are not audio this app can read ({err})", extension.to_uppercase()))?;
    let source = probed.format.default_track().ok_or("No audio track")?;
    let params = source.codec_params.clone();
    let source_id = source.id;
    let mut decoder = symphonia::default::get_codecs().make(&params, &DecoderOptions::default()).map_err(|err| format!("Unsupported audio encoding: {err}"))?;
    let duration = params.time_base.zip(params.n_frames).map(|(base, frames)| {
        let time = base.calc_time(frames);
        time.seconds as f64 + time.frac
    }).unwrap_or(0.0);
    let mut track = LibraryTrack {
        id: uuid::Uuid::new_v4().to_string(),
        path: path.to_str().ok_or("Path is not valid UTF-8")?.to_owned(),
        title: path.file_stem().unwrap_or_default().to_string_lossy().into_owned(),
        artist: String::new(),
        album: String::new(),
        format,
        duration,
        sample_rate: params.sample_rate.unwrap_or(0) as i64,
        channels: params.channels.map(|channels| channels.count()).unwrap_or(0) as i64,
        bits_per_sample: params.bits_per_sample.map(i64::from),
        size_bytes: size as i64,
        available: true,
        unavailable_since: None,
        album_artist: String::new(),
        track_no: None,
        disc_no: None,
        year: None,
        genre: String::new(),
        composer: String::new(),
        comment: String::new(),
        added_at: String::new(),
        rating: 0,
        color: String::new(),
        play_count: 0,
        skip_count: 0,
        last_played_at: None,
        bpm: None,
        musical_key: None,
        loudness_lufs: None,
        analyzed: false,
        artwork_key: None,
        file_tags: FileTags::default(),
        bitrate_kbps: (duration > 0.0).then(|| (size as f64 * 8.0 / duration / 1000.0).round() as i64),
    };
    if let Some(metadata) = probed.metadata.get().and_then(|metadata| metadata.current().cloned()) {
        apply_tags(&mut track, metadata.tags());
    }
    if let Some(metadata) = probed.format.metadata().current() {
        apply_tags(&mut track, metadata.tags());
    }
    fill_from_tag_reader(&mut track, &path);
    track.artwork_key = super::artwork::extract(&path);
    if track.duration <= 0.0 {
        // MP3 and some M4A/OGG streams carry no frame count in their header,
        // so symphonia cannot report a length without decoding everything.
        track.duration = tag_reader_duration(&path).unwrap_or(0.0);
        track.bitrate_kbps = (track.duration > 0.0)
            .then(|| (size as f64 * 8.0 / track.duration / 1000.0).round() as i64);
    }
    loop {
        let packet = probed.format.next_packet().map_err(|err| format!("No playable audio in this file, it may be truncated or damaged ({err})"))?;
        if packet.track_id() == source_id {
            decoder.decode(&packet).map_err(|err| format!("Cannot decode audio: {err}"))?;
            break;
        }
    }
    Ok(track)
}

/// Opens a file for tag reading with the parser its contents call for, so a
/// WAV named `.flac` is not handed to the FLAC reader. The extension only
/// decides when the contents are not recognised.
pub(crate) fn open_tagged(path: &Path) -> Option<lofty::file::TaggedFile> {
    lofty::probe::Probe::open(path).ok()?.guess_file_type().ok()?.read().ok()
}

/// The container `path` really holds, judged by its leading bytes. When the
/// contents belong to the same family as `extension` (`aif`/`aiff`,
/// `ogg`/`oga`) or cannot be recognised, `extension` is kept.
pub(crate) fn detect_format(path: &Path, extension: &str) -> String {
    use lofty::file::FileType;
    let extension = extension.to_ascii_lowercase();
    let sniffed = File::open(path)
        .ok()
        .and_then(|file| lofty::probe::Probe::new(std::io::BufReader::new(file)).guess_file_type().ok())
        .and_then(|probe| probe.file_type());
    let family: &[&str] = match sniffed {
        Some(FileType::Flac) => &["flac"],
        Some(FileType::Wav) => &["wav"],
        Some(FileType::Mpeg) => &["mp3"],
        Some(FileType::Aiff) => &["aiff", "aif"],
        Some(FileType::Mp4) => &["m4a"],
        Some(FileType::Vorbis | FileType::Opus | FileType::Speex) => &["ogg", "oga"],
        Some(FileType::Aac) => &["aac"],
        _ => return extension,
    };
    if family.contains(&extension.as_str()) { extension } else { family[0].to_owned() }
}

fn tag_reader_duration(path: &Path) -> Option<f64> {
    use lofty::file::AudioFile;
    let tagged = open_tagged(path)?;
    let seconds = tagged.properties().duration().as_secs_f64();
    (seconds > 0.0).then_some(seconds)
}

/// Fills values symphonia did not surface. Its WAV reader stops at the audio
/// data, so INFO/ID3 tags stored after it (where tag writers put them, this
/// app's own write-back included) are invisible to it. Only empty values are
/// filled, so anything symphonia found wins.
fn fill_from_tag_reader(track: &mut LibraryTrack, path: &Path) {
    use lofty::file::TaggedFileExt;
    use lofty::prelude::*;
    use lofty::tag::ItemKey;
    let Some(tagged) = open_tagged(path) else {
        return;
    };
    track.file_tags = file_tags_of(&tagged);
    let Some(tag) = tagged.primary_tag().or_else(|| tagged.first_tag()) else {
        return;
    };
    let text = |v: Option<std::borrow::Cow<'_, str>>| v.map(|v| v.trim().to_owned()).filter(|v| !v.is_empty());
    let stem = path.file_stem().unwrap_or_default().to_string_lossy();
    if track.title == stem {
        if let Some(title) = text(tag.title()) {
            track.title = title;
        }
    }
    if track.artist.is_empty() {
        track.artist = text(tag.artist()).unwrap_or_default();
    }
    if track.album.is_empty() {
        track.album = text(tag.album()).unwrap_or_default();
    }
    if track.album_artist.is_empty() {
        track.album_artist = tag.get_string(&ItemKey::AlbumArtist).map(|v| v.trim().to_owned()).unwrap_or_default();
    }
    if track.genre.is_empty() {
        track.genre = text(tag.genre()).unwrap_or_default();
    }
    if track.composer.is_empty() {
        track.composer = tag.get_string(&ItemKey::Composer).map(|v| v.trim().to_owned()).unwrap_or_default();
    }
    if track.comment.is_empty() {
        track.comment = text(tag.comment()).unwrap_or_default().chars().take(500).collect();
    }
    track.year = track.year.or(tag.year().map(i64::from));
    track.track_no = track.track_no.or(tag.track().map(i64::from));
    track.disc_no = track.disc_no.or(tag.disk().map(i64::from));
}

/// BPM, musical key and ReplayGain as the file's tags state them. These are
/// file facts, refreshed on every (re)read; the user's BPM/key corrections
/// live elsewhere (`library_analysis_user`) and always win over them (see
/// `analysis::refresh_effective`). A missing or unusable value stays `None`.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct FileTags {
    pub bpm: Option<f64>,
    /// Normalized like analysis keys (`"Am"`, `"F#"`).
    pub key: Option<String>,
    pub replaygain_track_gain: Option<f64>,
    pub replaygain_track_peak: Option<f64>,
    pub replaygain_album_gain: Option<f64>,
    pub replaygain_album_peak: Option<f64>,
}

pub(super) fn read_file_tags(path: &Path) -> FileTags {
    open_tagged(path).map(|tagged| file_tags_of(&tagged)).unwrap_or_default()
}

/// Looks through every tag in the file, primary first: a WAV/AIFF often keeps
/// RIFF INFO (which has no BPM/ReplayGain fields) next to an ID3 chunk.
fn file_tags_of(tagged: &lofty::file::TaggedFile) -> FileTags {
    use lofty::file::TaggedFileExt;
    use lofty::tag::ItemKey;
    let primary = tagged.primary_tag();
    let tags: Vec<&lofty::tag::Tag> = primary
        .into_iter()
        .chain(tagged.tags().iter().filter(|t| Some(t.tag_type()) != primary.map(|p| p.tag_type())))
        .collect();
    let first = |keys: &[ItemKey], parse: &dyn Fn(&str) -> Option<f64>| {
        tags.iter().find_map(|tag| keys.iter().find_map(|key| tag.get_string(key).and_then(parse)))
    };
    FileTags {
        // ID3 TBPM and MP4 `tmpo` surface as IntegerBpm, Vorbis BPM and MP4 `----:BPM` as Bpm.
        bpm: first(&[ItemKey::Bpm, ItemKey::IntegerBpm], &parse_bpm),
        key: tags.iter().find_map(|tag| tag.get_string(&ItemKey::InitialKey).and_then(normalize_key)),
        replaygain_track_gain: first(&[ItemKey::ReplayGainTrackGain], &parse_gain),
        replaygain_track_peak: first(&[ItemKey::ReplayGainTrackPeak], &parse_peak),
        replaygain_album_gain: first(&[ItemKey::ReplayGainAlbumGain], &parse_gain),
        replaygain_album_peak: first(&[ItemKey::ReplayGainAlbumPeak], &parse_peak),
    }
}

/// Leading number of `"-6.54 dB"`, `"128,5"`, `"0.98"`.
fn parse_decimal(value: &str) -> Option<f64> {
    let text = value.trim().replace(',', ".");
    let end = text
        .char_indices()
        .find(|&(i, c)| !(c.is_ascii_digit() || c == '.' || (i == 0 && (c == '-' || c == '+'))))
        .map_or(text.len(), |(i, _)| i);
    text[..end].parse::<f64>().ok().filter(|v| v.is_finite())
}

/// Same accepted range as a user correction.
pub(super) fn parse_bpm(value: &str) -> Option<f64> {
    parse_decimal(value).filter(|v| (30.0..=300.0).contains(v))
}

fn parse_gain(value: &str) -> Option<f64> {
    parse_decimal(value).filter(|v| (-60.0..=60.0).contains(v))
}

/// Linear sample peak; above 1.0 is legal (clipped or inter-sample overs).
fn parse_peak(value: &str) -> Option<f64> {
    parse_decimal(value).filter(|v| *v > 0.0 && *v <= 10.0)
}

#[cfg(test)]
mod tests {
    use super::{leading_number, parse_bpm, parse_gain, parse_peak, parse_year};

    #[test]
    fn parses_tag_bpm_gain_and_peak_and_drops_unusable_values() {
        assert_eq!(parse_bpm("128"), Some(128.0));
        assert_eq!(parse_bpm(" 126.50 "), Some(126.5));
        assert_eq!(parse_bpm("174,2"), Some(174.2));
        assert_eq!(parse_bpm("0"), None);
        assert_eq!(parse_bpm("999"), None);
        assert_eq!(parse_bpm("fast"), None);
        assert_eq!(parse_gain("-6.54 dB"), Some(-6.54));
        assert_eq!(parse_gain("+2.10 dB"), Some(2.1));
        assert_eq!(parse_gain("dB"), None);
        assert_eq!(parse_gain("-600 dB"), None);
        assert_eq!(parse_peak("0.988547"), Some(0.988547));
        assert_eq!(parse_peak("1.05"), Some(1.05));
        assert_eq!(parse_peak("0"), None);
        assert_eq!(parse_peak("NaN"), None);
    }

    #[test]
    fn parses_track_and_disc_numbers() {
        assert_eq!(leading_number("3/12"), Some(3));
        assert_eq!(leading_number("07"), Some(7));
        assert_eq!(leading_number("CD 2"), Some(2));
        assert_eq!(leading_number("n/a"), None);
    }

    #[test]
    fn parses_years_from_common_date_shapes() {
        assert_eq!(parse_year("2019"), Some(2019));
        assert_eq!(parse_year("2019-05-01"), Some(2019));
        assert_eq!(parse_year("May 2019"), Some(2019));
        assert_eq!(parse_year("19"), None);
        assert_eq!(parse_year("0000"), None);
    }
}
