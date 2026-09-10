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

fn apply_tags(track: &mut LibraryTrack, tags: &[Tag]) {
    for tag in tags {
        match tag.std_key {
            Some(StandardTagKey::TrackTitle) => track.title = tag_string(tag),
            Some(StandardTagKey::Artist) => track.artist = tag_string(tag),
            Some(StandardTagKey::Album) => track.album = tag_string(tag),
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
    };
    if let Some(metadata) = probed.metadata.get().and_then(|metadata| metadata.current().cloned()) {
        apply_tags(&mut track, metadata.tags());
    }
    if let Some(metadata) = probed.format.metadata().current() {
        apply_tags(&mut track, metadata.tags());
    }
    loop {
        let packet = probed.format.next_packet().map_err(|err| format!("No decodable audio: {err}"))?;
        if packet.track_id() == source_id {
            decoder.decode(&packet).map_err(|err| format!("Cannot decode audio: {err}"))?;
            break;
        }
    }
    Ok(track)
}
