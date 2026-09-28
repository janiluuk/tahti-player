import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type { QueueItem as QueueItemType } from '@tahti-player/model';

import { keyboardTargetIndex, QueuePanel } from './QueuePanel';

const item = (index: number): QueueItemType => ({
  id: `item-${index}`,
  track: {
    title: `Track ${index}`,
    artists: [{ name: 'Artist', roles: ['primary'] }],
    source: { provider: 'test', id: `item-${index}` },
  },
  status: 'idle',
  addedAtIso: '2026-09-27T00:00:00.000Z',
});

const labels = { removeButton: 'Remove', playbackError: 'Error' };
const VIEWPORT_PX = 600;
const ROW_PX = 56;

const restore: Array<() => void> = [];
const stub = (key: string, descriptor: PropertyDescriptor) => {
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, key);
  Object.defineProperty(HTMLElement.prototype, key, {
    configurable: true,
    ...descriptor,
  });
  restore.push(() =>
    original
      ? Object.defineProperty(HTMLElement.prototype, key, original)
      : delete (HTMLElement.prototype as unknown as Record<string, unknown>)[
          key
        ],
  );
};

beforeAll(() => {
  stub('offsetHeight', {
    get() {
      return this.getAttribute('data-index') === null ? VIEWPORT_PX : ROW_PX;
    },
  });
  stub('offsetWidth', { get: () => 320 });
  stub('clientHeight', { get: () => VIEWPORT_PX });
  stub('scrollHeight', { get: () => 1_000_000 });
  stub('getBoundingClientRect', {
    value(this: HTMLElement) {
      const height =
        this.getAttribute('data-index') === null ? VIEWPORT_PX : ROW_PX;
      return DOMRect.fromRect({ x: 0, y: 0, width: 320, height });
    },
  });
  stub('scrollTo', {
    value(this: HTMLElement, options: ScrollToOptions) {
      this.scrollTop = options.top ?? 0;
      this.dispatchEvent(new Event('scroll'));
    },
  });
});

afterAll(() => restore.forEach((undo) => undo()));

const row = (index: number) =>
  document.querySelector<HTMLElement>(`[data-queue-item-id="item-${index}"]`);

const nextFrame = () =>
  act(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });

describe('keyboardTargetIndex', () => {
  it('maps navigation keys and clamps to the queue', () => {
    expect(keyboardTargetIndex('ArrowDown', 3, 10)).toBe(4);
    expect(keyboardTargetIndex('ArrowUp', 0, 10)).toBe(0);
    expect(keyboardTargetIndex('PageDown', 5, 10)).toBe(9);
    expect(keyboardTargetIndex('PageUp', 15, 30)).toBe(5);
    expect(keyboardTargetIndex('Home', 7, 10)).toBe(0);
    expect(keyboardTargetIndex('End', 0, 10)).toBe(9);
    expect(keyboardTargetIndex('a', 0, 10)).toBeNull();
  });
});

describe('QueuePanel keyboard', () => {
  it('moves focus between rows and plays the focused one with Enter', () => {
    const onSelectItem = vi.fn();
    render(
      <QueuePanel
        items={Array.from({ length: 5 }, (_, i) => item(i))}
        labels={labels}
        onSelectItem={onSelectItem}
      />,
    );
    row(0)!.focus();

    fireEvent.keyDown(row(0)!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(row(1));
    fireEvent.keyDown(row(1)!, { key: 'End' });
    expect(document.activeElement).toBe(row(4));
    fireEvent.keyDown(row(4)!, { key: 'Enter' });

    expect(onSelectItem).toHaveBeenCalledWith('item-4');
  });

  it('reaches rows of a long queue that are not mounted yet', async () => {
    render(
      <QueuePanel
        items={Array.from({ length: 5000 }, (_, i) => item(i))}
        labels={labels}
        onReorder={vi.fn()}
      />,
    );
    expect(row(4999)).toBeNull();
    row(0)!.focus();

    fireEvent.keyDown(row(0)!, { key: 'End' });
    await nextFrame();
    await nextFrame();

    expect(row(4999)).not.toBeNull();
    expect(document.activeElement).toBe(row(4999));

    fireEvent.keyDown(row(4999)!, { key: 'Home' });
    await nextFrame();
    await nextFrame();
    expect(document.activeElement).toBe(row(0));
  });

  it('ignores keys from controls inside a row', () => {
    const onSelectItem = vi.fn();
    render(
      <QueuePanel
        items={Array.from({ length: 3 }, (_, i) => item(i))}
        labels={labels}
        onSelectItem={onSelectItem}
        onRemoveItem={vi.fn()}
      />,
    );
    const remove = screen.getAllByRole('button', { name: 'Remove' })[0]!;
    remove.focus();

    fireEvent.keyDown(remove, { key: 'ArrowDown' });
    fireEvent.keyDown(remove, { key: 'Enter' });

    expect(document.activeElement).toBe(remove);
    expect(onSelectItem).not.toHaveBeenCalled();
  });
});
