// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../api/discord-bot';
import type { AuthUser } from '../../api/types';
import { useAuthStore } from '../../stores/authStore';
import { DiscordBotAddonCard } from './DiscordBotAddonCard';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

async function renderCard(tokenConfigured: boolean) {
  useAuthStore.setState({
    user: { username: 'board', isBoard: true } as AuthUser,
  });
  vi.spyOn(api, 'fetchDiscordBotSettings').mockResolvedValue({
    data: {
      clientId: '1168742859038531594',
      tokenConfigured,
      tokenHint: tokenConfigured ? '••••f4eb' : null,
      source: tokenConfigured ? 'database' : 'none',
    },
    meta: { source: 'api' },
  });
  await act(async () => {
    render(<DiscordBotAddonCard />);
  });
}

describe('DiscordBotAddonCard restart', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('restarts a configured bot after confirming', async () => {
    const restart = vi
      .spyOn(api, 'restartDiscordBot')
      .mockResolvedValue({ ok: true });
    await renderCard(true);
    fireEvent.click(
      screen.getByRole('button', { name: 'Restart Tahti Radio Discord bot' }),
    );
    expect(restart).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Restart' }));
    });
    expect(restart).toHaveBeenCalled();
  });

  it('offers no restart before the bot is configured', async () => {
    await renderCard(false);
    expect(
      screen.queryByRole('button', { name: 'Restart Tahti Radio Discord bot' }),
    ).toBeNull();
  });
});
