// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createDefaultEditList, type EditList } from '../api/studio-types';
import { useAudioPreviewGraph } from './audioPreviewGraph';

const param = () => {
  const p = {
    value: 0,
    setTargetAtTime: vi.fn((v: number) => {
      p.value = v;
    }),
  };
  return p;
};

const node = () => ({ connect: vi.fn(), disconnect: vi.fn() });

let contexts: FakeContext[] = [];

class FakeContext {
  state = 'running';
  currentTime = 0;
  destination = node();
  created = 0;
  close = vi.fn(() => Promise.resolve());
  resume = vi.fn(() => Promise.resolve());
  constructor() {
    contexts.push(this);
  }
  createMediaElementSource() {
    return node();
  }
  createBiquadFilter() {
    this.created += 1;
    return {
      ...node(),
      type: 'peaking',
      frequency: param(),
      Q: param(),
      gain: param(),
    };
  }
  createDynamicsCompressor() {
    this.created += 1;
    return {
      ...node(),
      threshold: param(),
      knee: param(),
      ratio: param(),
      attack: param(),
      release: param(),
    };
  }
  createGain() {
    this.created += 1;
    return { ...node(), gain: param() };
  }
}

function withEq(): EditList {
  const editList = createDefaultEditList(180);
  editList.pluginChain = ['eq'];
  editList.eq.enabled = true;
  return editList;
}

describe('useAudioPreviewGraph', () => {
  let audio: HTMLAudioElement;

  beforeEach(() => {
    contexts = [];
    vi.stubGlobal('AudioContext', FakeContext);
    audio = document.createElement('audio');
    document.body.appendChild(audio);
  });

  afterEach(() => {
    audio.remove();
    vi.unstubAllGlobals();
  });

  it('updates parameters in place instead of rebuilding on every edit', () => {
    const ref = { current: audio };
    const { rerender } = renderHook(
      ({ editList }) => useAudioPreviewGraph(ref, editList),
      { initialProps: { editList: withEq() } },
    );
    const ctx = contexts[0]!;
    const builtAtStart = ctx.created;
    expect(builtAtStart).toBe(4);

    const louder = withEq();
    louder.eq.bands[0]!.gainDb = 6;
    louder.gainDb = -3;
    rerender({ editList: louder });
    rerender({ editList: { ...louder, cuts: [{ start: 1, end: 2 }] } });
    expect(ctx.created).toBe(builtAtStart);

    const withFilter = {
      ...louder,
      pluginChain: ['eq', 'filter'] as EditList['pluginChain'],
      filter: { ...louder.filter, enabled: true },
    };
    rerender({ editList: withFilter });
    expect(ctx.created).toBeGreaterThan(builtAtStart);
  });

  it('closes its AudioContext when the audio element goes away', () => {
    const ref = { current: audio };
    const { unmount } = renderHook(() => useAudioPreviewGraph(ref, withEq()));
    audio.remove();
    unmount();
    expect(contexts[0]!.close).toHaveBeenCalled();
  });

  it('keeps the context while the element is still mounted', () => {
    const ref = { current: audio };
    const { unmount } = renderHook(() => useAudioPreviewGraph(ref, withEq()));
    unmount();
    expect(contexts[0]!.close).not.toHaveBeenCalled();
  });
});
