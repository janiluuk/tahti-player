import type {
  GovernanceAgendaItem,
  GovernanceDocument,
  GovernanceMeeting,
  GovernanceMember,
  GovernanceQuarterlyReport,
} from './types';

export function parseMeetingAgenda(agenda: unknown): GovernanceAgendaItem[] {
  if (!Array.isArray(agenda)) {
    return [];
  }
  return agenda.flatMap((item) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof (item as { title?: unknown }).title !== 'string'
    ) {
      return [];
    }
    const title = (item as { title: string }).title.trim();
    if (!title) {
      return [];
    }
    const description = (item as { description?: unknown }).description;
    return [
      {
        title,
        description: typeof description === 'string' ? description : undefined,
      },
    ];
  });
}

export function mockGovernanceMeetings(): GovernanceMeeting[] {
  return [
    {
      id: 'meeting-agm-2026',
      title: '2026 Annual General Meeting',
      type: 'GENERAL',
      state: 'SCHEDULED',
      scheduledAt: '2026-11-15T16:00:00.000Z',
      location: 'Helsinki + remote',
      remoteUrl: 'https://meet.tahti.live/agm-2026',
      noticeAt: '2026-11-01T08:00:00.000Z',
      agenda: [
        {
          title: 'Action plan: 2026 grant formula',
          description:
            'Review the advisory grant-formula motion and the overnight-radio issue before the board records a result.',
        },
        {
          title: 'Action plan: unresolved product issues',
          description:
            'Crossfade and bulk-tag topics still need a board decision this quarter.',
        },
      ],
      minutesKey: null,
      minutesApprovedAt: null,
      eligibleMemberCount: 48,
      quorumRequired: 16,
      attendanceCount: 0,
      presentCount: 0,
      quorumMet: null,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-20T00:00:00.000Z',
    },
    {
      id: 'meeting-board-2026-06',
      title: 'June 2026 board meeting',
      type: 'BOARD',
      state: 'APPROVED',
      scheduledAt: '2026-06-10T17:00:00.000Z',
      location: 'Remote',
      remoteUrl: 'https://meet.tahti.live/board-2026-06',
      noticeAt: '2026-06-01T08:00:00.000Z',
      agenda: [
        {
          title: 'Approve Q2 budget',
          description:
            'Review and approve the second-quarter operating budget.',
        },
      ],
      minutesKey: 'minutes/2026-06-board.pdf',
      minutesUrl: 'https://mock-storage.example/minutes/2026-06-board.pdf',
      minutesApprovedAt: '2026-06-17T00:00:00.000Z',
      eligibleMemberCount: 5,
      quorumRequired: 3,
      attendanceCount: 5,
      presentCount: 4,
      quorumMet: true,
      createdAt: '2026-06-10T17:00:00.000Z',
      updatedAt: '2026-06-17T00:00:00.000Z',
    },
  ];
}

export function mockGovernanceDocuments(): GovernanceDocument[] {
  return [
    {
      id: 'doc-bylaws',
      title: 'Tahti ry bylaws',
      type: 'BYLAWS',
      description: 'Current association rules members use when voting.',
      version: 3,
      effectiveAt: '2026-01-01T00:00:00.000Z',
      publishedAt: '2026-01-02T00:00:00.000Z',
      meetingId: null,
      downloadUrl: null,
      externalUrl: '/help/governance',
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    },
    {
      id: 'doc-annual-plan',
      title: '2026 association action plan',
      type: 'ANNUAL_REPORT',
      description:
        'Published yearly plan: grants, radio hours, and issues still open for members.',
      version: 1,
      effectiveAt: '2026-01-15T00:00:00.000Z',
      publishedAt: '2026-01-15T00:00:00.000Z',
      meetingId: 'meeting-agm-2026',
      downloadUrl: null,
      externalUrl: '/transparency',
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
    },
  ];
}

export function mockGovernanceMembers(): GovernanceMember[] {
  return [
    {
      memberNumber: 1,
      displayName: 'Mart Saar',
      username: 'mart-saar',
      memberSince: '2024-03-01T00:00:00.000Z',
      isBoard: true,
      channelSlug: 'liis-kask-ee',
    },
    {
      memberNumber: 12,
      displayName: 'Demo Member',
      username: 'demo',
      memberSince: '2025-06-01T00:00:00.000Z',
      isBoard: false,
      channelSlug: null,
    },
  ];
}

export function mockGovernanceQuarterlyReports(): GovernanceQuarterlyReport[] {
  return [
    {
      id: 'q-2026-1',
      year: 2026,
      quarter: 1,
      storageKey: 'governance/reports/2026-q1.md',
      generatedAt: '2026-04-02T00:00:00.000Z',
      generatedByDisplayName: 'Board',
      downloadUrl: '/governance/feature-requests',
    },
  ];
}
