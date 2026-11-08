// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '../../test/renderWithRouter';
import { AdminArtworkPresetsView } from './AdminArtworkPresetsView';

const presets = vi.hoisted(() => ({
  fetchAdminArtworkPresets: vi.fn(async () => ({
    data: [{ id: 'p1', url: 'https://x/p1.png', enabled: true, position: 0 }],
    meta: { source: 'api' },
  })),
  deleteAdminArtworkPreset: vi.fn(async () => ({ ok: true })),
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('../../components/AdminGate', () => ({
  AdminGate: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('../../components/AdminNav', () => ({
  AdminPageLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('../../api/artwork-presets', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/artwork-presets')>()),
  ...presets,
}));

describe('AdminArtworkPresetsView', () => {
  afterEach(cleanup);

  it('removes an artwork only after a red confirm', async () => {
    await renderWithRouter(<AdminArtworkPresetsView />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Remove artwork 1' }),
    );
    const confirm = screen.getByRole('button', { name: 'Remove' });
    expect(confirm.className).toContain('bg-accent-red');
    expect(presets.deleteAdminArtworkPreset).not.toHaveBeenCalled();
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(presets.deleteAdminArtworkPreset).toHaveBeenCalledWith('p1'),
    );
  });

  it('opens the upload dialog from the empty state', async () => {
    presets.fetchAdminArtworkPresets.mockResolvedValueOnce({
      data: [],
      meta: { source: 'api' },
    });
    await renderWithRouter(<AdminArtworkPresetsView />);
    await screen.findByText('No artwork presets yet');
    const ctas = screen.getAllByRole('button', { name: 'Add artwork' });
    expect(ctas).toHaveLength(2);
    fireEvent.click(ctas[1]!);
    expect(await screen.findByRole('dialog')).toBeTruthy();
  });
});
