import { isForceMock } from './mode';
import { requestJson } from './request-json';

export type ObsRecommendedSettings = {
  audioCodec: string;
  audioBitrateKbps: number;
  sampleRateHz: number;
  channels: string;
  videoCodec: string;
  videoBitrateKbps: number;
  keyframeIntervalSec: number;
  preset: string;
  profile: string;
  tune: string;
};

export type ObsPreset = {
  server: string;
  streamKey: string;
  recommended: ObsRecommendedSettings;
  /** OBS scene-collection JSON, importable as-is via Scene Collection → Import. */
  sceneCollection: Record<string, unknown>;
  sceneCollectionFilename: string;
};

const MOCK_SCENE = 'Tahti — demo-slug';

const MOCK_PRESET: ObsPreset = {
  server: 'rtmp://ingest.mock.tahti.live/live',
  streamKey: 'demo-slug__mock-stream-key-do-not-share',
  recommended: {
    audioCodec: 'AAC',
    audioBitrateKbps: 128,
    sampleRateHz: 44100,
    channels: 'Stereo',
    videoCodec: 'x264',
    videoBitrateKbps: 2500,
    keyframeIntervalSec: 2,
    preset: 'veryfast',
    profile: 'main',
    tune: 'zerolatency',
  },
  sceneCollection: {
    current_scene: MOCK_SCENE,
    current_program_scene: MOCK_SCENE,
    scene_order: [{ name: MOCK_SCENE }],
    name: MOCK_SCENE,
    sources: [],
  },
  sceneCollectionFilename: 'tahti-demo-slug-scene.json',
};

export async function fetchObsPreset(): Promise<
  { ok: true; data: ObsPreset } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true, data: MOCK_PRESET };
  }
  try {
    const { data } = await requestJson<ObsPreset>('/api/me/obs-preset');
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not load your OBS setup',
    };
  }
}
