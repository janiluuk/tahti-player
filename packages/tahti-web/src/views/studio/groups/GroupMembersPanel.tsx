import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button, ConfirmDialog, MediaArtwork } from '@tahti-player/ui';

import {
  fetchGroupMembers,
  removeGroupMember,
  setGroupMemberRole,
  transferArtistGroup,
  type GroupMember,
} from '../../../api/group-members';
import type { ArtistGroupRole } from '../../../api/groups';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { groupPersonName } from '../../../lib/groupPeople';
import { useAuthStore } from '../../../stores/authStore';

type Props = {
  slug: string;
  viewerRole: ArtistGroupRole;
  onMembersChanged?: () => void;
  /** Called after the owner hands the group over (they are now an admin). */
  onTransferred?: () => void;
};

/** Who may remove whom: owner and admins remove members, only the owner
 * removes admins, nobody removes the owner or themselves. */
export function canRemoveMember(
  viewerRole: ArtistGroupRole,
  member: GroupMember,
  viewerUsername: string | undefined,
): boolean {
  if (member.role === 'OWNER' || member.username === viewerUsername) {
    return false;
  }
  if (viewerRole === 'OWNER') {
    return true;
  }
  return viewerRole === 'ADMIN' && member.role === 'MEMBER';
}

export function GroupMembersPanel({
  slug,
  viewerRole,
  onMembersChanged,
  onTransferred,
}: Props) {
  const { t } = useTranslation('web');
  const viewerUsername = useAuthStore((s) => s.user?.username);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<GroupMember | null>(null);
  const [busy, setBusy] = useState(false);
  const [handingTo, setHandingTo] = useState<GroupMember | null>(null);
  const [roleBusy, setRoleBusy] = useState<string | null>(null);

  const roleLabel = {
    OWNER: t('groupDetail.roleOwner'),
    ADMIN: t('groupDetail.roleAdmin'),
    MEMBER: t('groupDetail.roleMember'),
  } as const;

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchGroupMembers(slug);
    setMembers(result.data);
    setTotal(result.total);
    setError(
      result.meta.source === 'api' || result.data.length > 0
        ? null
        : (result.meta.reason ?? null),
    );
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmRemove = async () => {
    if (!removing) {
      return;
    }
    setBusy(true);
    const result = await removeGroupMember(slug, removing.username);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      t('studioGroups.memberRemoved', { name: groupPersonName(removing) }),
    );
    setMembers((rows) => rows.filter((m) => m.username !== removing.username));
    setTotal((count) => Math.max(0, count - 1));
    setRemoving(null);
    onMembersChanged?.();
  };

  const changeRole = async (member: GroupMember) => {
    const role = member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    setRoleBusy(member.username);
    const result = await setGroupMemberRole(slug, member.username, role);
    setRoleBusy(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      t(
        role === 'ADMIN' ? 'studioGroups.madeAdmin' : 'studioGroups.madeMember',
        {
          name: groupPersonName(member),
        },
      ),
    );
    setMembers((rows) =>
      rows.map((m) => (m.username === member.username ? { ...m, role } : m)),
    );
  };

  const confirmHandOver = async () => {
    if (!handingTo) {
      return;
    }
    setBusy(true);
    const result = await transferArtistGroup(slug, handingTo.username);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      t('studioGroups.handedOver', { name: groupPersonName(handingTo) }),
    );
    setHandingTo(null);
    await load();
    onTransferred?.();
  };

  return (
    <StudioPanel
      title={t('studioGroups.membersTitle')}
      description={t('studioGroups.membersDescription')}
      action={
        total > 0 ? (
          <Badge variant="pill" color="secondary">
            {total}
          </Badge>
        ) : null
      }
    >
      {loading ? (
        <PageLoading label={t('studioGroups.membersLoading')} />
      ) : error ? (
        <PageError
          title={t('studioGroups.membersLoadError')}
          onRetry={() => void load()}
        />
      ) : members.length === 0 ? (
        <PageEmpty title={t('studioGroups.membersEmpty')} />
      ) : (
        <ul
          className="flex flex-col gap-2"
          aria-label={t('studioGroups.membersTitle')}
        >
          {members.map((member) => (
            <li
              key={member.username}
              className="border-border bg-background flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <MediaArtwork
                  src={member.avatarUrl ?? undefined}
                  alt=""
                  seed={member.username}
                  size="sm"
                  className="rounded-full"
                />
                <Link
                  to="/u/$username"
                  params={{ username: member.username }}
                  className="truncate font-medium hover:underline"
                >
                  {groupPersonName(member)}
                </Link>
                <Badge variant="pill" color="secondary">
                  {roleLabel[member.role]}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {viewerRole === 'OWNER' && member.role !== 'OWNER' ? (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={roleBusy === member.username}
                      aria-label={t(
                        member.role === 'ADMIN'
                          ? 'studioGroups.makeMemberNamed'
                          : 'studioGroups.makeAdminNamed',
                        { name: groupPersonName(member) },
                      )}
                      onClick={() => void changeRole(member)}
                    >
                      {t(
                        member.role === 'ADMIN'
                          ? 'studioGroups.makeMember'
                          : 'studioGroups.makeAdmin',
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="text"
                      aria-label={t('studioGroups.handOverNamed', {
                        name: groupPersonName(member),
                      })}
                      onClick={() => setHandingTo(member)}
                    >
                      {t('studioGroups.handOver')}
                    </Button>
                  </>
                ) : null}
                {canRemoveMember(viewerRole, member, viewerUsername) ? (
                  <Button
                    size="sm"
                    variant="text"
                    aria-label={t('studioGroups.removeMemberNamed', {
                      name: groupPersonName(member),
                    })}
                    onClick={() => setRemoving(member)}
                  >
                    {t('studioGroups.removeMember')}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        isOpen={removing !== null}
        title={t('studioGroups.removeMemberTitle', {
          name: removing ? groupPersonName(removing) : '',
        })}
        description={t('studioGroups.removeMemberDescription')}
        confirmLabel={t('studioGroups.removeMember')}
        destructive
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (!busy) {
            void confirmRemove();
          }
        }}
      />
      <ConfirmDialog
        isOpen={handingTo !== null}
        title={t('studioGroups.handOverTitle', {
          name: handingTo ? groupPersonName(handingTo) : '',
        })}
        description={t('studioGroups.handOverDescription')}
        confirmLabel={t('studioGroups.handOver')}
        onCancel={() => setHandingTo(null)}
        onConfirm={() => {
          if (!busy) {
            void confirmHandOver();
          }
        }}
      />
    </StudioPanel>
  );
}
