// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../api/admin';
import { renderWithRouter } from '../../test/renderWithRouter';
import { AdminGrantCycleView } from './AdminGrantCycleView';

vi.mock('../../components/AdminGate', () => ({
  AdminGate: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('../../components/AdminNav', () => ({
  AdminPageLayout: ({ children }: { children: ReactNode }) => children,
}));

const meta = { source: 'api' as const };

describe('AdminGrantCycleView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('retries a failed preview and says when no artist qualified', async () => {
    const preview = vi
      .spyOn(admin, 'fetchAdminGrantPreview')
      .mockResolvedValue({ data: null, meta });
    vi.spyOn(admin, 'fetchAdminGrantHistory').mockResolvedValue({
      data: null,
      meta,
    });
    await renderWithRouter(<AdminGrantCycleView />);
    expect(
      await screen.findByText('Could not load the grant preview'),
    ).toBeTruthy();

    preview.mockResolvedValue({
      data: { year: 2025, poolCents: 0, totalUnits: 0, artists: [] },
      meta,
    } as never);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText(/No artist activity in/)).toBeTruthy();
    expect(screen.getByText(/notifies each of them of their/)).toBeTruthy();
  });
});
