// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '../../test/renderWithRouter';
import { AdminAnnouncementsView } from './AdminAnnouncementsView';

vi.mock('../../components/AdminGate', () => ({
  AdminGate: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('../../components/AdminNav', () => ({
  AdminPageLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('../../api/admin', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/admin')>()),
  fetchAdminAnnouncements: vi.fn(async () => ({
    data: {
      systemEnabled: true,
      clips: [
        {
          id: 'c1',
          title: 'Station ident',
          durationSec: 12,
          isEnabled: true,
          scheduleMode: 'EVERY_NTH',
          everyNth: 4,
          renderStatus: 'READY',
          audioUrl: null,
        },
      ],
    },
    meta: { source: 'api' },
  })),
}));

describe('AdminAnnouncementsView', () => {
  afterEach(cleanup);

  it('confirms deleting a clip with a red button', async () => {
    await renderWithRouter(<AdminAnnouncementsView />);
    await screen.findByText('Station ident');
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = within(
      screen.getByRole('dialog', { name: 'Delete "Station ident"?' }),
    );
    expect(dialog.getByRole('button', { name: 'Delete' }).className).toContain(
      'bg-accent-red',
    );
  });
});
