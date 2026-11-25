// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as announcements from '../api/announcements';
import { ChannelAnnouncementsPanel } from './ChannelAnnouncementsPanel';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('./channel-clips/VoiceRecorder', () => ({
  VoiceRecorder: ({ onUse }: { onUse: (file: File) => void }) => (
    <button
      type="button"
      onClick={() => onUse(new File(['voice'], 'Voice clip.wav'))}
    >
      Use recorded voice
    </button>
  ),
}));

describe('ChannelAnnouncementsPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says the clips failed to load instead of "No announcement clips yet"', async () => {
    const fetch = vi
      .spyOn(announcements, 'fetchAnnouncementClips')
      .mockResolvedValue({
        data: [],
        meta: { source: 'api', reason: 'HTTP 502' },
      } as never);
    render(<ChannelAnnouncementsPanel />);
    expect(
      await screen.findByText('Could not load your announcement clips'),
    ).toBeTruthy();
    expect(screen.queryByText('No announcement clips yet')).toBeNull();

    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } } as never);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No announcement clips yet')).toBeTruthy();
  });

  it('uploads a recorded voice from the record modal', async () => {
    vi.spyOn(announcements, 'fetchAnnouncementClips').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    } as never);
    const upload = vi
      .spyOn(announcements, 'uploadAnnouncementClip')
      .mockResolvedValue({
        ok: true,
        clip: {
          id: 'voice-1',
          title: 'Voice clip',
          isEnabled: false,
          renderStatus: 'READY',
        },
      } as never);
    vi.spyOn(announcements, 'deleteAnnouncementClip').mockResolvedValue({
      ok: true,
    } as never);

    render(<ChannelAnnouncementsPanel />);
    await screen.findByText('No announcement clips yet');
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Record voice' })[0]!,
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Use recorded voice' }),
    );

    expect(upload).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Voice clip.wav' }),
    );
  });
});
