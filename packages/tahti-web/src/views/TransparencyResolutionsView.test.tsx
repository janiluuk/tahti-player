// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import { renderWithRouter } from '../test/renderWithRouter';
import { TransparencyResolutionsView } from './TransparencyResolutionsView';

describe('TransparencyResolutionsView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says the resolutions failed to load instead of "No published resolutions"', async () => {
    const fetch = vi
      .spyOn(client, 'fetchTransparencyResolutions')
      .mockResolvedValue({
        data: [],
        meta: { source: 'api', reason: 'HTTP 502' },
      });
    await renderWithRouter(<TransparencyResolutionsView />);
    expect(
      await screen.findByText('Could not load the resolutions'),
    ).toBeTruthy();
    expect(screen.queryByText(/No published resolutions/)).toBeNull();

    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText(/No published resolutions/)).toBeTruthy();
  });
});
