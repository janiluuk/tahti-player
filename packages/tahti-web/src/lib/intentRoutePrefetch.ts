function saveDataEnabled(): boolean {
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  return connection?.saveData === true;
}

let channelChunkPrefetched = false;
let radioStationChunkPrefetched = false;

export function prefetchChannelViewChunk(): void {
  if (typeof navigator !== 'undefined' && saveDataEnabled()) {
    return;
  }
  if (channelChunkPrefetched) {
    return;
  }
  channelChunkPrefetched = true;
  void import('../views/ChannelView');
}

export function prefetchRadioStationViewChunk(): void {
  if (typeof navigator !== 'undefined' && saveDataEnabled()) {
    return;
  }
  if (radioStationChunkPrefetched) {
    return;
  }
  radioStationChunkPrefetched = true;
  void import('../views/RadioStationView');
}

export function prefetchListenCardIntent(kind: 'channel' | 'radio'): void {
  if (kind === 'channel') {
    prefetchChannelViewChunk();
    return;
  }
  prefetchRadioStationViewChunk();
}
