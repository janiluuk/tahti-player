import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../../api/types';
import { usePlayerStore } from '../../stores/playerStore';
import type { TahtiNativeLibrary } from '../nativeLibrary';
import { dispatchMcp, MCP_DOMAINS, MCP_TYPES } from './registry';

const track = (name: string): TahtiPlayable => ({
  id: `local:${name}`,
  kind: 'sound',
  title: name,
  artist: 'Artist',
  streamUrl: `asset://${name}`,
  protocol: 'https',
  sourceProvider: 'local',
  durationSec: 60,
});

const titles = () =>
  usePlayerStore.getState().queue.map((item) => item.track.title);

beforeEach(() => {
  usePlayerStore.getState().clearQueue();
});

afterEach(() => {
  globalThis.__TAHTI_NATIVE_LIBRARY__ = undefined;
});

describe('discovery', () => {
  it('lists the domains when no domain is given', async () => {
    const result = (await dispatchMcp('Meta.listMethods', {})) as {
      domains: { domain: string }[];
    };
    expect(result.domains.map((entry) => entry.domain)).toEqual([
      'Playback',
      'Queue',
      'Library',
      'Radio',
      'Tahti',
    ]);
  });

  it("lists a domain's methods", async () => {
    const result = (await dispatchMcp('Meta.listMethods', {
      domain: 'Queue',
    })) as { methods: { method: string }[] };
    expect(result.methods.map((entry) => entry.method)).toContain('playItem');
  });

  it('names the alternatives for an unknown domain, method or type', async () => {
    await expect(
      dispatchMcp('Meta.listMethods', { domain: 'Nope' }),
    ).rejects.toThrow('Domains: Playback, Queue, Library, Radio, Tahti.');
    await expect(
      dispatchMcp('Meta.methodDetails', { method: 'Queue.nope' }),
    ).rejects.toThrow('Methods: get, playItem');
    await expect(
      dispatchMcp('Meta.describeType', { type: 'Nope' }),
    ).rejects.toThrow('Types: PlaybackState');
    await expect(dispatchMcp('toString', {})).rejects.toThrow(
      'Domain.method form',
    );
    await expect(dispatchMcp('constructor.name', {})).rejects.toThrow(
      'Unknown domain "constructor"',
    );
  });

  it('describes parameters, allowed values and optional ones', async () => {
    const details = (await dispatchMcp('Meta.methodDetails', {
      method: 'Library.play',
    })) as { params: { name: string; type: string; optional: boolean }[] };
    expect(details.params).toEqual([
      expect.objectContaining({
        name: 'ids',
        type: 'string[]',
        optional: false,
      }),
      expect.objectContaining({
        name: 'mode',
        type: '"now" | "next" | "end"',
        optional: true,
      }),
    ]);
  });

  it('can describe every type a method returns', () => {
    for (const [domain, def] of Object.entries(MCP_DOMAINS)) {
      for (const [name, method] of Object.entries(def.methods)) {
        const type = method.returns.replace(/\[\]$/, '');
        expect(MCP_TYPES, `${domain}.${name} returns ${type}`).toHaveProperty([
          type,
        ]);
      }
    }
  });
});

describe('arguments', () => {
  it('refuses missing, mistyped, out-of-set and unknown arguments', async () => {
    await expect(dispatchMcp('Playback.seekTo', {})).rejects.toThrow(
      'Playback.seekTo needs "seconds" (number).',
    );
    await expect(
      dispatchMcp('Playback.setVolume', { volume: 'loud' }),
    ).rejects.toThrow('"volume" must be a number');
    await expect(
      dispatchMcp('Playback.setRepeatMode', { mode: 'twice' }),
    ).rejects.toThrow('must be one of off, all, one');
    await expect(
      dispatchMcp('Queue.clear', { everything: true }),
    ).rejects.toThrow('Queue.clear does not take "everything".');
  });
});

describe('playback and queue', () => {
  it('reports the loaded item and changes the volume', async () => {
    usePlayerStore.getState().play(track('a'), { enqueueRest: [track('b')] });
    const state = (await dispatchMcp('Playback.setVolume', {
      volume: 2,
    })) as { current: { title: string }; volume: number };
    expect(state.current.title).toBe('a');
    expect(state.volume).toBe(1);
  });

  it('pauses only when something is loaded', async () => {
    await expect(dispatchMcp('Playback.pause')).rejects.toThrow(
      'Nothing is loaded',
    );
    usePlayerStore.getState().play(track('a'));
    const state = (await dispatchMcp('Playback.pause')) as { status: string };
    expect(state.status).toBe('paused');
  });

  it('moves, plays and removes queue items by id', async () => {
    usePlayerStore
      .getState()
      .play(track('a'), { enqueueRest: [track('b'), track('c')] });
    await dispatchMcp('Queue.move', { fromIndex: 2, toIndex: 0 });
    expect(titles()).toEqual(['c', 'a', 'b']);
    await dispatchMcp('Queue.playItem', { id: 'local:b' });
    expect(usePlayerStore.getState().currentId).toBe('local:b');
    await dispatchMcp('Queue.remove', { id: 'local:c' });
    expect(titles()).toEqual(['a', 'b']);
    await expect(dispatchMcp('Queue.remove', { id: 'x' })).rejects.toThrow(
      'No queue item has the id "x"',
    );
    await expect(
      dispatchMcp('Queue.move', { fromIndex: 0, toIndex: 9 }),
    ).rejects.toThrow('toIndex must be a whole number from 0 to 1.');
  });
});

describe('library', () => {
  it('says the library needs the desktop app', async () => {
    await expect(dispatchMcp('Library.search', { query: '' })).rejects.toThrow(
      'only available in the Tahti Player desktop app',
    );
  });

  it('plays library tracks in the order given, next or at the end', async () => {
    const prepareBatch = vi.fn(async (ids: string[]) => ({
      unavailable: 0,
      items: ids.map((id) => ({
        track: {
          id,
          title: id,
          artist: 'Artist',
          duration: 60,
        } as never,
        streamUrl: `asset://${id}`,
      })),
    }));
    globalThis.__TAHTI_NATIVE_LIBRARY__ = {
      prepareBatch,
    } as unknown as TahtiNativeLibrary;
    await dispatchMcp('Library.play', { ids: ['x', 'y'] });
    expect(titles()).toEqual(['x', 'y']);
    await dispatchMcp('Library.play', { ids: ['z'], mode: 'next' });
    expect(titles()).toEqual(['x', 'z', 'y']);
    await dispatchMcp('Library.play', { ids: ['w'], mode: 'end' });
    expect(titles()).toEqual(['x', 'z', 'y', 'w']);
  });
});

describe('radio', () => {
  it('tunes in to a built-in station and refuses an unknown one', async () => {
    const stations = (await dispatchMcp('Radio.stations')) as {
      id: string;
      playable: boolean;
    }[];
    const station = stations.find((entry) => entry.playable);
    expect(station).toBeDefined();
    await dispatchMcp('Radio.play', { id: station!.id });
    expect(usePlayerStore.getState().queue[0]?.id).toContain(station!.id);
    await expect(dispatchMcp('Radio.play', { id: 'nope' })).rejects.toThrow(
      'Unknown station "nope"',
    );
  });
});
