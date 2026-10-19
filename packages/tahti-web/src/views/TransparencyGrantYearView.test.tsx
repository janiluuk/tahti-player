// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import { renderWithRouter } from '../test/renderWithRouter';
import { TransparencyGrantYearView } from './TransparencyGrantYearView';

const report = {
  year: 2025,
  totalCents: '0',
  grantCount: 0,
  disbursedAt: null,
  grants: [],
};

describe('TransparencyGrantYearView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows an error with Retry when the report fails to load', async () => {
    const fetch = vi
      .spyOn(client, 'fetchTransparencyGrants')
      .mockRejectedValue(new Error('x'));
    await renderWithRouter(<TransparencyGrantYearView year={2025} />, {
      paths: ['/transparency'],
    });
    expect(
      await screen.findByText('Could not load the 2025 grant report'),
    ).toBeTruthy();
    fetch.mockResolvedValue({ data: report as never, meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(
      await screen.findByText('No grants were made this year.'),
    ).toBeTruthy();
  });
});
