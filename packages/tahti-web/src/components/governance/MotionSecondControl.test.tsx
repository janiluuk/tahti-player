// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { GovernanceMotion } from '../../api/types';
import { MotionSecondControl } from './MotionSecondControl';

const secondMotion = vi.fn();
const withdrawMotionSecond = vi.fn();

vi.mock('../../api/governance-seconds', () => ({
  secondMotion: (id: string) => secondMotion(id),
  withdrawMotionSecond: (id: string) => withdrawMotionSecond(id),
}));

const draft: GovernanceMotion = {
  id: 'motion-5',
  title: 'Draft',
  state: 'DRAFT',
  secondCount: 1,
  youSeconded: false,
};

describe('MotionSecondControl', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('seconds a draft and reloads the motion', async () => {
    secondMotion.mockResolvedValue({ ok: true, secondCount: 2 });
    const onChanged = vi.fn();
    render(<MotionSecondControl motion={draft} onChanged={onChanged} />);

    expect(screen.getByText('Seconded by 1 member')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Second this motion' }));

    await vi.waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(secondMotion).toHaveBeenCalledWith('motion-5');
  });

  it('offers to withdraw a second already given', () => {
    render(
      <MotionSecondControl
        motion={{ ...draft, youSeconded: true }}
        onChanged={() => {}}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Withdraw my second' }),
    ).toBeTruthy();
  });

  it('shows why a second was refused', async () => {
    secondMotion.mockResolvedValue({
      ok: false,
      error: 'You cannot second your own motion',
    });
    render(<MotionSecondControl motion={draft} onChanged={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Second this motion' }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      'You cannot second your own motion',
    );
  });

  it('shows the count without a button once voting has opened', () => {
    render(
      <MotionSecondControl
        motion={{ ...draft, state: 'OPEN', secondCount: 3 }}
        onChanged={() => {}}
      />,
    );

    expect(screen.getByText('Seconded by 3 members')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows nothing for a motion that opened without seconds', () => {
    const { container } = render(
      <MotionSecondControl
        motion={{ ...draft, state: 'CLOSED', secondCount: 0 }}
        onChanged={() => {}}
      />,
    );

    expect(container.textContent).toBe('');
  });
});
