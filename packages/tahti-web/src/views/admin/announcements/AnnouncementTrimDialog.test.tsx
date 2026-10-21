// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../../api/admin';
import { AnnouncementTrimDialog } from './AnnouncementTrimDialog';

const CLIP: admin.AdminAnnouncementClip = {
  id: 'a1',
  title: 'Station ID',
  durationSec: 12,
  isEnabled: true,
  scheduleMode: 'AFTER_EVERY',
  everyNth: null,
  renderStatus: 'READY',
};

async function renderDialog(onRendered = vi.fn()) {
  vi.spyOn(admin, 'fetchAdminAnnouncementSource').mockResolvedValue({
    ok: true,
    source: {
      url: 'https://cdn.example/a1.mp3',
      originalUrl: 'https://cdn.example/a1-original.mp3',
      durationSec: 12,
      title: 'Station ID',
      renderStatus: 'READY',
    },
  });
  await act(async () => {
    render(
      <AnnouncementTrimDialog
        clip={CLIP}
        onClose={vi.fn()}
        onRendered={onRendered}
      />,
    );
  });
  return onRendered;
}

describe('validateAnnouncementTrim', () => {
  const trim = { startSec: 1, endSec: 10, fadeInSec: 0, fadeOutSec: 0 };

  it('accepts a trim inside the clip', () => {
    expect(admin.validateAnnouncementTrim(trim, 12)).toBeNull();
  });

  it('refuses an end before the start, past the clip, or fades that do not fit', () => {
    expect(admin.validateAnnouncementTrim({ ...trim, endSec: 1 }, 12)).toMatch(
      /after start/,
    );
    expect(admin.validateAnnouncementTrim({ ...trim, endSec: 13 }, 12)).toMatch(
      /past the clip/,
    );
    expect(
      admin.validateAnnouncementTrim({ ...trim, fadeInSec: 31 }, null),
    ).toMatch(/30 seconds/);
    expect(
      admin.validateAnnouncementTrim(
        { ...trim, fadeInSec: 5, fadeOutSec: 5 },
        12,
      ),
    ).toMatch(/longer than/);
  });
});

describe('AnnouncementTrimDialog', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('plays the original upload and starts with the whole clip', async () => {
    await renderDialog();
    expect(
      screen
        .getByLabelText('Original upload of Station ID')
        .getAttribute('src'),
    ).toBe('https://cdn.example/a1-original.mp3');
    expect(screen.getByLabelText<HTMLInputElement>('End (s)').value).toBe('12');
  });

  it('shows a validation error instead of sending a bad trim', async () => {
    const renderSpy = vi.spyOn(admin, 'renderAdminAnnouncement');
    await renderDialog();
    fireEvent.change(screen.getByLabelText('Start (s)'), {
      target: { value: '12' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Render trim' }));
    expect(screen.getByRole('alert').textContent).toMatch(/after start/);
    expect(renderSpy).not.toHaveBeenCalled();
  });

  it('renders the trim and reports back', async () => {
    const renderSpy = vi
      .spyOn(admin, 'renderAdminAnnouncement')
      .mockResolvedValue({ ok: true });
    const onRendered = await renderDialog();
    fireEvent.change(screen.getByLabelText('Start (s)'), {
      target: { value: '1.5' },
    });
    fireEvent.change(screen.getByLabelText('Fade out (s)'), {
      target: { value: '2' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Render trim' }));
    });
    expect(renderSpy).toHaveBeenCalledWith('a1', {
      startSec: 1.5,
      endSec: 12,
      fadeInSec: 0,
      fadeOutSec: 2,
    });
    expect(onRendered).toHaveBeenCalled();
  });
});
