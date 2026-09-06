import { describe, expect, it } from 'vitest';

import {
  collectionRotationSoundIds,
  planCollectionRotationApply,
} from './rotationCollectionApply';

describe('collectionRotationSoundIds', () => {
  it('keeps unique archive sound ids and drops embeds, releases, and blanks', () => {
    expect(
      collectionRotationSoundIds([
        { id: '1', position: 0, soundId: 'ready-a' },
        { id: '2', position: 1, soundId: 'ready-a' },
        { id: '3', position: 2, soundId: null },
        {
          id: '4',
          position: 3,
          releaseId: 'rel-1',
          release: { id: 'rel-1', title: 'LP' },
        },
        {
          id: '5',
          position: 4,
          soundId: 'embed-1',
          sound: {
            id: 'embed-1',
            title: 'Mix',
            embedProvider: 'HEARTHIS',
          },
        },
        { id: '6', position: 5, soundId: 'ready-b' },
      ]),
    ).toEqual(['ready-a', 'ready-b']);
  });
});

describe('planCollectionRotationApply', () => {
  it('aborts replace when the playlist has no rotatable tracks', () => {
    expect(
      planCollectionRotationApply({
        replace: true,
        currentFallbackIds: ['on-air-1', 'on-air-2'],
        incomingSoundIds: [],
      }),
    ).toEqual({ action: 'abort', reason: 'empty-playlist' });
  });

  it('adds incoming tracks before listing any current fallbacks to remove', () => {
    expect(
      planCollectionRotationApply({
        replace: true,
        currentFallbackIds: ['on-air-1', 'keep-me'],
        incomingSoundIds: ['keep-me', 'new-1'],
      }),
    ).toEqual({
      action: 'replace',
      addIds: ['keep-me', 'new-1'],
      removeIds: ['on-air-1'],
    });
  });

  it('does not re-add tracks already in rotation', () => {
    expect(
      planCollectionRotationApply({
        replace: false,
        currentFallbackIds: ['on-air-1'],
        incomingSoundIds: ['on-air-1', 'new-1'],
      }),
    ).toEqual({ action: 'add', addIds: ['new-1'] });
  });

  it('aborts add when every incoming track is already in rotation', () => {
    expect(
      planCollectionRotationApply({
        replace: false,
        currentFallbackIds: ['on-air-1', 'on-air-2'],
        incomingSoundIds: ['on-air-1'],
      }),
    ).toEqual({ action: 'abort', reason: 'already-in-rotation' });
  });
});
