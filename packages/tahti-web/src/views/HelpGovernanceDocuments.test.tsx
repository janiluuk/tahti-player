import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  GOVERNANCE_DOCUMENTS,
  SERVICE_DOCUMENTS,
} from '../content/documentLinks';
import { useAuthStore } from '../stores/authStore';
import { HelpHubView } from './HelpView';
import { StudioGovernanceView } from './studio/StudioGovernanceView';

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
  useRouterState: () => '/studio/governance',
}));

vi.mock('../components/StudioNav', () => ({ StudioNav: () => null }));

describe('governance documents live in Studio → Governance, not Help', () => {
  afterEach(() => {
    cleanup();
    useAuthStore.setState({ user: null, hydrated: false });
  });

  it('Help lists no governance documents, only policies at the bottom', () => {
    render(<HelpHubView />);
    for (const doc of GOVERNANCE_DOCUMENTS) {
      expect(screen.queryByText(doc.title)).toBeNull();
    }
    expect(screen.queryByText('Documents and public records')).toBeNull();
    const policies = screen.getByTestId('help-policies');
    for (const doc of SERVICE_DOCUMENTS) {
      expect(within(policies).getByText(doc.title)).toBeTruthy();
    }
  });

  it('Studio → Governance → Documents lists them', () => {
    useAuthStore.setState({
      hydrated: true,
      user: {
        id: 'u1',
        email: 'yaniho@example.com',
        username: 'yaniho',
        displayName: 'Yaniho',
        role: 'ARTIST',
        roles: ['ARTIST'],
      },
    });
    render(<StudioGovernanceView tab="documents" />);
    const documents = screen.getByTestId('governance-documents');
    for (const doc of GOVERNANCE_DOCUMENTS) {
      expect(within(documents).getByText(doc.title)).toBeTruthy();
    }
  });
});
