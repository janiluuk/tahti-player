// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { RecentBroadcast } from '../../../api/broadcast';
import { renderWithRouter } from '../../../test/renderWithRouter';
import { RecordingRow } from './RecordingRow';

const draft: RecentBroadcast = {
  id: 'rec-draft',
  title: 'Late night session',
  source: 'BROWSER',
  startedAt: '2026-10-10T21:00:00.000Z',
  soundId: null,
};

describe('RecordingRow', () => {
  it('labels an unpublished recording Draft in the body text colour, readable on the tinted row', async () => {
    await renderWithRouter(
      <ul>
        <RecordingRow show={draft} index={0} onEdit={() => {}} />
      </ul>,
    );
    const label = screen.getByText('Draft');
    expect(label).toHaveClass('text-foreground');
    expect(label).not.toHaveClass('text-primary-strong');
  });

  it('labels a ready recording Published', async () => {
    await renderWithRouter(
      <ul>
        <RecordingRow
          show={{ ...draft, soundId: 'snd-1', soundStatus: 'READY' }}
          index={0}
          onEdit={() => {}}
        />
      </ul>,
    );
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Edit Late night session' }),
    ).toBeInTheDocument();
  });
});
