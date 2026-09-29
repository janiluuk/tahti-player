// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../../../api/admin';
import { ConflictsPanel, NoticeDeliveriesPanel } from './MeetingRecordPanels';

describe('ConflictsPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads when opened and records a declaration', async () => {
    const fetchConflicts = vi
      .spyOn(admin, 'fetchAdminGovernanceConflicts')
      .mockResolvedValue({
        ok: true,
        data: [
          {
            id: 'c1',
            memberId: null,
            displayName: 'Aino Virtanen',
            matter: 'Grant application from her label',
            recused: true,
            declaredAt: '2026-09-29T10:00:00.000Z',
          },
        ],
      });
    const declare = vi
      .spyOn(admin, 'declareAdminGovernanceConflict')
      .mockResolvedValue({
        ok: true,
        data: {
          id: 'c2',
          memberId: null,
          displayName: 'Veikko',
          matter: 'Venue contract',
          recused: true,
          declaredAt: '2026-09-29T10:05:00.000Z',
        },
      });

    render(<ConflictsPanel meetingId="m1" />);
    expect(fetchConflicts).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /Conflicts of interest/ }),
      );
    });
    expect(fetchConflicts).toHaveBeenCalledWith('m1');
    expect(screen.getByText('Grant application from her label')).toBeTruthy();
    expect(screen.getByText('Recused')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Member name'), {
      target: { value: 'Veikko' },
    });
    fireEvent.change(screen.getByLabelText('Matter'), {
      target: { value: 'Venue contract' },
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Record declaration' }),
      );
    });
    expect(declare).toHaveBeenCalledWith('m1', {
      displayName: 'Veikko',
      matter: 'Venue contract',
      recused: true,
    });
    expect(screen.getByText('Venue contract')).toBeTruthy();
  });
});

describe('NoticeDeliveriesPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('counts bounces and never shows an email as the name', async () => {
    vi.spyOn(admin, 'fetchAdminGovernanceNoticeDeliveries').mockResolvedValue({
      ok: true,
      data: [
        {
          id: 'n1',
          memberId: 'u1',
          displayName: 'Aino Virtanen',
          email: 'aino@example.fi',
          sentAt: '2026-09-01T08:00:00.000Z',
          bouncedAt: null,
        },
        {
          id: 'n2',
          memberId: 'u2',
          displayName: 'veikko@example.fi',
          email: 'veikko@example.fi',
          sentAt: '2026-09-01T08:00:00.000Z',
          bouncedAt: '2026-09-01T08:05:00.000Z',
        },
      ],
    });
    render(<NoticeDeliveriesPanel meetingId="m1" />);
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /Notice deliveries/ }),
      );
    });
    expect(
      screen.getByRole('button', {
        name: 'Notice deliveries (2 sent, 1 bounced)',
      }),
    ).toBeTruthy();
    expect(screen.getByText('Unnamed member')).toBeTruthy();
    expect(screen.getByText('Bounced')).toBeTruthy();
  });
});

describe('declareAdminGovernanceConflict', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('needs a name and a matter before sending', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(
      admin.declareAdminGovernanceConflict('m1', {
        displayName: ' ',
        matter: 'x',
        recused: false,
      }),
    ).resolves.toMatchObject({ ok: false });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
