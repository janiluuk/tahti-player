// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { GovernanceMeeting } from '../../../../api/types';
import { AgmTab } from './AgmTab';

const meeting = {
  id: 'm1',
  title: 'Spring AGM',
  type: 'GENERAL',
  state: 'SCHEDULED',
  scheduledAt: null,
  location: null,
  remoteUrl: null,
  noticeAt: null,
  minutesKey: null,
  minutesApprovedAt: null,
  eligibleMemberCount: 10,
  quorumRequired: 5,
  attendanceCount: 0,
  presentCount: 0,
  quorumMet: null,
} as GovernanceMeeting;

vi.mock('../../../../api/admin', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../api/admin')>()),
  fetchAdminAgmMotions: async () => ({ data: [], meta: { source: 'api' } }),
  fetchAdminGovernanceMeetings: async () => ({
    data: [meeting],
    meta: { source: 'api' },
  }),
  fetchAdminGovernanceDocuments: async () => ({
    data: [],
    meta: { source: 'api' },
  }),
  fetchAdminGovernanceAttendance: async () => ({
    data: [],
    meta: { source: 'api' },
  }),
}));

describe('AgmTab meeting records', () => {
  it('shows a meeting state read-only until its pencil is pressed', async () => {
    render(<AgmTab />);
    const edit = await screen.findByRole('button', {
      name: 'Edit state of Spring AGM',
    });
    expect(screen.queryByLabelText('State')).not.toBeInTheDocument();
    await userEvent.click(edit);
    expect(screen.getByLabelText('State')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Done editing' }));
    expect(screen.queryByLabelText('State')).not.toBeInTheDocument();
  });
});
