import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { AuthUser } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { useChannelSetupModalStore } from '../stores/channelSetupModalStore';
import { ChannelSetupDialog } from './ChannelSetupDialog';
import { StudioGate } from './StudioGate';

const artist: AuthUser = {
  id: 'u1',
  email: 'yaniho@example.com',
  username: 'yaniho',
  displayName: 'Yaniho',
  role: 'ARTIST',
  roles: ['ARTIST'],
};

const signIn = (user: AuthUser, profileLoaded: boolean) =>
  useAuthStore.setState({ user, profileLoaded, hydrated: true });

describe('channel setup only for accounts known to have no channel', () => {
  afterEach(() => {
    cleanup();
    useChannelSetupModalStore.getState().close();
    useAuthStore.setState({ user: null, profileLoaded: false });
  });

  it('never offers to create a channel before the full profile has loaded', () => {
    signIn(artist, false);
    useChannelSetupModalStore.getState().open();
    render(<ChannelSetupDialog />);
    expect(screen.queryByText('Create your channel')).toBeNull();
  });

  it('never offers it to an account that has a channel', () => {
    signIn({ ...artist, channel: { slug: 'yaniho', state: 'LIVE' } }, true);
    useChannelSetupModalStore.getState().open();
    render(<ChannelSetupDialog />);
    expect(screen.queryByText('Create your channel')).toBeNull();
  });

  it('offers it once the profile confirms there is no channel', () => {
    signIn(artist, true);
    useChannelSetupModalStore.getState().open();
    render(<ChannelSetupDialog />);
    expect(screen.getByText('Create your channel')).toBeTruthy();
  });

  it('Studio waits for the profile instead of asking for a channel', () => {
    signIn(artist, false);
    render(
      <StudioGate>
        <p>studio</p>
      </StudioGate>,
    );
    expect(screen.queryByText('Artist channel required')).toBeNull();
    expect(screen.getByText('Loading your channel…')).toBeTruthy();
  });
});
