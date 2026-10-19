// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as shows from '../api/shows';
import { renderWithRouter } from '../test/renderWithRouter';
import { RadioScheduleView } from './RadioScheduleView';

describe('RadioScheduleView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says the week failed to load instead of showing every slot free', async () => {
    const fetch = vi.spyOn(shows, 'fetchShowBookings').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderWithRouter(<RadioScheduleView />);
    expect(
      await screen.findByText("Could not load this week's bookings"),
    ).toBeTruthy();

    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() =>
      expect(
        screen.queryByText("Could not load this week's bookings"),
      ).toBeNull(),
    );
    expect(screen.getByRole('button', { name: 'Next week' })).toBeTruthy();
  });
});
