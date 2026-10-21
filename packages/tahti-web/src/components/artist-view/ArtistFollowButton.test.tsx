import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthModalStore } from '../../stores/authModalStore';
import { useAuthStore } from '../../stores/authStore';
import { ArtistFollowButton } from './ArtistFollowButton';

describe('ArtistFollowButton', () => {
  afterEach(() => {
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
    useAuthModalStore.getState().close();
  });

  it('opens sign-in for a visitor with no account', () => {
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
    const onToggle = vi.fn();
    render(
      <ArtistFollowButton
        displayName="Northern Lights"
        following={false}
        busy={false}
        onToggle={onToggle}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Log in to follow Northern Lights' }),
    );

    expect(onToggle).not.toHaveBeenCalled();
    expect(useAuthModalStore.getState().isOpen).toBe(true);
  });

  it('follows for a signed-in visitor', () => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        email: 'fan@example.com',
        username: 'fan',
        displayName: 'Fan',
        role: 'LISTENER',
        isMember: false,
      },
      hydrated: true,
      loading: false,
    });
    const onToggle = vi.fn();
    render(
      <ArtistFollowButton
        displayName="Northern Lights"
        following={false}
        busy={false}
        onToggle={onToggle}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Follow Northern Lights' }),
    );

    expect(onToggle).toHaveBeenCalledOnce();
    expect(useAuthModalStore.getState().isOpen).toBe(false);
  });
});
