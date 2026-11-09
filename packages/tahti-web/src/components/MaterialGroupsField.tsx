import { UsersIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button, Input, Select, Toggle } from '@tahti-player/ui';

import {
  createArtistGroup,
  fetchSoundGroupMembership,
  submitGroupSound,
  type GroupMembershipEntry,
} from '../api/groups';
import { removeStudioCollectionItem } from '../api/studio';
import { toastWithUndo } from '../lib/undoToast';
import {
  MaterialMembershipCreateFooter,
  MaterialMembershipList,
} from './MaterialMembershipList';
import { MaterialMetaPanel } from './MaterialMetaPanel';
import { PageLoading } from './PageStates';

function soundsLabel(count: number): string {
  return count === 1 ? '1 sound' : `${count.toLocaleString()} sounds`;
}

type Props = {
  soundId: string;
};

/** Groups card — submit/remove this sound on collective group playlists. */
export function MaterialGroupsField({ soundId }: Props) {
  const { t } = useTranslation('web');
  const [rows, setRows] = useState<GroupMembershipEntry[] | null>(null);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [joinPolicy, setJoinPolicy] = useState<'OPEN' | 'REQUEST'>('OPEN');
  const [submitPolicy, setSubmitPolicy] = useState<'OPEN' | 'APPROVE'>('OPEN');
  const [isPublic, setIsPublic] = useState(true);
  const [createBusy, setCreateBusy] = useState(false);

  const reload = () => {
    void fetchSoundGroupMembership(soundId).then((res) => setRows(res.data));
  };

  useEffect(() => {
    setRows(null);
    reload();
  }, [soundId]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!rows) {
      return [];
    }
    if (!needle) {
      return rows;
    }
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(needle) ||
        row.slug.toLowerCase().includes(needle),
    );
  }, [rows, search]);

  const toggle = async (id: string) => {
    const entry = rows?.find((row) => row.id === id);
    if (!entry || entry.submissionPending) {
      return;
    }
    setBusyId(id);
    try {
      const collectionSlug = entry.collectionSlug;
      if (entry.member && entry.itemId) {
        const removed = await removeStudioCollectionItem(
          collectionSlug,
          entry.itemId,
        );
        if (!removed.ok) {
          toast.error(removed.error);
          return;
        }
        setRows(
          (prev) =>
            prev?.map((row) =>
              row.id === id
                ? {
                    ...row,
                    member: false,
                    itemId: null,
                    itemCount: Math.max(0, row.itemCount - 1),
                  }
                : row,
            ) ?? null,
        );
        toast.success(
          i18n.t('web:toasts.removedFromNamed', { name: entry.name }),
        );
        return;
      }
      const submitted = await submitGroupSound(entry.slug, soundId);
      if (!submitted.ok) {
        toast.error(submitted.error);
        return;
      }
      if (submitted.pending) {
        setRows(
          (prev) =>
            prev?.map((row) =>
              row.id === id ? { ...row, submissionPending: true } : row,
            ) ?? null,
        );
        toast.success(i18n.t('web:toasts.submittedForApproval'));
        return;
      }
      setRows(
        (prev) =>
          prev?.map((row) =>
            row.id === id
              ? {
                  ...row,
                  member: true,
                  itemId: submitted.itemId,
                  itemCount: row.itemCount + 1,
                }
              : row,
          ) ?? null,
      );
      if (submitted.itemId) {
        toastWithUndo(`Added to ${entry.name}.`, {
          undo: () =>
            removeStudioCollectionItem(collectionSlug, submitted.itemId!),
          undoneMessage: `Removed from ${entry.name}.`,
          onUndone: () => {
            setRows(
              (prev) =>
                prev?.map((row) =>
                  row.id === id
                    ? {
                        ...row,
                        member: false,
                        itemId: null,
                        itemCount: Math.max(0, row.itemCount - 1),
                      }
                    : row,
                ) ?? null,
            );
          },
        });
      } else {
        toast.success(i18n.t('web:toasts.addedToNamed', { name: entry.name }));
      }
    } finally {
      setBusyId(null);
    }
  };

  const createGroup = async () => {
    const name = newName.trim();
    if (!name) {
      return;
    }
    setCreateBusy(true);
    try {
      const created = await createArtistGroup({
        name,
        isPublic,
        joinPolicy,
        submitPolicy,
      });
      if (!created.ok) {
        toast.error(created.error);
        return;
      }
      const submitted = await submitGroupSound(created.data.slug, soundId);
      const entry: GroupMembershipEntry = {
        id: created.data.id,
        slug: created.data.slug,
        name: created.data.name,
        coverUrl: created.data.coverUrl,
        isPublic: created.data.isPublic,
        submitPolicy: created.data.submitPolicy,
        role: created.data.role,
        collectionSlug: created.data.collectionSlug,
        itemCount: submitted.ok && submitted.added ? 1 : created.data.itemCount,
        member: Boolean(submitted.ok && submitted.added),
        itemId: submitted.ok ? submitted.itemId : null,
        submissionPending: Boolean(submitted.ok && submitted.pending),
      };
      setRows((prev) => [entry, ...(prev ?? [])]);
      setCreating(false);
      setNewName('');
      toast.success(i18n.t('web:toasts.createdNamed', { name }));
    } finally {
      setCreateBusy(false);
    }
  };

  return (
    <MaterialMetaPanel
      icon={<UsersIcon size={14} strokeWidth={2.5} />}
      title={t('materialGroupsField.groups')}
      description={t('materialGroupsField.groupsYouRunOrBelong')}
    >
      {rows == null ? (
        <PageLoading label={t('loading.loadingGroups')} />
      ) : (
        <MaterialMembershipList
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search your groups"
          emptyLabel={
            search.trim()
              ? 'No groups match that search.'
              : 'You are not in any groups yet.'
          }
          busyId={busyId}
          onToggle={toggle}
          rows={filtered.map((row) => ({
            id: row.id,
            name: row.name,
            coverUrl: row.coverUrl,
            meta: soundsLabel(row.itemCount),
            selected: row.member,
            pending: row.submissionPending,
            disabled: row.submissionPending,
          }))}
          creating={
            creating ? (
              <div className="border-border flex flex-col gap-2 rounded-lg border p-3">
                <Input
                  label={t('materialGroupsField.name')}
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder={t('materialGroupsField.newGroupName')}
                />
                <Select
                  label={t('materialGroupsField.whoCanJoin')}
                  value={joinPolicy}
                  onValueChange={(value) =>
                    setJoinPolicy(value as 'OPEN' | 'REQUEST')
                  }
                  options={[
                    {
                      id: 'OPEN',
                      label: t('materialGroupsFieldMore.anyoneCanJoin'),
                    },
                    {
                      id: 'REQUEST',
                      label: t('materialGroupsFieldMore.requestToJoin'),
                    },
                  ]}
                />
                <Select
                  label={t('materialGroupsField.newSounds')}
                  value={submitPolicy}
                  onValueChange={(value) =>
                    setSubmitPolicy(value as 'OPEN' | 'APPROVE')
                  }
                  options={[
                    {
                      id: 'OPEN',
                      label: t('materialGroupsFieldMore.membersAddRightAway'),
                    },
                    {
                      id: 'APPROVE',
                      label: t('materialGroupsFieldMore.adminsApproveFirst'),
                    },
                  ]}
                />
                <Toggle
                  label={t('materialGroupsField.public')}
                  checked={isPublic}
                  onChange={setIsPublic}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={createBusy || !newName.trim()}
                    onClick={() => void createGroup()}
                  >
                    {t('materialGroupsField.createGroup')}
                  </Button>
                  <Button
                    size="sm"
                    variant="text"
                    onClick={() => setCreating(false)}
                  >
                    {t('materialGroupsField.cancel')}
                  </Button>
                </div>
              </div>
            ) : null
          }
          footer={
            creating ? null : (
              <MaterialMembershipCreateFooter
                label={t('materialGroupsField.newGroup')}
                onClick={() => setCreating(true)}
              />
            )
          }
        />
      )}
    </MaterialMetaPanel>
  );
}
