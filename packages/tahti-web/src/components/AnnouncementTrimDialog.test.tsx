// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AnnouncementClip } from '../api/announcements';
import { AnnouncementTrimDialog } from './AnnouncementTrimDialog';

const CLIP: AnnouncementClip = {
  id: 'a1',
  title: 'Station ident',
  durationSec: 12,
  isEnabled: true,
  renderStatus: 'READY',
  contentType: 'CLIP',
};

describe('AnnouncementTrimDialog', () => {
  afterEach(cleanup);

  it('starts from the whole clip and submits the trim', () => {
    const onSubmit = vi.fn();
    render(
      <AnnouncementTrimDialog
        clip={CLIP}
        busy={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    expect((screen.getByLabelText('End (s)') as HTMLInputElement).value).toBe(
      '12',
    );
    fireEvent.change(screen.getByLabelText('Start (s)'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText('Fade out (s)'), {
      target: { value: '1.5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Trim clip' }));
    expect(onSubmit).toHaveBeenCalledWith(CLIP, {
      startSec: 2,
      endSec: 12,
      fadeInSec: 0,
      fadeOutSec: 1.5,
    });
  });

  it('refuses an end before the start', () => {
    render(
      <AnnouncementTrimDialog
        clip={CLIP}
        busy={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('Start (s)'), {
      target: { value: '13' },
    });
    expect(screen.getByRole('alert').textContent).toBe(
      'End must be after start.',
    );
    expect(
      (screen.getByRole('button', { name: 'Trim clip' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
