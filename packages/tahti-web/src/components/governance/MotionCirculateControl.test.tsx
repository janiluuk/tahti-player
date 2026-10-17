import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as circulate from '../../api/governance-motion-circulate';
import { MotionCirculateControl } from './MotionCirculateControl';

describe('MotionCirculateControl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('circulates after confirming and says how many were told', async () => {
    const send = vi
      .spyOn(circulate, 'circulateMotion')
      .mockResolvedValue({ ok: true, notified: 41 });
    render(<MotionCirculateControl motionId="m1" />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Circulate for seconds' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Circulate' }));
    expect(send).toHaveBeenCalledWith('m1');
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Sent to 41 members.',
    );
    expect(
      screen.getByRole('button', { name: 'Circulate for seconds' }),
    ).toBeDisabled();
  });

  it('shows that a draft was already circulated', async () => {
    vi.spyOn(circulate, 'circulateMotion').mockResolvedValue({
      ok: false,
      error: 'This draft has already been circulated',
    });
    render(<MotionCirculateControl motionId="m1" />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Circulate for seconds' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Circulate' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'already been circulated',
    );
  });
});
