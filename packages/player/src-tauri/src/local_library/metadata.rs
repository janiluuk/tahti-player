use std::fs::File;
use std::path::Path;

use symphonia::core::codecs::DecoderOptions;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::{MetadataOptions, StandardTagKey, Tag};
use symphonia::core::probe::Hint;

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
    if !matches!(extension.as_str(), "flac" | "wav") {
        return Err("Native import currently supports FLAC and WAV files".into());
    }
    let file = File::open(&path).map_err(|err| err.to_string())?;
    let size = file.metadata().map_err(|err| err.to_string())?.len();
    let mut hint = Hint::new();
    hint.with_extension(&extension);
    let mut probed = symphonia::default::get_probe()
        .format(&hint, MediaSourceStream::new(Box::new(file), Default::default()), &FormatOptions::default(), &MetadataOptions::default())
        .map_err(|err| format!("Cannot read audio: {err}"))?;
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
        format: extension,
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
        comment: String::new(),
        added_at: String::new(),
        rating: 0,
        color: String::new(),
        play_count: 0,
        last_played_at: None,
        bpm: None,
        musical_key: None,
        loudness_lufs: None,
        analyzed: false,
        bitrate_kbps: (duration > 0.0).then(|| (size as f64 * 8.0 / duration / 1000.0).round() as i64),
    };
    if let Some(metadata) = probed.metadata.get().and_then(|metadata| metadata.current().cloned()) {
        apply_tags(&mut track, metadata.tags());
    }
    if let Some(metadata) = probed.format.metadata().current() {
        apply_tags(&mut track, metadata.tags());
    }
    fill_from_tag_reader(&mut track, &path);
    loop {
        let packet = probed.format.next_packet().map_err(|err| format!("No decodable audio: {err}"))?;
        if packet.track_id() == source_id {
            decoder.decode(&packet).map_err(|err| format!("Cannot decode audio: {err}"))?;
            break;
        }
    }
    Ok(track)
}

/// Fills values symphonia did not surface. Its WAV reader stops at the audio
/// data, so INFO/ID3 tags stored after it (where tag writers put them, this
/// app's own write-back included) are invisible to it. Only empty values are
/// filled, so anything symphonia found wins.
fn fill_from_tag_reader(track: &mut LibraryTrack, path: &Path) {
    use lofty::file::TaggedFileExt;
    use lofty::prelude::*;
    use lofty::tag::ItemKey;
    let Some(tagged) = lofty::probe::Probe::open(path).ok().and_then(|p| p.read().ok()) else {
        return;
    };
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
    if track.comment.is_empty() {
        track.comment = text(tag.comment()).unwrap_or_default().chars().take(500).collect();
    }
    track.year = track.year.or(tag.year().map(i64::from));
    track.track_no = track.track_no.or(tag.track().map(i64::from));
    track.disc_no = track.disc_no.or(tag.disk().map(i64::from));
}

#[cfg(test)]
mod tests {
    use super::{leading_number, parse_year};

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
