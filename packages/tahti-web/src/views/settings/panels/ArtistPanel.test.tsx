// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as artistSettings from '../../../api/artist-settings';
import * as studioExtras from '../../../api/studio-extras';
import { useAuthStore } from '../../../stores/authStore';
import { ArtistPanel } from './ArtistPanel';

vi.mock('../../studio/StudioBrandingView', () => ({
  StudioBrandingPanel: () => null,
}));
vi.mock('../NewsFeedUrlField', () => ({ NewsFeedUrlField: () => null }));
vi.mock('../SocialAutoPost', () => ({ SocialAutoPost: () => null }));
vi.mock('../NameplateFields', () => ({
  NameplateFields: () => null,
  nameplatePatch: () => ({}),
}));
vi.mock('../../../components/ArtistImagePurposePicker', () => ({
  ArtistImagePurposePicker: () => null,
}));
vi.mock('../../../components/MentionTextarea', () => ({
  MentionTextarea: () => null,
}));

describe('ArtistPanel', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: 'artist@tahti.live',
        username: 'artist',
        displayName: 'An Artist',
        role: 'ARTIST',
        isBoard: false,
        isMember: true,
      },
      hydrated: true,
      loading: false,
    });
    vi.spyOn(artistSettings, 'fetchChannelMembers').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    } as never);
    vi.spyOn(artistSettings, 'fetchSocialConnections').mockResolvedValue({
      data: {},
      meta: { source: 'api' },
    } as never);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
  });

  it('shows an error instead of a blank, saveable profile form', async () => {
    const fetch = vi.spyOn(studioExtras, 'fetchMeProfile').mockResolvedValue({
      data: { id: '', username: 'unknown', displayName: '', bio: '' },
      meta: { source: 'api', reason: 'HTTP 502' },
    } as never);
    render(<ArtistPanel />);
    expect(
      await screen.findByText('Could not load your artist profile'),
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: /Save artist info/ }),
    ).toBeNull();

    fetch.mockResolvedValue({
      data: { id: 'user-1', username: 'artist', displayName: 'An Artist' },
      meta: { source: 'api' },
    } as never);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByDisplayValue('An Artist')).toBeTruthy();
  });
});
