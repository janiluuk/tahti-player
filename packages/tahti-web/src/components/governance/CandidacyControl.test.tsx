import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as elections from '../../api/governance-elections';
import { CandidacyControl } from './CandidacyControl';

const [open, decided] = elections.mockGovernanceElections();

describe('CandidacyControl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('puts the member forward with their statement', async () => {
    const stand = vi
      .spyOn(elections, 'standForElection')
      .mockResolvedValue({ ok: true });
    const onChanged = vi.fn();
    render(<CandidacyControl election={open!} onChanged={onChanged} />);

    fireEvent.click(screen.getByRole('button', { name: 'Stand for election' }));
    fireEvent.change(screen.getByLabelText('Why you are standing (optional)'), {
      target: { value: 'More open books' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Stand in this election' }),
    );

    expect(stand).toHaveBeenCalledWith(open!.id, 'More open books');
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it('shows why standing was refused', async () => {
    vi.spyOn(elections, 'standForElection').mockResolvedValue({
      ok: false,
      error: 'Nominations for this election are closed',
    });
    render(<CandidacyControl election={open!} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Stand for election' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Stand in this election' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Nominations for this election are closed',
    );
  });

  it('withdraws a candidacy after confirming', async () => {
    const withdraw = vi
      .spyOn(elections, 'withdrawCandidacy')
      .mockResolvedValue({ ok: true });
    const onChanged = vi.fn();
    render(
      <CandidacyControl
        election={{ ...open!, youAreCandidate: true }}
        onChanged={onChanged}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Withdraw my candidacy' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));
    expect(withdraw).toHaveBeenCalledWith(open!.id);
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it('offers nothing once the election is decided', () => {
    const { container } = render(
      <CandidacyControl
        election={{ ...decided!, youAreCandidate: true }}
        onChanged={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
