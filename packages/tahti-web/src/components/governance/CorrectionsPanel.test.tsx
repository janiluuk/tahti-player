import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as corrections from '../../api/governance-corrections';
import { CorrectionsPanel } from './CorrectionsPanel';

const answered = corrections.mockGovernanceCorrections()[0]!;

describe('CorrectionsPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists the member's requests with the board's answer", async () => {
    vi.spyOn(corrections, 'fetchMyCorrections').mockResolvedValue({
      data: [answered],
      meta: { source: 'api' },
    });
    render(<CorrectionsPanel />);
    expect(await screen.findByText('Your requests')).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(
      screen.getByText("Board's answer: Fixed in the register."),
    ).toBeInTheDocument();
  });

  it('sends a request and reloads the list', async () => {
    const fetchMine = vi
      .spyOn(corrections, 'fetchMyCorrections')
      .mockResolvedValue({ data: [], meta: { source: 'api' } });
    const send = vi
      .spyOn(corrections, 'requestCorrection')
      .mockResolvedValue({ ok: true, data: answered });
    render(<CorrectionsPanel />);
    fireEvent.change(
      screen.getByLabelText('What is wrong, and what should it be?'),
      { target: { value: 'My member number is 12, not 21.' } },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send to the board' }));
    expect(send).toHaveBeenCalledWith({
      subject: 'MEMBER_REGISTER',
      details: 'My member number is 12, not 21.',
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Sent.');
    await waitFor(() => expect(fetchMine).toHaveBeenCalledTimes(2));
  });

  it('asks for more detail before sending a short request', async () => {
    vi.spyOn(corrections, 'fetchMyCorrections').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    const send = vi.spyOn(corrections, 'requestCorrection');
    render(<CorrectionsPanel />);
    fireEvent.change(
      screen.getByLabelText('What is wrong, and what should it be?'),
      { target: { value: 'wrong' } },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send to the board' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Say what is wrong and what it should be.',
    );
    expect(send).not.toHaveBeenCalled();
  });

  it("shows the API's refusal", async () => {
    vi.spyOn(corrections, 'fetchMyCorrections').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    vi.spyOn(corrections, 'requestCorrection').mockResolvedValue({
      ok: false,
      error: 'You already have 5 correction requests waiting for an answer',
    });
    render(<CorrectionsPanel />);
    fireEvent.change(
      screen.getByLabelText('What is wrong, and what should it be?'),
      { target: { value: 'Another thing that is wrong.' } },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send to the board' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You already have 5 correction requests',
    );
  });
});
