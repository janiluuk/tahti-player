import type { Decorator } from '@storybook/react-vite';
import type { DeepPartial } from '@tahti-web/api/mock-overrides';
import type {
  StudioRelease,
  StudioReleaseList,
  StudioReleaseTrack,
  StudioSound,
} from '@tahti-web/api/studio-types';
import { mockSoundStore } from '@tahti-web/api/studio/studio-mock';
import type { PublicTrackDetail } from '@tahti-web/api/types';
import { useRouterState } from '@tanstack/react-router';
import { useState } from 'react';

import { toast, Toaster } from '@tahti-player/ui';

/** The shared mock DJ set every TrackDetailView story opens. */
export const TRACK_ID = 'northern-lights-archive-1';

/** Every field TrackDetailsBlock renders, plus the AI label and a mix version. */
export const FULL_TRACK_DETAIL: DeepPartial<PublicTrackDetail> = {
  title: 'Kaamos Bloom',
  genre: 'Ambient',
  subGenres: ['Dub techno', 'Drone'],
  tags: ['night drive', 'field recordings', 'Helsinki'],
  effectiveBpm: 118,
  effectiveKey: 'Am',
  license: 'CC_BY_NC',
  credits: [
    { role: 'vocals', name: 'Liina', artistUsername: 'listener-liina' },
    { role: 'mastering', name: 'Kaamos Audio' },
  ],
  commentary:
    'Recorded in one take on the first night of polar winter, with the hall lights off.',
  mixVersion: 'Extended Mix',
  venue: { name: 'Kuudes Linja', slug: 'kuudes-linja' },
  isAiGenerated: true,
  downloadsEnabled: true,
};

export const STORY_TIER_ID = 'tier-story-night-drive';

export const SUBSCRIBERS_ONLY_DETAIL: DeepPartial<PublicTrackDetail> = {
  audioUrl: null,
  accessMode: 'SUBSCRIBERS_ONLY',
  gate: { reason: 'SUBSCRIBERS_ONLY' },
};

export const PURCHASE_GATED_DETAIL: DeepPartial<PublicTrackDetail> = {
  audioUrl: null,
  accessMode: 'PURCHASE',
  purchaseTierId: STORY_TIER_ID,
  purchaseTierName: 'Night Drive single',
  purchaseTierPriceCents: 300,
  purchaseTierPriceOptional: true,
  gate: { reason: 'PURCHASE', tierId: STORY_TIER_ID },
};

/** A fully filled-in Studio sound for the track editor stories. */
export const EDIT_SOUND: StudioSound = {
  id: 'story-edit-kaamos-bloom',
  title: 'Kaamos Bloom',
  status: 'READY',
  durationSec: 412,
  sourceFormat: 'WAV',
  sourceBitDepth: 24,
  sourceSampleRateHz: 48000,
  sourceChannels: 2,
  description: 'First night of polar winter.',
  artistName: 'Northern Lights',
  genre: 'ambient',
  subGenres: ['Drone'],
  tags: ['night drive', 'Helsinki'],
  contentType: 'TRACK',
  license: 'CC_BY',
  isPublic: true,
  commentsEnabled: true,
  downloadsEnabled: true,
  followToDownload: false,
  repostToDownload: false,
  accessMode: 'FREE',
  purchaseTierId: null,
  bpmDetected: 118,
  keyDetected: 'Am',
  useDetectedBpmKey: true,
  isAiGenerated: false,
  venueId: null,
  venue: null,
  releasedAt: '2026-09-01T00:00:00.000Z',
  createdAt: '2026-09-01T10:00:00.000Z',
};

export const FAILED_SOUND: StudioSound = {
  id: 'story-failed-master',
  title: 'Revontulet (WAV master)',
  status: 'ERROR',
  processingError: 'The file ended early - it may have been cut off.',
  durationSec: null,
  contentType: 'TRACK',
  isPublic: true,
  downloadsEnabled: true,
  createdAt: '2026-10-02T09:00:00.000Z',
};

/** Failed on an API that predates `processingError`, so there's no retry. */
export const FAILED_LEGACY_SOUND: StudioSound = {
  id: 'story-failed-legacy',
  title: 'Old bounce',
  status: 'ERROR',
  contentType: 'TRACK',
  isPublic: true,
  downloadsEnabled: true,
  createdAt: '2026-10-01T09:00:00.000Z',
};

export const PROCESSING_SOUND: StudioSound = {
  id: 'story-processing',
  title: 'Midnight Broadcast',
  status: 'PROCESSING',
  contentType: 'TRACK',
  isPublic: true,
  downloadsEnabled: true,
  createdAt: '2026-10-03T08:00:00.000Z',
};

/**
 * `beforeEach` that puts `sounds` at the top of the Studio mock sound store
 * and restores the store afterwards. Retry and save mutate store entries in
 * place, so both the seeded and the original entries are cloned.
 */
export function seedStudioSounds(sounds: StudioSound[]) {
  return () => {
    const snapshot = mockSoundStore.map((sound) => structuredClone(sound));
    mockSoundStore.unshift(...sounds.map((sound) => structuredClone(sound)));
    return () => {
      mockSoundStore.splice(0, mockSoundStore.length, ...snapshot);
    };
  };
}

const TIERS_KEY = 'tahti-mock-purchase-tiers';

/** `beforeEach` that gives the mock artist ('demo' with no mock session)
 * one active purchase tier, so the track editor's Access select offers it. */
export function seedPurchaseTier() {
  const previous = localStorage.getItem(TIERS_KEY);
  localStorage.setItem(
    TIERS_KEY,
    JSON.stringify([
      {
        artistUsername: 'demo',
        tiers: [
          {
            id: STORY_TIER_ID,
            name: 'Night Drive single',
            description: null,
            priceCents: 300,
            priceOptional: false,
            active: true,
            position: 0,
          },
        ],
      },
    ]),
  );
  return () => {
    if (previous === null) {
      localStorage.removeItem(TIERS_KEY);
    } else {
      localStorage.setItem(TIERS_KEY, previous);
    }
  };
}

export const RELEASE_ID = 'rel-mock-1';

/** Release tracks in each upload state ReleaseTrackAudioUpload renders. */
export const UPLOAD_STATE_TRACKS: StudioReleaseTrack[] = [
  { id: 'story-rt-no-audio', position: 3, title: 'Polar Night' },
  {
    id: 'story-rt-failed',
    position: 4,
    title: 'Ice Road',
    status: 'FAILED',
  },
  {
    id: 'story-rt-scanning',
    position: 5,
    title: 'Aurora Drift',
    status: 'SCANNING',
    sourceKey: 'releases/mock/story-rt-scanning.wav',
  },
];

/** `studioReleases` override adding the upload-state tracks to rel-mock-1. */
export function releasesWithUploadStates(
  base: StudioReleaseList,
): StudioReleaseList {
  return {
    ...base,
    releases: base.releases.map((release: StudioRelease) =>
      release.id === RELEASE_ID
        ? {
            ...release,
            tracks: [...(release.tracks ?? []), ...UPLOAD_STATE_TRACKS],
            _count: {
              tracks:
                (release.tracks?.length ?? 0) + UPLOAD_STATE_TRACKS.length,
            },
          }
        : release,
    ),
  };
}

export function audioFile(name = 'polar-night.wav'): File {
  return new File([new Uint8Array(64)], name, { type: 'audio/wav' });
}

function LocationProbe() {
  const href = useRouterState({ select: (state) => state.location.href });
  return (
    <output data-testid="story-location" hidden>
      {href}
    </output>
  );
}

/**
 * Renders the router's current href in a hidden `<output>` so a play can
 * assert where a link navigated. Must sit inside `withTahtiRouter`, so list
 * it on the story (story decorators wrap inside meta decorators).
 */
export function withLocationProbe(): Decorator {
  return (Story) => (
    <>
      <Story />
      <LocationProbe />
    </>
  );
}

/** Mounts the app's toast host (AppShell renders it in the real app) so
 * plays can assert success/error toasts with `findToast`. sonner keeps its
 * toasts in module state and a new Toaster replays the active ones, so the
 * previous story's toasts are dismissed first. */
export function withToaster(): Decorator {
  return (Story) => (
    <>
      <Story />
      <StoryToaster />
    </>
  );
}

function StoryToaster() {
  useState(() => toast.dismiss());
  return <Toaster position="bottom-right" richColors closeButton />;
}
