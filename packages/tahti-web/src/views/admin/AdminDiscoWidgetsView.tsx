import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Badge,
  Button,
  Dialog,
  FilterChips,
  Input,
  SaveButton,
  Select,
  Textarea,
} from '@tahti-player/ui';

import {
  deleteAdminDiscoWidget,
  fetchAdminDiscoWidgets,
  patchAdminDiscoWidget,
  registerAdminDiscoWidget,
  type AdminDiscoWidget,
  type AdminDiscoWidgetPatch,
  type AdminDiscoWidgetScope,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ImageUploadField } from '../../components/ImageUploadField';
import { PageLoading } from '../../components/PageStates';
import { StudioPageHeader } from '../../components/StudioPanel';

const SCOPES: Array<{ id: AdminDiscoWidgetScope; label: string }> = [
  { id: 'LISTENER', label: 'Listener' },
  { id: 'ARTIST', label: 'Artist' },
  { id: 'ADMIN', label: 'Admin' },
];

type WidgetDraft = AdminDiscoWidgetPatch & {
  slug: string;
  scope: AdminDiscoWidgetScope;
};

const EMPTY_DRAFT: WidgetDraft = {
  slug: '',
  scope: 'ARTIST',
  name: '',
  description: '',
  authorName: '',
  categories: [],
  iconUrl: '',
};

function draftFromWidget(widget: AdminDiscoWidget): WidgetDraft {
  return {
    slug: widget.slug,
    scope: widget.scope,
    name: widget.name,
    description: widget.description,
    authorName: widget.authorName,
    categories: widget.categories,
    iconUrl: widget.iconUrl ?? '',
  };
}

function statusColor(status: AdminDiscoWidget['status']) {
  return status === 'APPROVED'
    ? 'green'
    : status === 'DISABLED'
      ? 'orange'
      : 'blue';
}

function WidgetEditor({
  draft,
  editing,
  pending,
  error,
  onChange,
  onSave,
}: {
  draft: WidgetDraft;
  editing: boolean;
  pending: boolean;
  error: string | null;
  onChange: (next: WidgetDraft) => void;
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
              scope: value as AdminDiscoWidgetScope,
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
          label="Widget cover"
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
            Register widget
          </Button>
        )}
      </Dialog.Actions>
    </div>
  );
}

export function AdminDiscoWidgetsView() {
  const [widgets, setWidgets] = useState<AdminDiscoWidget[]>([]);
  const [scope, setScope] = useState<AdminDiscoWidgetScope | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<AdminDiscoWidget | null>(
    null,
  );
  const [draft, setDraft] = useState<WidgetDraft>(EMPTY_DRAFT);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminDiscoWidget | null>(
    null,
  );

  const reload = () => {
    setLoading(true);
    void fetchAdminDiscoWidgets().then((result) => {
      setWidgets(result.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    reload();
  }, []);

  const openNew = () => {
    setEditingWidget(null);
    setDraft(EMPTY_DRAFT);
    setError(null);
    setEditorOpen(true);
  };

  const openEdit = (widget: AdminDiscoWidget) => {
    setEditingWidget(widget);
    setDraft(draftFromWidget(widget));
    setError(null);
    setEditorOpen(true);
  };

  const save = () => {
    setPending(true);
    setError(null);
    const editableFields: AdminDiscoWidgetPatch = {
      name: draft.name,
      description: draft.description,
      authorName: draft.authorName,
      categories: draft.categories,
      iconUrl: draft.iconUrl,
    };
    const request = editingWidget
      ? patchAdminDiscoWidget(editingWidget.id, editableFields)
      : registerAdminDiscoWidget(draft);
    void request.then((result) => {
      setPending(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setWidgets((current) =>
        editingWidget
          ? current.map((widget) =>
              widget.id === result.data.id ? result.data : widget,
            )
          : [result.data, ...current],
      );
      setEditorOpen(false);
    });
  };

  const remove = (widget: AdminDiscoWidget) => {
    void deleteAdminDiscoWidget(widget.id).then((result) => {
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setWidgets((current) => current.filter((item) => item.id !== widget.id));
    });
  };

  const visibleWidgets =
    scope === 'ALL'
      ? widgets
      : widgets.filter((widget) => widget.scope === scope);

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/disco-widgets">
          <div className="flex max-w-5xl flex-col gap-6">
            <StudioPageHeader
              title="Disco widgets"
              subtitle="Register, review, and manage every add-on available to listeners, artists, and admins."
              action={
                <Button
                  type="button"
                  size="icon-sm"
                  title="Register a new widget"
                  aria-label="Register a new widget"
                  onClick={openNew}
                >
                  <Plus size={18} aria-hidden />
                </Button>
              }
            />

            <FilterChips
              aria-label="Widget types"
              className="border-border border-b pb-3"
              items={[
                { id: 'ALL', label: 'All add-ons' },
                ...SCOPES.map((item) => ({ id: item.id, label: item.label })),
              ]}
              selected={scope}
              onChange={(id) => setScope(id as AdminDiscoWidgetScope | 'ALL')}
            />

            {error && !editorOpen ? (
              <p className="text-accent-red text-sm" role="alert">
                {error}
              </p>
            ) : null}
            {loading ? (
              <PageLoading label="Loading widget catalog…" />
            ) : visibleWidgets.length === 0 ? (
              <p className="text-foreground-secondary text-sm">
                No widgets registered for this type yet.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleWidgets.map((widget) => (
                  <article
                    key={widget.id}
                    className="border-border bg-background-secondary/40 flex gap-4 rounded-xl border p-4"
                  >
                    <div className="border-border bg-background flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                      {widget.iconUrl ? (
                        <img
                          src={widget.iconUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="text-foreground-secondary text-lg font-bold">
                          {widget.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{widget.name}</h2>
                        <Badge
                          variant="pill"
                          color={statusColor(widget.status)}
                        >
                          {widget.status}
                        </Badge>
                      </div>
                      <p className="text-foreground-secondary mt-1 text-xs">
                        {widget.scope} · v{widget.currentVersion} ·{' '}
                        {widget.slug}
                      </p>
                      <p className="text-foreground-secondary mt-2 text-sm">
                        {widget.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {widget.categories.map((category) => (
                          <Badge key={category} variant="pill" color="blue">
                            {category}
                          </Badge>
                        ))}
                        <span className="text-foreground-secondary text-xs">
                          by {widget.authorName}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-start gap-1">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="text"
                        title={`Edit ${widget.name}`}
                        aria-label={`Edit ${widget.name}`}
                        onClick={() => openEdit(widget)}
                      >
                        <Pencil size={16} aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="text"
                        title={`Delete ${widget.name}`}
                        aria-label={`Delete ${widget.name}`}
                        onClick={() => setPendingDelete(widget)}
                      >
                        <Trash2 size={16} aria-hidden />
                      </Button>
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
                {editingWidget
                  ? `Edit ${editingWidget.name}`
                  : 'Register a new widget'}
              </Dialog.Title>
              <Dialog.Description>
                Set the widget identity, store type, cover image, and filter
                parameters.
              </Dialog.Description>
              <WidgetEditor
                draft={draft}
                editing={editingWidget !== null}
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
                  : 'Delete widget?'
              }
              description="This removes the widget from every add-on store permanently."
              confirmLabel="Delete"
              onCancel={() => setPendingDelete(null)}
              onConfirm={() => {
                const widget = pendingDelete;
                setPendingDelete(null);
                if (widget) {
                  remove(widget);
                }
              }}
            />
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
