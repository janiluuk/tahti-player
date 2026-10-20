// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminTopListsView } from './AdminTopListsView';

const { fetchAdminTopLists } = vi.hoisted(() => ({
  fetchAdminTopLists: vi.fn(),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => vi.fn(),
}));
vi.mock('../../components/AdminGate', () => ({
  AdminGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../components/AdminNav', () => ({
  AdminPageLayout: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock('../../api/admin', () => ({ fetchAdminTopLists }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AdminTopListsView', () => {
  it('shows a PageError with retry when the API fails', async () => {
    fetchAdminTopLists.mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 500' },
    });
    render(<AdminTopListsView />);
    expect(
      await screen.findByText('Could not load top lists'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
