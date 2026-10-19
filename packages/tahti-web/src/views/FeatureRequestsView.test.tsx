// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { renderWithRouter } from '../test/renderWithRouter';
import { FeatureRequestsView } from './FeatureRequestsView';

describe('FeatureRequestsView', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: 'member@tahti.live',
        username: 'member',
        displayName: 'A Member',
        role: 'LISTENER',
        isBoard: false,
        isMember: true,
      },
      hydrated: true,
      loading: false,
    });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
  });

  it('says the requests failed to load instead of "No feature requests yet"', async () => {
    const fetch = vi.spyOn(client, 'fetchFeatureRequests').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
      forbidden: false,
    });
    await renderWithRouter(<FeatureRequestsView />);
    expect(
      await screen.findByText('Could not load feature requests'),
    ).toBeTruthy();
    expect(screen.queryByText('No feature requests yet')).toBeNull();

    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No feature requests yet')).toBeTruthy();
  });

  it('keeps the members-only notice when the API refuses', async () => {
    vi.spyOn(client, 'fetchFeatureRequests').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 403' },
      forbidden: true,
    });
    await renderWithRouter(<FeatureRequestsView />);
    expect(
      await screen.findByRole('button', { name: 'Manage membership' }),
    ).toBeTruthy();
    expect(screen.queryByText('Could not load feature requests')).toBeNull();
  });
});
