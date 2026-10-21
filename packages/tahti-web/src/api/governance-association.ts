import { requestJson } from './client-request';
import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';

export type GovernanceAuditor = {
  id: string;
  kind: 'AUDITOR' | 'OPERATIONS_INSPECTOR';
  deputy: boolean;
  name: string;
  firm: string | null;
  termStart: string;
  termEnd: string | null;
  meetingId: string | null;
};

export type AssociationProfile = {
  name: string | null;
  businessId: string | null;
  registerNumber: string | null;
  domicile: string | null;
  contactEmail: string | null;
  postalAddress: string | null;
  website: string | null;
  updatedAt: string | null;
  auditors: GovernanceAuditor[];
};

const MOCK_PROFILE: AssociationProfile = {
  name: 'Tahti ry',
  businessId: '1234567-8',
  registerNumber: '123.456',
  domicile: 'Helsinki',
  contactEmail: 'hallitus@tahti.live',
  postalAddress: 'PL 1, 00100 Helsinki',
  website: 'https://tahti.live',
  updatedAt: '2026-09-01T00:00:00.000Z',
  auditors: [
    {
      id: 'aud-1',
      kind: 'OPERATIONS_INSPECTOR',
      deputy: false,
      name: 'Anna Virtanen',
      firm: null,
      termStart: '2026-01-01T00:00:00.000Z',
      termEnd: null,
      meetingId: null,
    },
    {
      id: 'aud-2',
      kind: 'OPERATIONS_INSPECTOR',
      deputy: true,
      name: 'Pekka Laine',
      firm: null,
      termStart: '2026-01-01T00:00:00.000Z',
      termEnd: null,
      meetingId: null,
    },
  ],
};

/** The mock profile; the board side edits this same object. */
export function mockAssociationProfile(): AssociationProfile {
  return MOCK_PROFILE;
}

export async function fetchAssociationProfile(): Promise<{
  data: AssociationProfile | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockAssociationProfile(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<AssociationProfile>(
      '/api/v1/governance/association',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: apiErrorMeta(err) };
  }
}
