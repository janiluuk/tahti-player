import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as queue from '../../../../api/admin/admin-governance-corrections';
import { AnswerCorrectionForm } from './AnswerCorrectionForm';

describe('AnswerCorrectionForm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts with a note for the member', async () => {
    const answer = vi
      .spyOn(queue, 'answerAdminCorrection')
      .mockResolvedValue({ ok: true });
    const onAnswered = vi.fn();
    render(<AnswerCorrectionForm id="c1" onAnswered={onAnswered} />);
    fireEvent.click(screen.getByRole('button', { name: 'Answer' }));
    fireEvent.change(
      screen.getByLabelText('What was decided (the member reads this)'),
      { target: { value: 'Fixed in the register.' } },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    expect(answer).toHaveBeenCalledWith('c1', {
      state: 'ACCEPTED',
      resolutionNote: 'Fixed in the register.',
    });
    await waitFor(() => expect(onAnswered).toHaveBeenCalled());
  });

  it("shows the API's refusal to answer your own request", async () => {
    vi.spyOn(queue, 'answerAdminCorrection').mockResolvedValue({
      ok: false,
      error: 'Another board member has to answer your own request',
    });
    render(<AnswerCorrectionForm id="c1" onAnswered={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Answer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Another board member has to answer',
    );
  });
});
