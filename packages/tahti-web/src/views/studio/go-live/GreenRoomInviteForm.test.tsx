// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../api/green-room-session';
import { GreenRoomInviteForm } from './GreenRoomInviteForm';

const SESSION: api.GreenRoomSession = {
  enabled: true,
  channelState: 'PREVIEW',
  invitePool: 'MODERATORS_AND_SUBS',
  invites: [
    {
      userId: 'm1',
      username: 'mod',
      displayName: 'Mod',
      source: 'MODERATOR',
      invitedAt: '2026-09-30T12:00:00.000Z',
      joinedAt: null,
    },
  ],
  candidates: [
    { userId: 'm1', username: 'mod', displayName: 'Mod', kind: 'MODERATOR' },
    { userId: 's1', username: 'sub', displayName: 'Sub', kind: 'FAN_SUB' },
  ],
};

describe('GreenRoomInviteForm', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('invites by handle and from the suggestions not yet invited', async () => {
    const invite = vi.spyOn(api, 'inviteToGreenRoom').mockResolvedValue({
      ok: true,
      data: { ...SESSION.invites[0]!, userId: 'x', username: 'fan' },
    });
    const onInvited = vi.fn();
    render(
      <GreenRoomInviteForm
        session={SESSION}
        onInvited={onInvited}
        onSynced={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /Mod \(moderator\)/ }),
    ).toBeNull();
    fireEvent.change(screen.getByLabelText('Invite by handle'), {
      target: { value: ' @fan ' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
    });
    expect(invite).toHaveBeenCalledWith('fan');
    expect(onInvited).toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /Sub \(fan subscriber\)/ }),
      );
    });
    expect(invite).toHaveBeenLastCalledWith('sub');
  });

  it('syncs the invite pool, except for manual-only rooms', async () => {
    const sync = vi
      .spyOn(api, 'syncGreenRoomInvites')
      .mockResolvedValue({ ok: true, data: SESSION });
    const onSynced = vi.fn();
    const { rerender } = render(
      <GreenRoomInviteForm
        session={SESSION}
        onInvited={vi.fn()}
        onSynced={onSynced}
      />,
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: 'Invite anyone new from my invite pool',
        }),
      );
    });
    expect(sync).toHaveBeenCalled();
    expect(onSynced).toHaveBeenCalledWith(SESSION);
    rerender(
      <GreenRoomInviteForm
        session={{ ...SESSION, invitePool: 'MANUAL_ONLY' }}
        onInvited={vi.fn()}
        onSynced={onSynced}
      />,
    );
    expect(
      screen.queryByRole('button', {
        name: 'Invite anyone new from my invite pool',
      }),
    ).toBeNull();
  });
});
