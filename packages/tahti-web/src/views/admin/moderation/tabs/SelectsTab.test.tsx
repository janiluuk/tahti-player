import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../../../api/admin';
import { SelectsTab } from './SelectsTab';

describe('SelectsTab', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says hand-picked tracks notify their artist', async () => {
    vi.spyOn(admin, 'fetchAdminSelects').mockResolvedValue({
      data: {
        items: [],
        stream: { state: 'OFFLINE', hlsUrl: null, nowPlaying: null },
      },
      meta: { source: 'api' },
    } as never);
    vi.spyOn(admin, 'searchAdminSelectsBrowse').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    await act(async () => {
      render(<SelectsTab />);
    });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Add content to rotation' }),
    );
    expect(
      await screen.findByText(/Each artist is notified that/),
    ).toBeTruthy();
  });
});
