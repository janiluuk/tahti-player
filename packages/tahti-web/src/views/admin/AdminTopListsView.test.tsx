// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '../../test/renderWithRouter';
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
    await renderWithRouter(<AdminTopListsView />);
    expect(
      await screen.findByText('Could not load top lists'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('ignores a slower answer for a period that is no longer selected', async () => {
    const bucket = (title: string) => ({
      data: [
        {
          bucket: 'Tracks',
          entries: [
            {
              soundId: title,
              listens: 1,
              title,
              artistName: 'DJ Moonlight',
              channelSlug: 'dj-moonlight',
            },
          ],
        },
      ],
      meta: { source: 'api' },
    });
    let answerMonth: (value: unknown) => void = () => undefined;
    fetchAdminTopLists.mockImplementation((period: string) =>
      period === 'month'
        ? new Promise((resolve) => {
            answerMonth = resolve;
          })
        : Promise.resolve(bucket('All time hit')),
    );
    await renderWithRouter(<AdminTopListsView />);
    fireEvent.click(screen.getByRole('radio', { name: 'All time' }));
    expect(await screen.findByText('All time hit')).toBeInTheDocument();
    await act(async () => {
      answerMonth(bucket('Month hit'));
    });
    expect(screen.queryByText('Month hit')).not.toBeInTheDocument();
    expect(screen.getByText('All time hit')).toBeInTheDocument();
  });
});
