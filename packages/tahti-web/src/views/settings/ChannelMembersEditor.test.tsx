// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ChannelMember } from '../../api/artist-settings';
import * as api from '../../api/channel-members';
import { ChannelMembersEditor } from './ChannelMembersEditor';

const ADA: ChannelMember = {
  id: 'm1',
  name: 'Ada',
  role: 'Vocals',
  pictureUrl: null,
  position: 0,
};

function Harness({ initial }: { initial: ChannelMember[] }) {
  const [members, setMembers] = useState(initial);
  return <ChannelMembersEditor members={members} onChange={setMembers} />;
}

describe('ChannelMembersEditor', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('adds a person with a role', async () => {
    const add = vi.spyOn(api, 'addChannelMember').mockResolvedValue({
      ok: true,
      data: { ...ADA, id: 'm2', name: 'Bo', role: 'Drums' },
    });
    render(<Harness initial={[ADA]} />);
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: ' Bo ' },
    });
    fireEvent.change(screen.getByLabelText('Role'), {
      target: { value: 'Drums' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add person' }));
    });
    expect(add).toHaveBeenCalledWith({ name: 'Bo', role: 'Drums' });
    const rows = within(screen.getByTestId('channel-members')).getAllByRole(
      'listitem',
    );
    expect(rows[1]!.textContent).toContain('Bo');
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('');
  });

  it('edits and removes a person', async () => {
    const update = vi.spyOn(api, 'updateChannelMember').mockResolvedValue({
      ok: true,
      data: { ...ADA, role: 'Vocals, synths' },
    });
    const remove = vi
      .spyOn(api, 'removeChannelMember')
      .mockResolvedValue({ ok: true });
    render(<Harness initial={[ADA]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Ada' }));
    const list = screen.getByTestId('channel-members');
    fireEvent.change(within(list).getByLabelText('Role'), {
      target: { value: 'Vocals, synths' },
    });
    await act(async () => {
      fireEvent.click(within(list).getByRole('button', { name: 'Save' }));
    });
    expect(update).toHaveBeenCalledWith('m1', {
      name: 'Ada',
      role: 'Vocals, synths',
    });
    expect(list.textContent).toContain('Vocals, synths');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove Ada' }));
    });
    expect(remove).toHaveBeenCalledWith('m1');
    expect(screen.getByText('No members listed.')).toBeTruthy();
  });
});
