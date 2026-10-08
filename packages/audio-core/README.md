# `@tahti-player/audio-core`

Shared AudioContext / analyser contract for theDAW-ported editor and visualizers.

Hosts call `setExternalAnalyser` (see `tahti-web` `audioCoreBridge`) so Channel / player graphs feed the same `getAnalyser()` the visualizers read.
