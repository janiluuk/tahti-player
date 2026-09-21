//! Audio analysis DSP (desktop-pro-library.md Phase 5): waveform peaks,
//! BS.1770 integrated loudness, approximate true peak, BPM and musical key.
//!
//! Everything here is a single streaming pass over interleaved `f32` samples
//! (`Analyzer::push`), so a file is decoded once and never held in memory in
//! full: the largest buffers are the 100 Hz onset envelope (capped at six
//! minutes) and a ~90 s decimated mono excerpt for the key estimate (~4 MB).
//! No external DSP crates; the FFT is a small radix-2 implementation.
//!
//! **Accuracy limits** (also published in the UI): loudness follows
//! ITU-R BS.1770-4 with the -70 LUFS / -10 LU gates (no LFE channel handling,
//! channels beyond the fifth ignored) and matches the reference sine
//! calibration within 0.1 LU; true peak is a 4x windowed-sinc estimate that can
//! read up to ~0.3 dB under a real reconstruction filter; BPM and key are
//! *estimates*: BPM is an onset-autocorrelation tempo (about +-1 BPM on steady
//! material, and it can land on half/double tempo or fail on free-tempo music);
//! key is a chroma/Krumhansl-Kessler estimate that is right roughly two times
//! in three on real music and can confuse relative major/minor.

use std::f64::consts::PI;

/// Bumped whenever a change here would produce different numbers, so cached
/// results made by older code are recomputed (never silently trusted).
pub const ALGORITHM_VERSION: i64 = 1;
pub const PEAK_BUCKETS: usize = 400;

const PEAK_BLOCK_FRAMES: usize = 1024;
const ONSET_RATE: f64 = 100.0;
const ONSET_MAX_SECONDS: f64 = 360.0;
const KEY_EXCERPT_SECONDS: f64 = 90.0;
const KEY_TARGET_RATE: f64 = 11_025.0;
const KEY_FFT: usize = 4096;
const KEY_HOP: usize = 2048;
const BPM_MIN: f64 = 70.0;
const BPM_MAX: f64 = 180.0;

#[derive(Debug, Clone, PartialEq)]
pub struct Estimate<T> {
    pub value: T,
    /// 0..1 heuristic; only comparable between files of the same kind.
    pub confidence: f64,
}

#[derive(Debug, Clone)]
pub struct Analysis {
    /// `PEAK_BUCKETS` bytes, 0..255 = sample peak amplitude of each slice.
    pub peaks: Vec<u8>,
    pub loudness_lufs: Option<f64>,
    pub true_peak_dbtp: Option<f64>,
    pub bpm: Option<Estimate<f64>>,
    /// e.g. `"Am"`, `"F#"` (see `key_name`).
    pub key: Option<Estimate<String>>,
}

// ---------------------------------------------------------------- biquad

#[derive(Clone, Copy)]
struct Biquad {
    b: [f64; 3],
    a: [f64; 2],
    z: [f64; 2],
}

impl Biquad {
    fn process(&mut self, x: f64) -> f64 {
        // Transposed direct form II.
        let y = self.b[0] * x + self.z[0];
        self.z[0] = self.b[1] * x - self.a[0] * y + self.z[1];
        self.z[1] = self.b[2] * x - self.a[1] * y;
        y
    }
}

/// BS.1770 K-weighting: a high shelf then a 38 Hz high-pass, for any rate.
fn k_weighting(fs: f64) -> [Biquad; 2] {
    let (f0, gain_db, q) = (1681.974450955533, 3.999843853973347, 0.7071752369554196);
    let k = (PI * f0 / fs).tan();
    let vh = 10f64.powf(gain_db / 20.0);
    let vb = vh.powf(0.4996667741545416);
    let a0 = 1.0 + k / q + k * k;
    let shelf = Biquad {
        b: [
            (vh + vb * k / q + k * k) / a0,
            2.0 * (k * k - vh) / a0,
            (vh - vb * k / q + k * k) / a0,
        ],
        a: [2.0 * (k * k - 1.0) / a0, (1.0 - k / q + k * k) / a0],
        z: [0.0; 2],
    };
    let (f0, q) = (38.13547087602444, 0.5003270373238773);
    let k = (PI * f0 / fs).tan();
    let d = 1.0 + k / q + k * k;
    let high_pass = Biquad {
        b: [1.0, -2.0, 1.0],
        a: [2.0 * (k * k - 1.0) / d, (1.0 - k / q + k * k) / d],
        z: [0.0; 2],
    };
    [shelf, high_pass]
}

fn channel_weight(channel: usize) -> f64 {
    match channel {
        0..=2 => 1.0,
        3 | 4 => 1.41,
        _ => 0.0,
    }
}

fn lufs(energy: f64) -> f64 {
    -0.691 + 10.0 * energy.log10()
}

// ---------------------------------------------------------------- true peak

const TP_TAPS: usize = 16;

/// Windowed-sinc kernels for the three inter-sample positions (1/4, 1/2, 3/4).
fn true_peak_kernels() -> [[f32; TP_TAPS]; 3] {
    let mut kernels = [[0f32; TP_TAPS]; 3];
    for (phase, kernel) in kernels.iter_mut().enumerate() {
        let frac = (phase + 1) as f64 / 4.0;
        let mut sum = 0.0;
        let mut values = [0f64; TP_TAPS];
        for (tap, value) in values.iter_mut().enumerate() {
            // Taps sit at offsets -7..=8 around the interpolation point.
            let x = tap as f64 - (TP_TAPS / 2 - 1) as f64 - frac;
            let sinc = if x.abs() < 1e-12 { 1.0 } else { (PI * x).sin() / (PI * x) };
            let window = 0.5 + 0.5 * (PI * x / (TP_TAPS as f64 / 2.0)).cos();
            *value = sinc * window;
            sum += *value;
        }
        for (out, value) in kernel.iter_mut().zip(values) {
            *out = (value / sum) as f32;
        }
    }
    kernels
}

// ---------------------------------------------------------------- FFT

struct Fft {
    size: usize,
    cos: Vec<f32>,
    sin: Vec<f32>,
    window: Vec<f32>,
}

impl Fft {
    fn new(size: usize) -> Self {
        let cos = (0..size / 2).map(|i| (-2.0 * PI * i as f64 / size as f64).cos() as f32).collect();
        let sin = (0..size / 2).map(|i| (-2.0 * PI * i as f64 / size as f64).sin() as f32).collect();
        let window = (0..size)
            .map(|i| (0.5 - 0.5 * (2.0 * PI * i as f64 / size as f64).cos()) as f32)
            .collect();
        Self { size, cos, sin, window }
    }

    fn transform(&self, re: &mut [f32], im: &mut [f32]) {
        let n = self.size;
        let bits = n.trailing_zeros();
        for i in 0..n {
            let j = i.reverse_bits() >> (usize::BITS - bits);
            if j > i {
                re.swap(i, j);
                im.swap(i, j);
            }
        }
        let mut len = 2;
        while len <= n {
            let step = n / len;
            for start in (0..n).step_by(len) {
                for k in 0..len / 2 {
                    let (wr, wi) = (self.cos[k * step], self.sin[k * step]);
                    let (a, b) = (start + k, start + k + len / 2);
                    let tr = re[b] * wr - im[b] * wi;
                    let ti = re[b] * wi + im[b] * wr;
                    re[b] = re[a] - tr;
                    im[b] = im[a] - ti;
                    re[a] += tr;
                    im[a] += ti;
                }
            }
            len <<= 1;
        }
    }
}

// ---------------------------------------------------------------- analyzer

pub struct Analyzer {
    rate: f64,
    channels: usize,
    // peaks
    block_peak: f32,
    block_frames: usize,
    block_peaks: Vec<f32>,
    // loudness
    filters: Vec<[Biquad; 2]>,
    sub_frames: usize,
    sub_len: usize,
    sub_sum: f64,
    sub_energies: Vec<f64>,
    // true peak
    kernels: [[f32; TP_TAPS]; 3],
    history: Vec<[f32; TP_TAPS]>,
    true_peak: f32,
    any_sample: bool,
    // onset envelope
    low: f64,
    low_alpha: f64,
    hop_len: usize,
    hop_frames: usize,
    hop_low: f64,
    hop_high: f64,
    prev_rms: [f64; 2],
    onset: Vec<f32>,
    // key excerpt (decimated mono)
    frame_index: u64,
    key_start: u64,
    key_end: u64,
    decimate: usize,
    decimate_count: usize,
    decimate_sum: f32,
    excerpt: Vec<f32>,
}

impl Analyzer {
    /// `expected_frames` (from the catalog's duration) only positions the key
    /// excerpt; a wrong or zero value still analyzes correctly.
    pub fn new(sample_rate: u32, channels: usize, expected_frames: u64) -> Self {
        let rate = f64::from(sample_rate.max(8000));
        let channels = channels.clamp(1, 8);
        let excerpt_frames = (KEY_EXCERPT_SECONDS * rate) as u64;
        let key_start = if expected_frames > excerpt_frames {
            (expected_frames - excerpt_frames) / 2
        } else if expected_frames == 0 {
            (15.0 * rate) as u64
        } else {
            0
        };
        Self {
            rate,
            channels,
            block_peak: 0.0,
            block_frames: 0,
            block_peaks: Vec::new(),
            filters: vec![k_weighting(rate); channels],
            sub_frames: 0,
            sub_len: (rate / 10.0).round() as usize,
            sub_sum: 0.0,
            sub_energies: Vec::new(),
            kernels: true_peak_kernels(),
            history: vec![[0.0; TP_TAPS]; channels],
            true_peak: 0.0,
            any_sample: false,
            low: 0.0,
            low_alpha: 1.0 - (-2.0 * PI * 200.0 / rate).exp(),
            hop_len: (rate / ONSET_RATE).round().max(1.0) as usize,
            hop_frames: 0,
            hop_low: 0.0,
            hop_high: 0.0,
            prev_rms: [0.0; 2],
            onset: Vec::new(),
            frame_index: 0,
            key_start,
            key_end: key_start + excerpt_frames,
            decimate: (rate / KEY_TARGET_RATE).round().max(1.0) as usize,
            decimate_count: 0,
            decimate_sum: 0.0,
            excerpt: Vec::new(),
        }
    }

    /// Feeds interleaved samples (a whole number of frames).
    pub fn push(&mut self, samples: &[f32]) {
        let channels = self.channels;
        for frame in samples.chunks_exact(channels) {
            self.push_frame(frame);
        }
    }

    fn push_frame(&mut self, frame: &[f32]) {
        self.any_sample = true;
        let mut frame_peak = 0f32;
        let mut mono = 0f32;
        let mut weighted = 0f64;
        for (c, &sample) in frame.iter().enumerate() {
            let sample = if sample.is_finite() { sample } else { 0.0 };
            frame_peak = frame_peak.max(sample.abs());
            mono += sample;
            // K-weighted energy.
            let weight = channel_weight(c);
            let mut y = f64::from(sample);
            for filter in self.filters[c].iter_mut() {
                y = filter.process(y);
            }
            weighted += weight * y * y;
            // Inter-sample peak between the previous samples.
            let history = &mut self.history[c];
            history.copy_within(1.., 0);
            history[TP_TAPS - 1] = sample;
            for kernel in &self.kernels {
                let value: f32 = history.iter().zip(kernel).map(|(h, k)| h * k).sum();
                self.true_peak = self.true_peak.max(value.abs());
            }
        }
        self.true_peak = self.true_peak.max(frame_peak);
        let mono = mono / frame.len() as f32;

        // Waveform peaks.
        self.block_peak = self.block_peak.max(frame_peak);
        self.block_frames += 1;
        if self.block_frames == PEAK_BLOCK_FRAMES {
            self.block_peaks.push(self.block_peak);
            self.block_peak = 0.0;
            self.block_frames = 0;
        }

        // Loudness sub-blocks (100 ms).
        self.sub_sum += weighted;
        self.sub_frames += 1;
        if self.sub_frames == self.sub_len {
            self.sub_energies.push(self.sub_sum / self.sub_len as f64);
            self.sub_sum = 0.0;
            self.sub_frames = 0;
        }

        // Onset envelope: energy of a low and a high band per 10 ms hop.
        if (self.onset.len() as f64) < ONSET_MAX_SECONDS * ONSET_RATE {
            let mono = f64::from(mono);
            self.low += self.low_alpha * (mono - self.low);
            let high = mono - self.low;
            self.hop_low += self.low * self.low;
            self.hop_high += high * high;
            self.hop_frames += 1;
            if self.hop_frames == self.hop_len {
                let n = self.hop_len as f64;
                let rms = [(self.hop_low / n).sqrt(), (self.hop_high / n).sqrt()];
                let mut flux = 0.0;
                for (now, before) in rms.iter().zip(self.prev_rms) {
                    let (a, b) = ((1.0 + 1000.0 * now).ln(), (1.0 + 1000.0 * before).ln());
                    flux += (a - b).max(0.0);
                }
                self.onset.push(flux as f32);
                self.prev_rms = rms;
                self.hop_low = 0.0;
                self.hop_high = 0.0;
                self.hop_frames = 0;
            }
        }

        // Key excerpt (block-averaged mono, ~11 kHz).
        if self.frame_index >= self.key_start && self.frame_index < self.key_end {
            self.decimate_sum += mono;
            self.decimate_count += 1;
            if self.decimate_count == self.decimate {
                self.excerpt.push(self.decimate_sum / self.decimate as f32);
                self.decimate_sum = 0.0;
                self.decimate_count = 0;
            }
        }
        self.frame_index += 1;
    }

    pub fn finish(mut self) -> Analysis {
        if self.block_frames > 0 {
            self.block_peaks.push(self.block_peak);
        }
        if self.sub_frames > 0 && self.sub_energies.is_empty() {
            self.sub_energies.push(self.sub_sum / self.sub_frames as f64);
        }
        let silent = !self.any_sample;
        let loudness_lufs = if silent { None } else { integrated_loudness(&self.sub_energies) };
        let true_peak_dbtp = if silent || self.true_peak <= 0.0 {
            None
        } else {
            Some(20.0 * f64::from(self.true_peak).log10())
        };
        let bpm = estimate_bpm(&self.onset);
        let key = estimate_key(&self.excerpt, self.rate / self.decimate as f64);
        Analysis {
            peaks: bucket_peaks(&self.block_peaks),
            loudness_lufs,
            true_peak_dbtp,
            bpm,
            key,
        }
    }
}

fn bucket_peaks(blocks: &[f32]) -> Vec<u8> {
    let mut out = vec![0u8; PEAK_BUCKETS];
    if blocks.is_empty() {
        return out;
    }
    for (bucket, slot) in out.iter_mut().enumerate() {
        let from = bucket * blocks.len() / PEAK_BUCKETS;
        let to = ((bucket + 1) * blocks.len() / PEAK_BUCKETS).max(from + 1).min(blocks.len());
        let peak = blocks[from.min(blocks.len() - 1)..to].iter().fold(0f32, |a, &b| a.max(b));
        *slot = (peak.min(1.0) * 255.0).round() as u8;
    }
    out
}

/// BS.1770-4 integrated loudness from 100 ms sub-block energies.
fn integrated_loudness(sub: &[f64]) -> Option<f64> {
    if sub.is_empty() {
        return None;
    }
    let blocks: Vec<f64> = if sub.len() < 4 {
        vec![sub.iter().sum::<f64>() / sub.len() as f64]
    } else {
        sub.windows(4).map(|w| w.iter().sum::<f64>() / 4.0).collect()
    };
    let absolute: Vec<f64> = blocks.iter().copied().filter(|&e| e > 0.0 && lufs(e) > -70.0).collect();
    if absolute.is_empty() {
        return None;
    }
    let relative_gate = lufs(absolute.iter().sum::<f64>() / absolute.len() as f64) - 10.0;
    let gated: Vec<f64> = absolute.into_iter().filter(|&e| lufs(e) > relative_gate).collect();
    if gated.is_empty() {
        return None;
    }
    Some(lufs(gated.iter().sum::<f64>() / gated.len() as f64))
}

// ---------------------------------------------------------------- tempo

fn estimate_bpm(onset: &[f32]) -> Option<Estimate<f64>> {
    // Need a few bars of material to say anything.
    if (onset.len() as f64) < 8.0 * ONSET_RATE {
        return None;
    }
    // Remove the slow trend (1 s moving mean) and keep positive excursions.
    let window = ONSET_RATE as usize;
    let mut prefix = Vec::with_capacity(onset.len() + 1);
    prefix.push(0f64);
    for &v in onset {
        prefix.push(prefix.last().unwrap() + f64::from(v));
    }
    let flat: Vec<f64> = (0..onset.len())
        .map(|i| {
            let (a, b) = (i.saturating_sub(window / 2), (i + window / 2).min(onset.len()));
            let mean = (prefix[b] - prefix[a]) / (b - a) as f64;
            (f64::from(onset[i]) - mean).max(0.0)
        })
        .collect();
    let energy: f64 = flat.iter().map(|v| v * v).sum();
    if energy <= 1e-9 {
        return None;
    }
    let lag_min = (60.0 * ONSET_RATE / BPM_MAX).floor() as usize;
    let lag_max = (60.0 * ONSET_RATE / BPM_MIN).ceil() as usize;
    let max_lag = lag_max * 4 + 2;
    let ac: Vec<f64> = (0..=max_lag.min(flat.len() - 1))
        .map(|lag| {
            let n = flat.len() - lag;
            flat[..n].iter().zip(&flat[lag..]).map(|(a, b)| a * b).sum::<f64>() / n as f64
        })
        .collect();
    let at = |lag: usize| ac.get(lag).copied().unwrap_or(0.0);
    // Score a candidate beat lag by its own peak plus the bar-length multiples,
    // with a soft preference for tempi near 120 BPM (log-normal, one octave wide).
    let score = |lag: usize| {
        let bpm = 60.0 * ONSET_RATE / lag as f64;
        let prior = (-0.5 * ((bpm / 120.0).log2() / 0.8).powi(2)).exp();
        (at(lag) + 0.5 * at(lag * 2) + 0.25 * at(lag * 4)) * prior
    };
    let best = (lag_min..=lag_max).max_by(|&a, &b| score(a).total_cmp(&score(b)))?;
    if at(best) <= 0.0 {
        return None;
    }
    // Parabolic interpolation around the raw autocorrelation peak.
    let refined = if best > 1 && best + 1 < ac.len() {
        let (a, b, c) = (at(best - 1), at(best), at(best + 1));
        let denom = a - 2.0 * b + c;
        if denom.abs() > 1e-12 { best as f64 + 0.5 * (a - c) / denom } else { best as f64 }
    } else {
        best as f64
    };
    let bpm = 60.0 * ONSET_RATE / refined;
    let range = &ac[lag_min..=lag_max.min(ac.len() - 1)];
    let mean = range.iter().sum::<f64>() / range.len() as f64;
    let confidence = if at(best) > 0.0 { (1.0 - mean / at(best)).clamp(0.0, 1.0) } else { 0.0 };
    Some(Estimate { value: (bpm * 10.0).round() / 10.0, confidence })
}

// ---------------------------------------------------------------- key

const MAJOR: [f64; 12] = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR: [f64; 12] = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const NOTES: [&str; 12] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/// `tonic` 0 = C; `minor` adds an `m` suffix.
pub fn key_name(tonic: usize, minor: bool) -> String {
    format!("{}{}", NOTES[tonic % 12], if minor { "m" } else { "" })
}

fn pearson(a: &[f64; 12], b: &[f64; 12]) -> f64 {
    let (ma, mb) = (a.iter().sum::<f64>() / 12.0, b.iter().sum::<f64>() / 12.0);
    let (mut num, mut da, mut db) = (0.0, 0.0, 0.0);
    for i in 0..12 {
        num += (a[i] - ma) * (b[i] - mb);
        da += (a[i] - ma).powi(2);
        db += (b[i] - mb).powi(2);
    }
    if da <= 0.0 || db <= 0.0 { 0.0 } else { num / (da * db).sqrt() }
}

fn estimate_key(excerpt: &[f32], rate: f64) -> Option<Estimate<String>> {
    if excerpt.len() < KEY_FFT * 4 {
        return None;
    }
    let fft = Fft::new(KEY_FFT);
    let mut chroma = [0f64; 12];
    let (mut re, mut im) = (vec![0f32; KEY_FFT], vec![0f32; KEY_FFT]);
    // Bin -> pitch class, for 65 Hz .. 1.2 kHz.
    let bin_class: Vec<Option<usize>> = (0..KEY_FFT / 2)
        .map(|bin| {
            let freq = bin as f64 * rate / KEY_FFT as f64;
            (65.0..=1200.0)
                .contains(&freq)
                .then(|| ((12.0 * (freq / 440.0).log2()).round() as i64 + 69).rem_euclid(12) as usize)
        })
        .collect();
    let mut frames = 0;
    for start in (0..=excerpt.len() - KEY_FFT).step_by(KEY_HOP) {
        for i in 0..KEY_FFT {
            re[i] = excerpt[start + i] * fft.window[i];
            im[i] = 0.0;
        }
        fft.transform(&mut re, &mut im);
        let mut frame = [0f64; 12];
        for (bin, class) in bin_class.iter().enumerate() {
            if let Some(class) = class {
                frame[*class] += f64::from((re[bin] * re[bin] + im[bin] * im[bin]).sqrt());
            }
        }
        let total: f64 = frame.iter().sum();
        if total > 1e-6 {
            for (c, f) in chroma.iter_mut().zip(frame) {
                *c += f / total;
            }
            frames += 1;
        }
    }
    if frames == 0 {
        return None;
    }
    let mut scores: Vec<(f64, usize, bool)> = Vec::with_capacity(24);
    for tonic in 0..12 {
        for (minor, profile) in [(false, &MAJOR), (true, &MINOR)] {
            let mut rotated = [0f64; 12];
            for (i, slot) in rotated.iter_mut().enumerate() {
                *slot = profile[(i + 12 - tonic) % 12];
            }
            scores.push((pearson(&chroma, &rotated), tonic, minor));
        }
    }
    scores.sort_by(|a, b| b.0.total_cmp(&a.0));
    let (best, second) = (scores[0], scores[1]);
    Some(Estimate {
        value: key_name(best.1, best.2),
        confidence: ((best.0 - second.0) * 8.0).clamp(0.0, 1.0),
    })
}

/// Normalizes a key written by a tagger (`"Am"`, `"A minor"`, `"Bbm"`, `"8A"`
/// Camelot, `"m"`-less majors) to `key_name` form. `None` when unrecognized.
pub fn normalize_key(raw: &str) -> Option<String> {
    let text = raw.trim();
    if text.is_empty() {
        return None;
    }
    // Camelot wheel: 1-12 then A (minor) or B (major).
    let upper = text.to_ascii_uppercase();
    if let Some(letter) = upper.chars().last().filter(|c| matches!(c, 'A' | 'B')) {
        if let Ok(number) = upper[..upper.len() - 1].parse::<usize>() {
            if (1..=12).contains(&number) {
                // 8A = A minor (tonic 9), 8B = C major; each step is a fifth.
                let major_tonic = [11, 6, 1, 8, 3, 10, 5, 0, 7, 2, 9, 4]; // 1B..12B
                let major = major_tonic[number - 1];
                return Some(if letter == 'B' { key_name(major, false) } else { key_name((major + 9) % 12, true) });
            }
        }
    }
    let mut chars = text.chars();
    let letter = chars.next()?.to_ascii_uppercase();
    let base = match letter {
        'C' => 0,
        'D' => 2,
        'E' => 4,
        'F' => 5,
        'G' => 7,
        'A' => 9,
        'B' => 11,
        _ => return None,
    };
    let rest: String = chars.collect();
    let (shift, rest) = match rest.chars().next() {
        Some('#') | Some('♯') => (1, rest.chars().skip(1).collect::<String>()),
        Some('b') | Some('♭') if rest.chars().count() == 1 || !rest.to_ascii_lowercase().starts_with("b ") => {
            (-1, rest.chars().skip(1).collect::<String>())
        }
        _ => (0, rest),
    };
    let tail = rest.trim().to_ascii_lowercase();
    let minor = match tail.as_str() {
        "" | "maj" | "major" => false,
        "m" | "min" | "minor" | "-" => true,
        _ => return None,
    };
    Some(key_name(((base + shift + 12) % 12) as usize, minor))
}

#[cfg(test)]
mod tests {
    use super::*;

    const RATE: u32 = 44_100;

    fn run(analyzer: &mut Analyzer, samples: &[f32]) {
        for chunk in samples.chunks(4096 * analyzer.channels) {
            analyzer.push(chunk);
        }
    }

    fn stereo(mono: &[f32]) -> Vec<f32> {
        mono.iter().flat_map(|&s| [s, s]).collect()
    }

    fn sine(freq: f64, amp: f32, seconds: f64) -> Vec<f32> {
        (0..(seconds * f64::from(RATE)) as usize)
            .map(|i| amp * (2.0 * PI * freq * i as f64 / f64::from(RATE)).sin() as f32)
            .collect()
    }

    #[test]
    fn loudness_matches_the_bs1770_sine_calibration() {
        // BS.1770 calibration: a 997 Hz sine at 0 dBFS in ONE channel reads -3.01
        // LUFS, so the same sine in both channels reads 0 LUFS; at 0.1 (-20 dB): -20.
        let mut a = Analyzer::new(RATE, 2, 0);
        run(&mut a, &stereo(&sine(997.0, 0.1, 10.0)));
        let result = a.finish();
        let lufs = result.loudness_lufs.unwrap();
        assert!((lufs - -20.0).abs() < 0.1, "got {lufs}");
        let peak = result.true_peak_dbtp.unwrap();
        assert!((peak - -20.0).abs() < 0.5, "got {peak}");
    }

    #[test]
    fn silence_has_no_loudness_and_flat_peaks() {
        let mut a = Analyzer::new(RATE, 2, 0);
        run(&mut a, &vec![0.0; 44_100 * 2 * 3]);
        let result = a.finish();
        assert_eq!(result.loudness_lufs, None);
        assert_eq!(result.true_peak_dbtp, None);
        assert_eq!(result.peaks.len(), PEAK_BUCKETS);
        assert!(result.peaks.iter().all(|&p| p == 0));
        assert!(result.bpm.is_none() && result.key.is_none());
    }

    #[test]
    fn quiet_material_below_the_absolute_gate_is_not_reported() {
        let mut a = Analyzer::new(RATE, 1, 0);
        run(&mut a, &sine(997.0, 0.00001, 5.0));
        assert_eq!(a.finish().loudness_lufs, None);
    }

    #[test]
    fn waveform_peaks_follow_the_amplitude_over_time() {
        let mut samples = sine(440.0, 0.25, 5.0);
        samples.extend(sine(440.0, 1.0, 5.0));
        let mut a = Analyzer::new(RATE, 1, 0);
        run(&mut a, &samples);
        let peaks = a.finish().peaks;
        assert!(peaks[10] > 55 && peaks[10] < 72, "{}", peaks[10]);
        assert!(peaks[390] > 245, "{}", peaks[390]);
    }

    #[test]
    fn true_peak_sees_inter_sample_overshoot() {
        // A sine at a quarter of the sample rate, phase-shifted so no sample
        // lands on the crest: sample peak ~0.707, true peak 1.0 (~0 dBTP).
        let samples: Vec<f32> = (0..RATE as usize * 2)
            .map(|i| (2.0 * PI * f64::from(RATE) / 4.0 * i as f64 / f64::from(RATE) + PI / 4.0).sin() as f32)
            .collect();
        let mut a = Analyzer::new(RATE, 1, 0);
        run(&mut a, &samples);
        let peak = a.finish().true_peak_dbtp.unwrap();
        assert!(peak > -1.2, "true peak {peak} dBTP should exceed the -3 dB sample peak");
    }

    fn click_track(bpm: f64, seconds: f64) -> Vec<f32> {
        let total = (seconds * f64::from(RATE)) as usize;
        let mut out = vec![0f32; total];
        let beat = 60.0 / bpm * f64::from(RATE);
        let mut n = 0.0;
        while (n as usize) < total {
            let start = n as usize;
            for i in 0..4000.min(total - start) {
                let t = i as f64 / f64::from(RATE);
                let kick = (2.0 * PI * 55.0 * t).sin() * (-t * 35.0).exp();
                out[start + i] += (0.8 * kick) as f32;
            }
            n += beat;
        }
        out
    }

    #[test]
    fn tempo_of_a_steady_kick_is_found_within_a_bpm_or_two() {
        for bpm in [100.0, 120.0, 128.0, 140.0] {
            let mut a = Analyzer::new(RATE, 1, 0);
            run(&mut a, &click_track(bpm, 40.0));
            let estimate = a.finish().bpm.unwrap_or_else(|| panic!("no estimate for {bpm}"));
            assert!((estimate.value - bpm).abs() < 2.0, "{bpm}: got {}", estimate.value);
            assert!(estimate.confidence > 0.3, "{bpm}: confidence {}", estimate.confidence);
        }
    }

    #[test]
    fn too_short_or_beatless_audio_gets_no_tempo() {
        let mut a = Analyzer::new(RATE, 1, 0);
        run(&mut a, &click_track(120.0, 3.0));
        assert!(a.finish().bpm.is_none());
    }

    fn chord(notes: &[(f64, f32)], seconds: f64) -> Vec<f32> {
        (0..(seconds * f64::from(RATE)) as usize)
            .map(|i| {
                let t = i as f64 / f64::from(RATE);
                notes
                    .iter()
                    .map(|&(f, a)| {
                        let harmonics: f64 = (1..=3).map(|h| (2.0 * PI * f * f64::from(h) * t).sin() / f64::from(h)).sum();
                        a * harmonics as f32
                    })
                    .sum::<f32>()
                    * 0.2
            })
            .collect()
    }

    #[test]
    fn key_of_simple_chords_is_found() {
        let a_minor = [(110.0, 1.5), (220.0, 1.0), (261.63, 0.8), (329.63, 0.8)];
        let g_major = [(98.0, 1.5), (196.0, 1.0), (246.94, 0.8), (293.66, 0.8)];
        for (notes, expected) in [(&a_minor[..], "Am"), (&g_major[..], "G")] {
            let mut a = Analyzer::new(RATE, 1, 0);
            run(&mut a, &chord(notes, 30.0));
            let key = a.finish().key.expect("key");
            assert_eq!(key.value, expected);
        }
    }

    #[test]
    fn normalizes_the_key_spellings_taggers_use() {
        for (raw, want) in [
            ("Am", "Am"),
            ("A minor", "Am"),
            ("a min", "Am"),
            ("C", "C"),
            ("C major", "C"),
            ("Bbm", "A#m"),
            ("Db", "C#"),
            ("F#", "F#"),
            ("8A", "Am"),
            ("8B", "C"),
            ("1A", "G#m"),
            ("12B", "E"),
        ] {
            assert_eq!(normalize_key(raw).as_deref(), Some(want), "{raw}");
        }
        for raw in ["", "H", "nonsense", "13A", "0B"] {
            assert_eq!(normalize_key(raw), None, "{raw}");
        }
    }
}
