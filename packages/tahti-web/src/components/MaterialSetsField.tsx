import { ListMusicIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button, Input, Select, Toggle } from '@tahti-player/ui';

import {
  addStudioCollectionItem,
  createStudioCollection,
  removeStudioCollectionItem,
} from '../api/studio';
import {
  fetchSoundSetMembership,
  type SetMembershipEntry,
} from '../api/studio/studio-set-membership';
import { toastWithUndo } from '../lib/undoToast';
import {
  MaterialMembershipCreateFooter,
  MaterialMembershipList,
} from './MaterialMembershipList';
import { MaterialMetaPanel } from './MaterialMetaPanel';
import { PageLoading } from './PageStates';

function visibilityLabel(entry: SetMembershipEntry): string {
  if (!entry.isPublic || entry.visibility === 'DRAFT') {
    return 'Private';
  }
  if (entry.visibility === 'UNLISTED') {
    return 'Unlisted';
  }
  return 'Public';
}

function soundsLabel(count: number): string {
  return count === 1 ? '1 sound' : `${count} sounds`;
}

type Props = {
  soundId: string;
};

/** Sets card — toggle membership in the artist's collections for one sound. */
export function MaterialSetsField({ soundId }: Props) {
  const { t } = useTranslation('web');
  const [rows, setRows] = useState<SetMembershipEntry[] | null>(null);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStyle, setNewStyle] = useState('PLAYLIST');
  const [newPublic, setNewPublic] = useState(true);
  const [createBusy, setCreateBusy] = useState(false);

  const reload = () => {
    void fetchSoundSetMembership(soundId).then((res) => setRows(res.data));
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
    if (!entry) {
      return;
    }
    setBusyId(id);
    try {
      if (entry.member && entry.itemId) {
        const removed = await removeStudioCollectionItem(
          entry.slug,
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
      const added = await addStudioCollectionItem(entry.slug, { soundId });
      if (!added.ok) {
        toast.error(added.error);
        return;
      }
      setRows(
        (prev) =>
          prev?.map((row) =>
            row.id === id
              ? {
                  ...row,
                  member: true,
                  itemId: added.itemId,
                  itemCount: row.itemCount + 1,
                }
              : row,
          ) ?? null,
      );
      if (added.itemId) {
        toastWithUndo(`Added to ${entry.name}.`, {
          undo: () => removeStudioCollectionItem(entry.slug, added.itemId!),
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

  const createSet = async () => {
    const name = newName.trim();
    if (!name) {
      return;
    }
    setCreateBusy(true);
    try {
      const created = await createStudioCollection({
        name,
        style: newStyle,
        isPublic: newPublic,
      });
      if (!created.ok) {
        toast.error(created.error);
        return;
      }
      const added = await addStudioCollectionItem(created.data.slug, {
        soundId,
      });
      const entry: SetMembershipEntry = {
        id: created.data.id ?? created.data.slug,
        slug: created.data.slug,
        name: created.data.name,
        coverUrl: created.data.coverUrl ?? null,
        style: created.data.style ?? newStyle,
        isPublic: created.data.isPublic !== false,
        visibility:
          (created.data.visibility as SetMembershipEntry['visibility']) ??
          (newPublic ? 'PUBLIC' : 'DRAFT'),
        itemCount: added.ok ? 1 : 0,
        member: added.ok,
        itemId: added.ok ? added.itemId : null,
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
      icon={<ListMusicIcon size={14} strokeWidth={2.5} />}
      title={t('materialSetsField.sets')}
      description={t('materialSetsField.clickASetToAdd')}
    >
      {rows == null ? (
        <PageLoading label={t('loading.loadingSets')} />
      ) : (
        <MaterialMembershipList
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search your sets"
          emptyLabel={
            search.trim()
              ? t('materialSetsFieldStates.noSetsMatchThatSearch')
              : t('materialSetsFieldStates.noSetsYet')
          }
          busyId={busyId}
          onToggle={toggle}
          rows={filtered.map((row) => ({
            id: row.id,
            name: row.name,
            coverUrl: row.coverUrl,
            meta: `${soundsLabel(row.itemCount)} · ${visibilityLabel(row)}`,
            selected: row.member,
          }))}
          creating={
            creating ? (
              <div className="border-border flex flex-col gap-2 rounded-lg border p-3">
                <Input
                  label={t('materialSetsField.name')}
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder={t('materialSetsField.newSetName')}
                />
                <Select
                  label={t('materialSetsField.style')}
                  value={newStyle}
                  onValueChange={setNewStyle}
                  options={[
                    {
                      id: 'PLAYLIST',
                      label: t('materialSetsFieldFields.playlist'),
                    },
                    {
                      id: 'DJ_SET_SERIES',
                      label: t('materialSetsFieldFields.djSet'),
                    },
                  ]}
                />
                <Toggle
                  label={t('materialSetsField.public')}
                  checked={newPublic}
                  onChange={setNewPublic}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={createBusy || !newName.trim()}
                    onClick={() => void createSet()}
                  >
                    {t('materialSetsField.createAndAdd')}
                  </Button>
                  <Button
                    size="sm"
                    variant="text"
                    onClick={() => setCreating(false)}
                  >
                    {t('materialSetsField.cancel')}
                  </Button>
                </div>
              </div>
            ) : null
          }
          footer={
            creating ? null : (
              <MaterialMembershipCreateFooter
                label={t('materialSetsField.newSet')}
                onClick={() => setCreating(true)}
              />
            )
          }
        />
      )}
    </MaterialMetaPanel>
  );
}
