import { beforeEach, describe, expect, it } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from './playerStore';

function radio(id: string): TahtiPlayable {
  return {
    id: `radio-widget:${id}`,
    kind: 'radio',
    title: id,
    artist: 'Internet radio',
    streamUrl: `https://example.test/${id}`,
    protocol: 'https',
    sourceProvider: 'internet-radio',
  };
}

describe('playerStore playFromList (radio row)', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      queue: [],
      currentId: null,
      status: 'idle',
      isLive: false,
      lastRadioPlayable: null,
    });
  });

  it('seeds the full station list so next and previous switch neighbors', () => {
    const list = [radio('a'), radio('b'), radio('c')];
    usePlayerStore.getState().playFromList(list, 1);

    expect(usePlayerStore.getState().currentId).toBe('radio-widget:b');
    expect(usePlayerStore.getState().queue.map((q) => q.id)).toEqual([
      'radio-widget:a',
      'radio-widget:b',
      'radio-widget:c',
    ]);
    expect(usePlayerStore.getState().isLive).toBe(true);

    usePlayerStore.getState().next();
    expect(usePlayerStore.getState().currentId).toBe('radio-widget:c');

    usePlayerStore.getState().previous();
    expect(usePlayerStore.getState().currentId).toBe('radio-widget:b');

    usePlayerStore.getState().previous();
    expect(usePlayerStore.getState().currentId).toBe('radio-widget:a');
  });

  it('no-ops next on the last station and previous on the first', () => {
    const list = [radio('a'), radio('b')];
    usePlayerStore.getState().playFromList(list, 0);
    usePlayerStore.getState().previous();
    expect(usePlayerStore.getState().currentId).toBe('radio-widget:a');

    usePlayerStore.getState().playFromList(list, 1);
    usePlayerStore.getState().next();
    expect(usePlayerStore.getState().currentId).toBe('radio-widget:b');
  });
});
