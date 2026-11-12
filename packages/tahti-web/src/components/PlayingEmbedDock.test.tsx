// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';
import { HearthisEmbedHostProvider } from './HearthisEmbedHost';
import { EmbedSlot } from './PlayingEmbedDock';

const embedTrack: TahtiPlayable = {
  id: 'sound:embed-dock',
  kind: 'sound',
  title: 'Embedded set',
  artist: 'Yaniho',
  streamUrl: '',
  protocol: 'https',
  sourceProvider: 'hearthis',
  embed: { provider: 'hearthis', embedUri: 'yaniho/embedded-set' },
};

function Slots({ which }: { which: 'a' | 'b' | 'both' | 'none' }) {
  return (
    <>
      {which === 'a' || which === 'both' ? (
        <EmbedSlot id="a" priority={10} testId="slot-a" />
      ) : null}
      {which === 'b' || which === 'both' ? (
        <EmbedSlot id="b" priority={20} testId="slot-b" />
      ) : null}
    </>
  );
}

describe('PlayingEmbedDock', () => {
  beforeEach(() => {
    usePlayerStore.getState().clearQueue();
    usePlayerStore.getState().play(embedTrack);
  });

  afterEach(() => {
    cleanup();
    usePlayerStore.getState().clearQueue();
  });

  it('moves the same iframe when the visible slot changes', () => {
    const view = render(
      <HearthisEmbedHostProvider>
        <Slots which="a" />
      </HearthisEmbedHostProvider>,
    );
    const frame = document.querySelector('iframe');
    expect(frame).toBeTruthy();
    const first = view.getByTestId('slot-a').getBoundingClientRect();
    expect(view.getByTestId('playing-embed-holder').style.left).toBe(
      `${first.left}px`,
    );

    view.rerender(
      <HearthisEmbedHostProvider>
        <Slots which="b" />
      </HearthisEmbedHostProvider>,
    );
    const moved = document.querySelector('iframe');
    expect(moved).toBe(frame);
    expect(view.getByTestId('playing-embed-holder').style.position).toBe(
      'fixed',
    );

    view.rerender(
      <HearthisEmbedHostProvider>
        <Slots which="none" />
      </HearthisEmbedHostProvider>,
    );
    expect(document.querySelector('iframe')).toBe(frame);
    expect(view.getByTestId('playing-embed-holder').style.position).toBe(
      'absolute',
    );
  });

  it('keeps the iframe in the higher-priority slot', () => {
    const view = render(
      <HearthisEmbedHostProvider>
        <Slots which="both" />
      </HearthisEmbedHostProvider>,
    );
    const frame = document.querySelector('iframe');
    expect(frame).toBeTruthy();
    const holder = view.getByTestId('playing-embed-holder');
    const slot = view.getByTestId('slot-b').getBoundingClientRect();
    expect(holder.style.position).toBe('fixed');
    expect(holder.style.left).toBe(`${slot.left}px`);
  });
});
