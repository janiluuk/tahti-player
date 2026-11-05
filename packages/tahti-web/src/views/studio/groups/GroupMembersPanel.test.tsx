import { act, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchGroupMembers,
  removeGroupMember,
  setGroupMemberRole,
  transferArtistGroup,
  type GroupMember,
} from '../../../api/group-members';
import { useAuthStore } from '../../../stores/authStore';
import { renderWithRouter } from '../../../test/renderWithRouter';
import { canRemoveMember, GroupMembersPanel } from './GroupMembersPanel';

vi.mock('../../../api/group-members', () => ({
  fetchGroupMembers: vi.fn(),
  removeGroupMember: vi.fn(),
  setGroupMemberRole: vi.fn(),
  transferArtistGroup: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const member = (username: string, role: GroupMember['role']): GroupMember => ({
  username,
  displayName: username.toUpperCase(),
  avatarUrl: null,
  role,
  joinedAt: '2026-11-01T00:00:00.000Z',
});

const MEMBERS = [
  member('owner', 'OWNER'),
  member('admin', 'ADMIN'),
  member('fan', 'MEMBER'),
];

describe('canRemoveMember', () => {
  it('lets the owner remove admins and members, admins only members, nobody the owner or self', () => {
    expect(canRemoveMember('OWNER', MEMBERS[1]!, 'owner')).toBe(true);
    expect(canRemoveMember('OWNER', MEMBERS[2]!, 'owner')).toBe(true);
    expect(canRemoveMember('ADMIN', MEMBERS[1]!, 'other-admin')).toBe(false);
    expect(canRemoveMember('ADMIN', MEMBERS[2]!, 'admin')).toBe(true);
    expect(canRemoveMember('ADMIN', MEMBERS[0]!, 'admin')).toBe(false);
    expect(canRemoveMember('MEMBER', MEMBERS[2]!, 'someone')).toBe(false);
    expect(canRemoveMember('ADMIN', MEMBERS[1]!, 'admin')).toBe(false);
  });
});

describe('GroupMembersPanel', () => {
  beforeEach(() => {
    vi.mocked(fetchGroupMembers).mockResolvedValue({
      data: MEMBERS,
      total: 3,
      meta: { source: 'api' },
    });
    useAuthStore.setState({ user: { username: 'admin' } as never });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lists every member with a role and shows Remove only where allowed', async () => {
    await renderWithRouter(
      <GroupMembersPanel slug="crew" viewerRole="ADMIN" />,
    );
    const list = await screen.findByRole('list', { name: 'Members' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(within(list).getByRole('link', { name: 'OWNER' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /^Remove/ })).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: 'Remove FAN from the group' }),
    ).toBeTruthy();
  });

  it('removes a member after confirming and tells the parent', async () => {
    vi.mocked(removeGroupMember).mockResolvedValue({ ok: true });
    const onMembersChanged = vi.fn();
    await renderWithRouter(
      <GroupMembersPanel
        slug="crew"
        viewerRole="ADMIN"
        onMembersChanged={onMembersChanged}
      />,
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Remove FAN from the group' }),
    );
    expect(screen.getByText('Remove FAN?')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    });
    expect(removeGroupMember).toHaveBeenCalledWith('crew', 'fan');
    expect(onMembersChanged).toHaveBeenCalled();
    expect(screen.queryByRole('link', { name: 'FAN' })).toBeNull();
  });

  it('shows role and hand-over controls to the owner only', async () => {
    await renderWithRouter(
      <GroupMembersPanel slug="crew" viewerRole="ADMIN" />,
    );
    await screen.findByRole('list', { name: 'Members' });
    expect(screen.queryByRole('button', { name: /^Make/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Hand/ })).toBeNull();
  });

  it('lets the owner promote a member and demote an admin', async () => {
    useAuthStore.setState({ user: { username: 'owner' } as never });
    vi.mocked(setGroupMemberRole).mockResolvedValue({ ok: true });
    await renderWithRouter(
      <GroupMembersPanel slug="crew" viewerRole="OWNER" />,
    );
    await act(async () => {
      fireEvent.click(
        await screen.findByRole('button', { name: 'Make FAN an admin' }),
      );
    });
    expect(setGroupMemberRole).toHaveBeenCalledWith('crew', 'fan', 'ADMIN');
    expect(
      screen.getByRole('button', { name: 'Make FAN a member again' }),
    ).toBeTruthy();
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Make ADMIN a member again' }),
      );
    });
    expect(setGroupMemberRole).toHaveBeenLastCalledWith(
      'crew',
      'admin',
      'MEMBER',
    );
  });

  it('hands the group over after confirming', async () => {
    useAuthStore.setState({ user: { username: 'owner' } as never });
    vi.mocked(transferArtistGroup).mockResolvedValue({ ok: true });
    const onTransferred = vi.fn();
    await renderWithRouter(
      <GroupMembersPanel
        slug="crew"
        viewerRole="OWNER"
        onTransferred={onTransferred}
      />,
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Hand the group over to FAN' }),
    );
    expect(screen.getByText('Hand the group over to FAN?')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Hand over' }));
    });
    expect(transferArtistGroup).toHaveBeenCalledWith('crew', 'fan');
    expect(onTransferred).toHaveBeenCalled();
  });
});
