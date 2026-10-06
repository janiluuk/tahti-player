// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { JamParticipant } from '../api/types';
import { JamParticipantList } from './JamParticipantList';

function participant(
  userId: string,
  role: JamParticipant['role'],
  canControl: boolean,
  displayName = userId,
): JamParticipant {
  return {
    userId,
    username: `${userId}-handle`,
    displayName,
    avatarUrl: null,
    role,
    canControl,
    joinedAt: '2026-10-01T00:00:00.000Z',
  };
}

const participants = [
  participant('host', 'HOST', true, 'Hosty'),
  participant('g1', 'GUEST', false, 'Guest One'),
  participant('g2', 'GUEST', true, ''),
];

describe('JamParticipantList', () => {
  afterEach(cleanup);

  it('gives the host a control toggle per guest, never one for the host', () => {
    const onSetControl = vi.fn();
    render(
      <JamParticipantList
        participants={participants}
        onSetControl={onSetControl}
      />,
    );

    expect(screen.getAllByRole('switch')).toHaveLength(2);
    const g1 = screen.getByRole('switch', {
      name: 'Let Guest One control playback',
    });
    expect(g1.getAttribute('aria-checked')).toBe('false');
    expect(
      screen
        .getByRole('switch', { name: 'Let g2-handle control playback' })
        .getAttribute('aria-checked'),
    ).toBe('true');

    fireEvent.click(g1);
    expect(onSetControl).toHaveBeenCalledWith('g1', true);
  });

  it('disables a toggle while its change is saving', () => {
    render(
      <JamParticipantList
        participants={participants}
        onSetControl={vi.fn()}
        pendingUserIds={new Set(['g1'])}
      />,
    );
    expect(
      screen
        .getByRole('switch', { name: 'Let Guest One control playback' })
        .hasAttribute('disabled'),
    ).toBe(true);
  });

  it('shows guests a badge for who can control, without toggles', () => {
    render(<JamParticipantList participants={participants} />);
    expect(screen.queryByRole('switch')).toBeNull();
    expect(screen.getAllByText('Can control')).toHaveLength(1);
    expect(screen.getByText('g2-handle')).toBeTruthy();
    expect(screen.getByText('3 jamming')).toBeTruthy();
  });

  it('gives the host a remove button per guest, never one for the host', () => {
    const onRemove = vi.fn();
    render(
      <JamParticipantList participants={participants} onRemove={onRemove} />,
    );

    expect(
      screen.queryByRole('button', { name: 'Remove Hosty from the Jam' }),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Guest One from the Jam' }),
    );
    expect(onRemove).toHaveBeenCalledWith(participants[1]);
  });

  it('shows guests no remove button', () => {
    render(<JamParticipantList participants={participants} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
