import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as certificates from '../../api/governance-motion-certificate';
import { MotionResultCorrectionForm } from './MotionResultCorrectionForm';

const current = { YES: 18, NO: 4, ABSTAIN: 2 };

describe('MotionResultCorrectionForm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds a note-only correction', async () => {
    const correct = vi
      .spyOn(certificates, 'correctMotionResult')
      .mockResolvedValue({ ok: true });
    const onCorrected = vi.fn();
    render(
      <MotionResultCorrectionForm
        motionId="m1"
        current={current}
        onCorrected={onCorrected}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Correct the result' }));
    fireEvent.change(screen.getByLabelText('What is being corrected'), {
      target: { value: 'The motion title had a typo.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add correction' }));
    expect(correct).toHaveBeenCalledWith('m1', {
      note: 'The motion title had a typo.',
    });
    await waitFor(() => expect(onCorrected).toHaveBeenCalled());
  });

  it('corrects the count, starting from the current one', () => {
    const correct = vi
      .spyOn(certificates, 'correctMotionResult')
      .mockResolvedValue({ ok: true });
    render(
      <MotionResultCorrectionForm
        motionId="m1"
        current={current}
        onCorrected={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Correct the result' }));
    fireEvent.click(
      screen.getByRole('switch', { name: 'Correct the count too' }),
    );
    expect(screen.getByLabelText('Yes')).toHaveValue('18');
    fireEvent.change(screen.getByLabelText('Yes'), {
      target: { value: '17' },
    });
    fireEvent.change(screen.getByLabelText('What is being corrected'), {
      target: { value: 'One vote was cast twice.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add correction' }));
    expect(correct).toHaveBeenCalledWith('m1', {
      note: 'One vote was cast twice.',
      tally: { YES: 17, NO: 4, ABSTAIN: 2 },
    });
  });
});
