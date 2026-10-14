// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { GovernanceMotion } from '../../api/types';
import { useAuthStore } from '../../stores/authStore';
import { MotionProposerActions } from './MotionProposerActions';

const navigate = vi.fn();
const withdrawMotionDraft = vi.fn();
const editMotionDraft = vi.fn();

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => navigate,
}));

vi.mock('../../api/governance-drafts', () => ({
  withdrawMotionDraft: (id: string) => withdrawMotionDraft(id),
  editMotionDraft: (id: string, input: unknown) => editMotionDraft(id, input),
}));

const draft: GovernanceMotion = {
  id: 'm1',
  title: 'Draft',
  state: 'DRAFT',
  proposer: 'Aino',
};

function signInAs(displayName: string) {
  useAuthStore.setState({
    user: {
      id: 'u1',
      email: 'u1@tahti.live',
      username: displayName.toLowerCase(),
      displayName,
      role: 'ARTIST',
      isMember: true,
    },
    hydrated: true,
    loading: false,
  });
}

describe('MotionProposerActions', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('lets the proposer withdraw their draft after confirming', async () => {
    signInAs('Aino');
    withdrawMotionDraft.mockResolvedValue({ ok: true });
    const onChanged = vi.fn();
    render(<MotionProposerActions motion={draft} onChanged={onChanged} />);

    fireEvent.click(screen.getByRole('button', { name: 'Withdraw draft' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Withdraw' }));

    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/governance' }),
    );
    expect(withdrawMotionDraft).toHaveBeenCalledWith('m1');
    expect(onChanged).toHaveBeenCalled();
  });

  it('shows why the API refused', async () => {
    signInAs('Aino');
    withdrawMotionDraft.mockResolvedValue({
      ok: false,
      error: 'Only a draft motion can be withdrawn',
    });
    render(<MotionProposerActions motion={draft} onChanged={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Withdraw draft' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Withdraw' }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Only a draft motion can be withdrawn',
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it('is not offered to other members or once voting has opened', () => {
    signInAs('Beata');
    const { container, rerender } = render(
      <MotionProposerActions motion={draft} onChanged={() => {}} />,
    );
    expect(container.textContent).toBe('');

    signInAs('Aino');
    rerender(
      <MotionProposerActions
        motion={{ ...draft, state: 'OPEN' }}
        onChanged={() => {}}
      />,
    );
    expect(container.textContent).toBe('');
  });

  it('lets the proposer edit the draft and says which seconds were cleared', async () => {
    signInAs('Aino');
    editMotionDraft.mockResolvedValue({ ok: true, secondsCleared: 2 });
    const onChanged = vi.fn();
    render(
      <MotionProposerActions
        motion={{ ...draft, secondCount: 2 }}
        description="Old text"
        onChanged={onChanged}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit draft' }));
    expect(screen.getByText(/clears the seconds it has/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Draft text'), {
      target: { value: '  New text ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    expect((await screen.findByRole('status')).textContent).toBe(
      'Draft saved. Its 2 seconds were cleared, because they backed the old text.',
    );
    expect(editMotionDraft).toHaveBeenCalledWith('m1', {
      title: 'Draft',
      description: 'New text',
    });
    expect(onChanged).toHaveBeenCalled();
  });

  it('offers editing only where the full text is loaded', () => {
    signInAs('Aino');
    render(<MotionProposerActions motion={draft} onChanged={() => {}} />);

    expect(screen.queryByRole('button', { name: 'Edit draft' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Withdraw draft' })).toBeTruthy();
  });
});
