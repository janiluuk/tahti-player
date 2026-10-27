// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../api/me-listening';
import { useAuthStore } from '../../stores/authStore';
import { AcrossDevicesPanel } from './AcrossDevicesPanel';

const renderPanel = async () => {
  const router = createRouter({
    routeTree: createRootRoute({ component: AcrossDevicesPanel }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
};

describe('AcrossDevicesPanel', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 'u1', username: 'listener' } as never,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null });
  });

  it("shows the listener's time, listens and top artists and tracks", async () => {
    const fetchListening = vi.spyOn(api, 'fetchMyListening').mockResolvedValue({
      data: api.MOCK_MY_LISTENING,
      meta: { source: 'api' },
    });
    await renderPanel();
    expect(fetchListening).toHaveBeenCalledWith('30');
    expect(screen.getByText('96')).toBeTruthy();
    expect(
      within(screen.getByTestId('across-devices-artists')).getByText(
        'Kaiku Collective',
      ),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId('across-devices-tracks')).getByText(
        'Polar Night',
      ),
    ).toBeTruthy();
  });

  it('asks again for another period', async () => {
    const fetchListening = vi.spyOn(api, 'fetchMyListening').mockResolvedValue({
      data: api.MOCK_MY_LISTENING,
      meta: { source: 'api' },
    });
    await renderPanel();
    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: 'All time' }));
    });
    expect(fetchListening).toHaveBeenLastCalledWith('all');
  });

  it('shows a retry when the API fails and nothing when signed out', async () => {
    vi.spyOn(api, 'fetchMyListening').mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'HTTP 500' },
    });
    await renderPanel();
    expect(screen.getByText('Could not load your listening')).toBeTruthy();
    cleanup();
    useAuthStore.setState({ user: null });
    await renderPanel();
    expect(screen.queryByTestId('history-across-devices')).toBeNull();
  });
});
