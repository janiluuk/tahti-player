# Radio channels don't work when casting audio

**Status:** partial

Logged 2026-09-25 (user report): "when i cast my audio, the radio channels dont seem to work".

## What is known

- Neither tahti-web nor the desktop player has casting code of its own: no Google Cast / Chromecast sender, `RemotePlayback` API, AirPlay or DLNA/UPnP in `packages/tahti-web/src`, `packages/player/src`, `packages/player/src-tauri/src` or `packages/ui/src`. The `Cast` icon in the plugin store is for multistream (RTMP) destinations, not casting.
- So "cast" here is presumably the browser's or OS's own casting (Chrome "Cast tab", AirPlay, Android media cast). Not confirmed.

## Repro details (user, 2026-09-25)

- tahti-web in the browser, cast with **AirPlay**, result: **no sound**.
- "others as well": other radio stations fail too, not just the Tahti channels.
- Regular tracks also play no sound over AirPlay (user confirmed), so the cause is the Web Audio capture, not something radio-specific.

## Findings (code, `components/AudioEngine.tsx`)

- **Web Audio capture, all playback.** On the first `play`, the engine calls `ctx.createMediaElementSource(audio)` and routes the `<audio>` element through an `AnalyserNode` to `ctx.destination`, to drive the visualizers. From then on the element's sound comes out of the AudioContext, which may not follow the element's AirPlay route in WebKit. That would mean no sound on the receiver. It is also permanent: an element can't be released once captured. This affects tracks and radio alike. Unverified on a device.
- **HLS via hls.js even on Safari (Tahti channels).** `Hls.isSupported()` is checked before native HLS (`canPlayType('application/vnd.apple.mpegurl')`), so Safari plays Tahti HLS channels through Media Source Extensions. AirPlay can't cast a Media Source stream; the receiver has no URL to fetch. The usual hls.js advice is to prefer native HLS on Safari.
- Directory stations (e.g. `https://ice1.somafm.com/...-mp3`) are plain Icecast MP3, not HLS, so the HLS point alone does not explain them failing. The Web Audio capture would.

## Fix (2026-09-25, needs device verification)

`components/AudioEngine.tsx`: in browsers that can AirPlay (`'WebKitPlaybackTargetAvailabilityEvent' in window`, i.e. Safari on macOS and iOS):
- The `<audio>` element is never captured into Web Audio, so the analyser stays `null`. The channel visualizer falls back to its idle level, and the Go Live signal check shows nothing on Safari. Trade-off accepted so AirPlay has sound.
- `crossOrigin` is not forced (it only existed for the analyser).
- HLS plays natively instead of through hls.js/MediaSource, so Tahti's HLS channels can be AirPlayed.
- Other browsers are unchanged (analyser graph, hls.js).

Tests: `AudioEngine.airplay.test.tsx` (4 cases; the two AirPlay ones fail without the fix). Web suite 925 passing.

- [ ] User checks AirPlay on a real device: a track, a Tahti channel (HLS), a directory station.
- [ ] If visualizers on Safari matter: a later option is to capture only while a visualizer is on screen and AirPlay is not in use. A capture can't be undone, so it would need a fresh `<audio>` element when AirPlay starts.

## Open questions (earlier, mostly answered above)

- Which app: the tahti-web site in a browser, or the desktop app?
- How is it cast: Chrome/Edge "Cast…", AirPlay from Safari/macOS/iOS, Android, something else? To which device?
- What "don't work" looks like: no sound, stream never starts, stops when casting starts, error shown? Do regular tracks work while casting?
- Which channels: `tahti-radio` / `tahti-selects`, or all radio stations (including Radio Browser directory stations)?

## Leads once reproduced

- Radio is a live stream (Icecast / HLS on `stream.tahti.live`), not a file. Casting receivers fetch the URL themselves, so CORS, mixed content (http stream on an https page), HLS support on the receiver, or tokens/cookies the receiver doesn't have are likely suspects.
- `docs/todo/api-slow-requests.md` notes the HLS egress is slow (3-9 s) from the public internet, which may time out a cast receiver.
