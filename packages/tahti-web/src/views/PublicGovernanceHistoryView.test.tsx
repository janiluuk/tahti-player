// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import { renderWithRouter } from '../test/renderWithRouter';
import { PublicGovernanceHistoryView } from './PublicGovernanceHistoryView';

describe('PublicGovernanceHistoryView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says the history failed to load instead of "No closed advisory motions"', async () => {
    const fetch = vi
      .spyOn(client, 'fetchPublicGovernanceMotions')
      .mockResolvedValue({
        data: [],
        meta: { source: 'api', reason: 'HTTP 502' },
      });
    await renderWithRouter(<PublicGovernanceHistoryView />);
    expect(
      await screen.findByText('Could not load governance history'),
    ).toBeTruthy();
    expect(screen.queryByText(/No closed advisory motions/)).toBeNull();

    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText(/No closed advisory motions/)).toBeTruthy();
  });
});
