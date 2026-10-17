// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchGovernanceMotion } from '../../api/governance-member';
import { MotionMeetingNote } from './MotionMeetingNote';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    params,
  }: {
    children: ReactNode;
    params: { id: string };
  }) => <a href={`/governance/meetings/${params.id}`}>{children}</a>,
}));

describe('MotionMeetingNote', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('links the meeting that takes the motion up', () => {
    render(
      <MotionMeetingNote
        meeting={{
          id: 'meet-1',
          title: 'Autumn general meeting',
          scheduledAt: null,
        }}
      />,
    );

    expect(
      screen
        .getByRole('link', { name: 'Autumn general meeting' })
        .getAttribute('href'),
    ).toBe('/governance/meetings/meet-1');
  });

  it('names the agenda item when the board chose one', () => {
    render(
      <MotionMeetingNote
        meeting={{
          id: 'meeting-1',
          title: 'Annual meeting 2026',
          scheduledAt: '2026-04-25T12:00:00.000Z',
        }}
        agendaItem={{ id: 'a2', position: 2, title: 'Annual report 2025' }}
      />,
    );
    expect(screen.getByText(/agenda item 2: Annual report 2025/)).toBeTruthy();
  });

  it('shows nothing for a motion with no meeting', () => {
    const { container } = render(<MotionMeetingNote meeting={null} />);

    expect(container.textContent).toBe('');
  });

  it('gives a mock motion its meeting', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');

    await expect(fetchGovernanceMotion('motion-1')).resolves.toMatchObject({
      ok: true,
      data: { meeting: { id: 'meeting-agm-2026' } },
    });
    await expect(fetchGovernanceMotion('motion-2')).resolves.toMatchObject({
      ok: true,
      data: { meeting: null },
    });
  });
});
