import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as radio from '../../../../api/admin/admin-radio';
import { RadioSubmissionsTab } from './RadioSubmissionsTab';

describe('RadioSubmissionsTab', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says who is notified about a decision', async () => {
    vi.spyOn(radio, 'fetchAdminRadioSubmissions').mockResolvedValue({
      data: [
        {
          id: 's1',
          status: 'PENDING',
          createdAt: '2026-10-20T09:30:00.000Z',
          submitter: { username: 'kaiku', displayName: 'Kaiku' },
          sound: {
            id: 'snd1',
            title: 'Night drive',
            artistName: 'Kaiku',
            durationSec: 200,
            bannerUrl: null,
            audioUrl: null,
          },
        },
      ] as radio.AdminRadioSubmission[],
      meta: { source: 'api' },
    });
    await act(async () => {
      render(<RadioSubmissionsTab />);
    });
    expect(screen.getByLabelText('Note to the artist (optional)')).toBeTruthy();
    expect(
      screen.getByText(/The artist is notified when you approve/),
    ).toBeTruthy();
  });
});
