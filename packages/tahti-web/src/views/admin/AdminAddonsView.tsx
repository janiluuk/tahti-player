import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Badge,
  Button,
  Dialog,
  FilterChips,
  ImageReveal,
  Input,
  SaveButton,
  Select,
  Textarea,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  deleteAdminAddon,
  fetchAdminAddons,
  patchAdminAddon,
  registerAdminAddon,
  type AdminAddon,
  type AdminAddonPatch,
  type AdminAddonScope,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ImageUploadField } from '../../components/ImageUploadField';
import { PageLoading } from '../../components/PageStates';

const SCOPES: Array<{ id: AdminAddonScope; label: string }> = [
  { id: 'LISTENER', label: 'Listener' },
  { id: 'ARTIST', label: 'Artist' },
  { id: 'ADMIN', label: 'Admin' },
];

type AddonDraft = AdminAddonPatch & {
  slug: string;
  scope: AdminAddonScope;
};

const EMPTY_DRAFT: AddonDraft = {
  slug: '',
  scope: 'ARTIST',
  name: '',
  description: '',
  authorName: '',
  categories: [],
  iconUrl: '',
};

function draftFromAddon(addon: AdminAddon): AddonDraft {
  return {
    slug: addon.slug,
    scope: addon.scope,
    name: addon.name,
    description: addon.description,
    authorName: addon.authorName,
    categories: addon.categories,
    iconUrl: addon.iconUrl ?? '',
  };
}

function statusColor(status: AdminAddon['status']) {
  switch (status) {
    case 'APPROVED':
      return 'green';
    case 'PENDING':
      return 'purple';
    case 'REJECTED':
      return 'red';
    case 'DISABLED':
      return 'orange';
    default:
      return 'blue';
  }
}

function AddonEditor({
  draft,
  editing,
  pending,
  error,
  onChange,
  onSave,
}: {
  draft: AddonDraft;
  editing: boolean;
  pending: boolean;
  error: string | null;
  onChange: (next: AddonDraft) => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Slug"
          value={draft.slug}
          disabled={editing}
          placeholder="live-status"
          onChange={(event) => onChange({ ...draft, slug: event.target.value })}
          description="Lowercase letters, numbers, and hyphens."
        />
        <Select
          label="Add-on type"
          value={draft.scope}
          onValueChange={(value) =>
            onChange({
              ...draft,
              scope: value as AdminAddonScope,
            })
          }
          options={SCOPES.map((scope) => ({
            id: scope.id,
            label: scope.label,
          }))}
        />
      </div>
      <Input
        label="Name"
        value={draft.name}
        placeholder="Live status"
        onChange={(event) => onChange({ ...draft, name: event.target.value })}
      />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-foreground font-semibold">Description</span>
        <Textarea
          value={draft.description}
          rows={3}
          placeholder="What does this add-on show or do?"
          onChange={(event) =>
            onChange({ ...draft, description: event.target.value })
          }
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Author"
          value={draft.authorName}
          placeholder="Tahti"
          onChange={(event) =>
            onChange({ ...draft, authorName: event.target.value })
          }
        />
        <ImageUploadField
          label="Add-on cover"
          description="JPEG, PNG, WebP, or GIF"
          value={draft.iconUrl ?? ''}
          onChange={(iconUrl) => onChange({ ...draft, iconUrl })}
        />
      </div>
      <Input
        label="Parameters / categories"
        value={draft.categories.join(', ')}
        placeholder="stats, social, events"
        description="Comma-separated categories used to filter and describe the add-on."
        onChange={(event) =>
          onChange({
            ...draft,
            categories: event.target.value
              .split(',')
              .map((category) => category.trim())
              .filter(Boolean),
          })
        }
      />
      {error ? (
        <p className="text-accent-red text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        {editing ? (
          <SaveButton
            type="button"
            disabled={
              pending ||
              !draft.slug.trim() ||
              !draft.name.trim() ||
              !draft.description.trim() ||
              !draft.authorName.trim() ||
              draft.categories.length === 0
            }
            saving={pending}
            label="Save changes"
            onClick={onSave}
          />
        ) : (
          <Button
            type="button"
            disabled={
              pending ||
              !draft.slug.trim() ||
              !draft.name.trim() ||
              !draft.description.trim() ||
              !draft.authorName.trim() ||
              draft.categories.length === 0
            }
            onClick={onSave}
          >
            <Plus size={15} aria-hidden className="mr-1.5" />
            Register add-on
          </Button>
        )}
      </Dialog.Actions>
    </div>
  );
}

export function AdminAddonsView() {
  const [addons, setAddons] = useState<AdminAddon[]>([]);
  const [scope, setScope] = useState<AdminAddonScope | 'ALL'>('ALL');
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<AdminAddon | null>(null);
  const [draft, setDraft] = useState<AddonDraft>(EMPTY_DRAFT);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminAddon | null>(null);

  const reload = () => {
    setLoading(true);
    void fetchAdminAddons().then((result) => {
      setAddons(result.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    reload();
  }, []);

  const openNew = () => {
    setEditingAddon(null);
    setDraft(EMPTY_DRAFT);
    setError(null);
    setEditorOpen(true);
  };

  const openEdit = (addon: AdminAddon) => {
    setEditingAddon(addon);
    setDraft(draftFromAddon(addon));
    setError(null);
    setEditorOpen(true);
  };

  const save = () => {
    setPending(true);
    setError(null);
    const editableFields: AdminAddonPatch = {
      name: draft.name,
      description: draft.description,
      authorName: draft.authorName,
      categories: draft.categories,
      iconUrl: draft.iconUrl,
    };
    const request = editingAddon
      ? patchAdminAddon(editingAddon.id, editableFields)
      : registerAdminAddon(draft);
    void request.then((result) => {
      setPending(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAddons((current) =>
        editingAddon
          ? current.map((addon) =>
              addon.id === result.data.id ? result.data : addon,
            )
          : [result.data, ...current],
      );
      setEditorOpen(false);
    });
  };

  const remove = (addon: AdminAddon) => {
    void deleteAdminAddon(addon.id).then((result) => {
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAddons((current) => current.filter((item) => item.id !== addon.id));
    });
  };

  const pendingCount = addons.filter(
    (addon) => addon.status === 'PENDING',
  ).length;

  const visibleAddons = addons
    .filter((addon) => scope === 'ALL' || addon.scope === scope)
    .filter((addon) => !needsReviewOnly || addon.status === 'PENDING');

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/addons">
          <div className="flex max-w-5xl flex-col gap-6">
            <ViewShell title="Add-ons" classes={{ root: 'px-0 pt-0' }}>
              <Tooltip content="Register a new add-on" side="top">
                <Button
                  type="button"
                  size="icon-sm"
                  aria-label="Register a new add-on"
                  onClick={openNew}
                >
                  <Plus size={18} aria-hidden />
                </Button>
              </Tooltip>

              <FilterChips
                aria-label="Add-on types"
                className="border-border border-b pb-3"
                items={[
                  { id: 'ALL', label: 'All add-ons' },
                  ...SCOPES.map((item) => ({ id: item.id, label: item.label })),
                ]}
                selected={scope}
                onChange={(id) => setScope(id as AdminAddonScope | 'ALL')}
              />

              <FilterChips
                aria-label="Add-on review status"
                className="border-border border-b pb-3"
                items={[
                  { id: 'ALL', label: 'All statuses' },
                  {
                    id: 'PENDING',
                    label:
                      pendingCount > 0
                        ? `Needs review (${pendingCount})`
                        : 'Needs review',
                  },
                ]}
                selected={needsReviewOnly ? 'PENDING' : 'ALL'}
                onChange={(id) => setNeedsReviewOnly(id === 'PENDING')}
              />

              {error && !editorOpen ? (
                <p className="text-accent-red text-sm" role="alert">
                  {error}
                </p>
              ) : null}
              {loading ? (
                <PageLoading label="Loading add-on catalog…" />
              ) : visibleAddons.length === 0 ? (
                <p className="text-foreground-secondary text-sm">
                  {needsReviewOnly
                    ? 'No add-ons need review right now.'
                    : 'No add-ons registered for this type yet.'}
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {visibleAddons.map((addon) => (
                    <article
                      key={addon.id}
                      className="border-border bg-background-secondary/40 flex gap-4 rounded-xl border p-4"
                    >
                      <div className="border-border bg-background flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                        <ImageReveal
                          src={addon.iconUrl ?? undefined}
                          alt=""
                          className="size-full"
                          placeholder={
                            <span className="text-foreground-secondary text-lg font-bold">
                              {addon.name.slice(0, 2).toUpperCase()}
                            </span>
                          }
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold">{addon.name}</h2>
                          <Badge
                            variant="pill"
                            color={statusColor(addon.status)}
                          >
                            {addon.status}
                          </Badge>
                        </div>
                        <p className="text-foreground-secondary mt-1 text-xs">
                          {addon.scope} · v{addon.currentVersion} · {addon.slug}
                        </p>
                        <p className="text-foreground-secondary mt-2 text-sm">
                          {addon.description}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {addon.categories.map((category) => (
                            <Badge key={category} variant="pill" color="blue">
                              {category}
                            </Badge>
                          ))}
                          <span className="text-foreground-secondary text-xs">
                            by {addon.authorName}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-start gap-1">
                        <Tooltip content={`Edit ${addon.name}`} side="top">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="text"
                            aria-label={`Edit ${addon.name}`}
                            onClick={() => openEdit(addon)}
                          >
                            <Pencil size={16} aria-hidden />
                          </Button>
                        </Tooltip>
                        <Tooltip content={`Delete ${addon.name}`} side="top">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="text"
                            aria-label={`Delete ${addon.name}`}
                            onClick={() => setPendingDelete(addon)}
                          >
                            <Trash2 size={16} aria-hidden />
                          </Button>
                        </Tooltip>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <Dialog.Root
                isOpen={editorOpen}
                onClose={() => setEditorOpen(false)}
                className="max-w-2xl"
              >
                <Dialog.Title>
                  {editingAddon
                    ? `Edit ${editingAddon.name}`
                    : 'Register a new add-on'}
                </Dialog.Title>
                <Dialog.Description>
                  Set the add-on identity, store type, cover image, and filter
                  parameters.
                </Dialog.Description>
                <AddonEditor
                  draft={draft}
                  editing={editingAddon !== null}
                  pending={pending}
                  error={error}
                  onChange={setDraft}
                  onSave={save}
                />
              </Dialog.Root>
              <ConfirmDialog
                isOpen={pendingDelete !== null}
                title={
                  pendingDelete
                    ? `Delete “${pendingDelete.name}”?`
                    : 'Delete add-on?'
                }
                description="This removes the add-on from every store permanently."
                confirmLabel="Delete"
                onCancel={() => setPendingDelete(null)}
                onConfirm={() => {
                  const addon = pendingDelete;
                  setPendingDelete(null);
                  if (addon) {
                    remove(addon);
                  }
                }}
              />
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
