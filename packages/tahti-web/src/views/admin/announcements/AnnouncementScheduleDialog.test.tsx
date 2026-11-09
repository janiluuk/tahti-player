// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '@tahti-player/i18n';

import type { AdminAnnouncementClip } from '../../../api/admin';
import {
  AnnouncementScheduleDialog,
  announcementScheduleLabel,
} from './AnnouncementScheduleDialog';

const CLIP: AdminAnnouncementClip = {
  id: 'ann-1',
  title: 'Welcome to Tahti',
  durationSec: 12,
  isEnabled: true,
  scheduleMode: 'EVERY_NTH',
  everyNth: 4,
};

const t = i18n.getFixedT('en-US', 'web');

describe('announcementScheduleLabel', () => {
  it('reads the schedule as text', () => {
    expect(announcementScheduleLabel(CLIP, t)).toBe('Once every 4 clips');
    expect(
      announcementScheduleLabel(
        { scheduleMode: 'AFTER_EVERY', everyNth: null },
        t,
      ),
    ).toBe('After every clip');
    expect(
      announcementScheduleLabel({ scheduleMode: 'RANDOM', everyNth: null }, t),
    ).toBe('Randomly');
  });
});

describe('AnnouncementScheduleDialog', () => {
  afterEach(cleanup);

  it('saves the edited interval', () => {
    const onSave = vi.fn();
    render(
      <AnnouncementScheduleDialog
        clip={CLIP}
        onClose={() => {}}
        onSave={onSave}
      />,
    );
    fireEvent.change(screen.getByLabelText('Every Nth'), {
      target: { value: '6' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith(CLIP, {
      scheduleMode: 'EVERY_NTH',
      everyNth: 6,
    });
  });

  it('blocks an interval out of range', () => {
    const onSave = vi.fn();
    render(
      <AnnouncementScheduleDialog
        clip={CLIP}
        onClose={() => {}}
        onSave={onSave}
      />,
    );
    fireEvent.change(screen.getByLabelText('Every Nth'), {
      target: { value: '1' },
    });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(
      screen.getByText('Enter a whole number from 2 to 100.'),
    ).toBeInTheDocument();
  });
});
