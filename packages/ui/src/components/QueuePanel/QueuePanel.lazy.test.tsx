import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { QueueItem as QueueItemType } from '@tahti-player/model';

import { QueuePanel } from './QueuePanel';

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
const row = (index: number) =>
  document.querySelector<HTMLElement>(`[data-queue-item-id="item-${index}"]`);

describe('QueuePanel drag layer', () => {
  it('renders focusable rows at once and adds dnd-kit when it loads', async () => {
    render(<QueuePanel items={[item(0), item(1), item(2)]} labels={labels} />);
    expect(row(0)).toHaveAttribute('tabindex', '0');
    expect(row(0)).toHaveAttribute('aria-label', 'Track 0 — Artist');
    expect(row(0)).not.toHaveAttribute('aria-roledescription');

    await waitFor(() =>
      expect(row(0)).toHaveAttribute('aria-roledescription', 'sortable'),
    );
    expect(row(2)).toHaveAttribute('tabindex', '0');
  });

  it('never loads dnd-kit for a panel that cannot reorder', async () => {
    render(
      <QueuePanel
        items={[item(0), item(1)]}
        labels={labels}
        reorderable={false}
      />,
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(row(0)).not.toHaveAttribute('aria-roledescription');
    expect(row(0)).not.toHaveAttribute('tabindex');
  });
});
