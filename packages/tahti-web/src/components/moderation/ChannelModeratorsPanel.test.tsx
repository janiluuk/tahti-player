// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../api/artist-settings';
import { ChannelModeratorsPanel } from './ChannelModeratorsPanel';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const ADA = {
  id: 'm1',
  userId: 'u1',
  username: 'mod-ada',
  displayName: 'Ada Mod',
} as api.ModeratorRow;

async function renderPanel(moderators: api.ModeratorRow[] = []) {
  vi.spyOn(api, 'fetchModerators').mockResolvedValue({
    data: moderators,
    meta: { source: 'api' },
  } as never);
  await act(async () => {
    render(<ChannelModeratorsPanel />);
  });
}

describe('ChannelModeratorsPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('adds a moderator by handle, with or without the @, and says they were told', async () => {
    const add = vi
      .spyOn(api, 'addModerator')
      .mockResolvedValue({ ok: true, data: ADA });
    await renderPanel();
    expect(screen.getByText('No moderators yet')).toBeTruthy();
    const button = screen.getByRole('button', { name: 'Add moderator' });
    expect((button as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: ' @mod-ada ' },
    });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(add).toHaveBeenCalledWith('mod-ada');
    expect(toast.success).toHaveBeenCalledWith(
      "Added Ada Mod as moderator. They've been notified.",
    );
    expect((screen.getByLabelText('Username') as HTMLInputElement).value).toBe(
      '',
    );
  });

  it('adds on Enter and shows why when the API refuses', async () => {
    const add = vi
      .spyOn(api, 'addModerator')
      .mockResolvedValue({ ok: false, error: 'User not found' });
    await renderPanel();
    const input = screen.getByLabelText('Username');
    fireEvent.change(input, { target: { value: 'nobody' } });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
    });
    expect(add).toHaveBeenCalledWith('nobody');
    expect(toast.error).toHaveBeenCalledWith('User not found');
    expect((input as HTMLInputElement).value).toBe('nobody');
  });

  it('removes a moderator only after the confirm', async () => {
    const remove = vi
      .spyOn(api, 'removeModerator')
      .mockResolvedValue({ ok: true });
    await renderPanel([ADA]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Ada Mod as moderator' }),
    );
    expect(remove).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    });
    expect(remove).toHaveBeenCalledWith('m1');
  });
});
