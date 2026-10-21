import { act, render, screen, within } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type { QueueItem as QueueItemType } from '@tahti-player/model';

import { QueuePanel, VIRTUALIZE_THRESHOLD } from './QueuePanel';

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

const rendered = () =>
  within(screen.getByTestId('queue-virtual-list'))
    .getAllByText(/^Track \d+$/)
    .map((node) => node.textContent);

describe('QueuePanel virtualization', () => {
  it('keeps short queues fully mounted and virtualizes past the threshold', () => {
    const { unmount } = render(
      <QueuePanel
        items={Array.from({ length: 30 }, (_, i) => item(i))}
        labels={labels}
      />,
    );
    expect(screen.queryByTestId('queue-virtual-list')).toBeNull();
    expect(screen.getAllByText(/^Track \d+$/)).toHaveLength(30);
    unmount();
    render(
      <QueuePanel
        items={Array.from({ length: VIRTUALIZE_THRESHOLD + 1 }, (_, i) =>
          item(i),
        )}
        labels={labels}
      />,
    );
    expect(rendered().length).toBeLessThan(VIRTUALIZE_THRESHOLD);
  });

  it('mounts only the rows near the viewport of a long queue', () => {
    const items = Array.from({ length: 5000 }, (_, i) => item(i));
    render(<QueuePanel items={items} labels={labels} onReorder={vi.fn()} />);
    const titles = rendered();
    expect(titles[0]).toBe('Track 0');
    expect(titles.length).toBeGreaterThan(5);
    expect(titles.length).toBeLessThan(60);
    expect(screen.queryByText('Track 4999')).toBeNull();
  });

  it('scrolls the current item into view when it changes', async () => {
    const items = Array.from({ length: 1000 }, (_, i) => item(i));
    const { rerender } = render(
      <QueuePanel items={items} labels={labels} currentItemId="item-0" />,
    );
    expect(screen.queryByText('Track 700')).toBeNull();
    rerender(
      <QueuePanel items={items} labels={labels} currentItemId="item-700" />,
    );
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    expect(await screen.findByText('Track 700')).toBeTruthy();
    expect(screen.queryByText('Track 0')).toBeNull();
  });
});
