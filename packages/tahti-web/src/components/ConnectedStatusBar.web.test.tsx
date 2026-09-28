import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../stores/authStore';
import { usePlayerStore } from '../stores/playerStore';
import { ConnectedStatusBar } from './ConnectedStatusBar';

vi.stubEnv('VITE_FORCE_MOCK', '1');

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
}));

describe('status bar in the web app', () => {
  afterEach(() => {
    cleanup();
    globalThis.__TAHTI_NATIVE_CAPABILITIES__ = undefined;
    useAuthStore.setState({ user: null });
  });

  const signedInWithoutPlayer = () => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        email: 'yaniho@example.com',
        username: 'yaniho',
        displayName: 'Yaniho',
      },
    });
    usePlayerStore.setState({ playerBarVisible: false });
  };

  it('is never rendered outside the desktop app', () => {
    signedInWithoutPlayer();
    render(<ConnectedStatusBar />);
    expect(screen.queryByTestId('connected-status-bar')).toBeNull();
  });

  it('is rendered in the desktop app', () => {
    globalThis.__TAHTI_NATIVE_CAPABILITIES__ = { localLibrary: true };
    signedInWithoutPlayer();
    render(<ConnectedStatusBar />);
    expect(screen.getByTestId('connected-status-bar')).toBeTruthy();
  });
});
