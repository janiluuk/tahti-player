import { CheckIcon, PlusIcon, SettingsIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Badge,
  Button,
  Dialog,
  FilterChips,
  ImageReveal,
  Input,
  Select,
  Textarea,
  Toggle,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  approveAdminAddon,
  disableAdminAddon,
  fetchAdminAddons,
  registerAdminAddon,
  rejectAdminAddon,
  setAdminAddonDefaultConfig,
  setAdminAddonEnabledByDefault,
  type AdminAddon,
  type AdminAddonRegisterInput,
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

const EMPTY_DRAFT: AdminAddonRegisterInput = {
  slug: '',
  scope: 'ARTIST',
  name: '',
  description: '',
  authorName: '',
  categories: [],
  iconUrl: '',
};

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

function RegisterDialog({
  isOpen,
  draft,
  pending,
  error,
  onChange,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  draft: AdminAddonRegisterInput;
  pending: boolean;
  error: string | null;
  onChange: (next: AdminAddonRegisterInput) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <Dialog.Title>Register a new add-on</Dialog.Title>
      <Dialog.Description>
        Creates a draft add-on. It stays invisible everywhere until a bundle
        version is published and approved (not built in this UI yet — ask an
        engineer to publish the first version).
      </Dialog.Description>
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Slug"
            value={draft.slug}
            placeholder="live-status"
            onChange={(event) =>
              onChange({ ...draft, slug: event.target.value })
            }
            description="Lowercase letters, numbers, and hyphens."
          />
          <Select
            label="Add-on type"
            value={draft.scope}
            onValueChange={(value) =>
              onChange({ ...draft, scope: value as AdminAddonScope })
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
      </div>
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
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
          <PlusIcon size={15} aria-hidden className="mr-1.5" />
          Register add-on
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}

function RejectDialog({
  addon,
  pending,
  onCancel,
  onConfirm,
}: {
  addon: AdminAddon | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: (moderationNote: string) => void;
}) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!addon) {
      setNote('');
    }
  }, [addon]);

  return (
    <Dialog.Root
      isOpen={addon !== null}
      onClose={onCancel}
      className="max-w-md"
    >
      <Dialog.Title>Reject {addon?.name}?</Dialog.Title>
      <Dialog.Description>
        A reason is required — it&apos;s shown to the author.
      </Dialog.Description>
      <Textarea
        value={note}
        rows={3}
        placeholder="Why is this add-on being rejected?"
        onChange={(event) => setNote(event.target.value)}
      />
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button
          type="button"
          disabled={pending || !note.trim()}
          onClick={() => onConfirm(note.trim())}
        >
          Reject
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}

function ManageDialog({
  addon,
  pending,
  error,
  onClose,
  onSetEnabledByDefault,
  onSetDefaultConfig,
  onDisable,
}: {
  addon: AdminAddon | null;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSetEnabledByDefault: (addon: AdminAddon, value: boolean) => void;
  onSetDefaultConfig: (addon: AdminAddon, json: string) => void;
  onDisable: (addon: AdminAddon) => void;
}) {
  const [configText, setConfigText] = useState('');
  const [configError, setConfigError] = useState<string | null>(null);
  const [confirmDisable, setConfirmDisable] = useState(false);

  useEffect(() => {
    if (addon) {
      setConfigText(
        addon.defaultConfigJson
          ? JSON.stringify(addon.defaultConfigJson, null, 2)
          : '',
      );
      setConfigError(null);
    }
  }, [addon]);

  return (
    <Dialog.Root isOpen={addon !== null} onClose={onClose} className="max-w-lg">
      <Dialog.Title>Manage {addon?.name}</Dialog.Title>
      {addon && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Enabled by default</p>
              <p className="text-foreground-secondary text-xs">
                Renders for every {addon.scope.toLowerCase()} surface with no
                explicit install.
              </p>
            </div>
            <Toggle
              checked={addon.enabledByDefault}
              disabled={pending}
              label="Enabled by default"
              onChange={(checked) => onSetEnabledByDefault(addon, checked)}
            />
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-foreground font-semibold">
              Default settings (JSON)
            </span>
            <Textarea
              value={configText}
              rows={5}
              placeholder="{}"
              onChange={(event) => {
                setConfigText(event.target.value);
                setConfigError(null);
              }}
            />
            <span className="text-foreground-secondary text-xs">
              Starting settings every new install gets. Leave empty to clear.
              Existing installs are not changed.
            </span>
          </label>
          {configError ? (
            <p className="text-accent-red text-sm" role="alert">
              {configError}
            </p>
          ) : null}
          {error ? (
            <p className="text-accent-red text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <div className="border-border flex items-center justify-between border-t pt-4">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => setConfirmDisable(true)}
            >
              Disable add-on
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={() => {
                const trimmed = configText.trim();
                if (!trimmed) {
                  onSetDefaultConfig(addon, '');
                  return;
                }
                try {
                  JSON.parse(trimmed);
                } catch {
                  setConfigError('Not valid JSON.');
                  return;
                }
                onSetDefaultConfig(addon, trimmed);
              }}
            >
              Save settings
            </Button>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={confirmDisable}
        title={addon ? `Disable "${addon.name}"?` : 'Disable add-on?'}
        description="Stops it rendering everywhere it's installed immediately. Only a fresh bundle publish brings it back."
        confirmLabel="Disable"
        onCancel={() => setConfirmDisable(false)}
        onConfirm={() => {
          setConfirmDisable(false);
          if (addon) {
            onDisable(addon);
          }
        }}
      />
    </Dialog.Root>
  );
}

export function AdminAddonsView() {
  const [addons, setAddons] = useState<AdminAddon[]>([]);
  const [scope, setScope] = useState<AdminAddonScope | 'ALL'>('ALL');
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [draft, setDraft] = useState<AdminAddonRegisterInput>(EMPTY_DRAFT);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminAddon | null>(null);
  const [manageTarget, setManageTarget] = useState<AdminAddon | null>(null);

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

  const openRegister = () => {
    setDraft(EMPTY_DRAFT);
    setError(null);
    setRegisterOpen(true);
  };

  const applyUpdate = (result: {
    ok: boolean;
    data?: AdminAddon;
    error?: string;
  }) => {
    setPending(false);
    if (!result.ok || !result.data) {
      setError(result.error ?? 'Update failed');
      return;
    }
    const updated = result.data;
    setAddons((current) =>
      current.map((addon) => (addon.id === updated.id ? updated : addon)),
    );
    setManageTarget((current) =>
      current?.id === updated.id ? updated : current,
    );
  };

  const register = () => {
    setPending(true);
    setError(null);
    void registerAdminAddon(draft).then((result) => {
      setPending(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAddons((current) => [result.data, ...current]);
      setRegisterOpen(false);
    });
  };

  const approve = (addon: AdminAddon) => {
    setPending(true);
    setError(null);
    void approveAdminAddon(addon.id).then(applyUpdate);
  };

  const reject = (addon: AdminAddon, moderationNote: string) => {
    setPending(true);
    setError(null);
    void rejectAdminAddon(addon.id, moderationNote).then((result) => {
      applyUpdate(result);
      if (result.ok) {
        setRejectTarget(null);
      }
    });
  };

  const disable = (addon: AdminAddon) => {
    setPending(true);
    setError(null);
    void disableAdminAddon(addon.id).then((result) => {
      applyUpdate(result);
      if (result.ok) {
        setManageTarget(null);
      }
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
                  onClick={openRegister}
                >
                  <PlusIcon size={18} aria-hidden />
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

              {error && !registerOpen && !rejectTarget && !manageTarget ? (
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
                          {addon.status === 'APPROVED' &&
                            addon.enabledByDefault && (
                              <Badge variant="pill" color="cyan">
                                Default on
                              </Badge>
                            )}
                        </div>
                        <p className="text-foreground-secondary mt-1 text-xs">
                          {addon.scope} · v{addon.currentVersion} · {addon.slug}
                        </p>
                        <p className="text-foreground-secondary mt-2 text-sm">
                          {addon.description}
                        </p>
                        {addon.moderationNote &&
                        (addon.status === 'REJECTED' ||
                          addon.status === 'DISABLED') ? (
                          <p className="text-accent-red mt-2 text-xs">
                            {addon.moderationNote}
                          </p>
                        ) : null}
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
                        {addon.status === 'PENDING' && (
                          <>
                            <Tooltip
                              content={`Approve ${addon.name}`}
                              side="top"
                            >
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="text"
                                aria-label={`Approve ${addon.name}`}
                                disabled={pending}
                                onClick={() => approve(addon)}
                              >
                                <CheckIcon size={16} aria-hidden />
                              </Button>
                            </Tooltip>
                            <Tooltip
                              content={`Reject ${addon.name}`}
                              side="top"
                            >
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="text"
                                aria-label={`Reject ${addon.name}`}
                                disabled={pending}
                                onClick={() => setRejectTarget(addon)}
                              >
                                <XIcon size={16} aria-hidden />
                              </Button>
                            </Tooltip>
                          </>
                        )}
                        {addon.status === 'APPROVED' && (
                          <Tooltip content={`Manage ${addon.name}`} side="top">
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="text"
                              aria-label={`Manage ${addon.name}`}
                              onClick={() => setManageTarget(addon)}
                            >
                              <SettingsIcon size={16} aria-hidden />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <RegisterDialog
                isOpen={registerOpen}
                draft={draft}
                pending={pending}
                error={error}
                onChange={setDraft}
                onClose={() => setRegisterOpen(false)}
                onSave={register}
              />

              <RejectDialog
                addon={rejectTarget}
                pending={pending}
                onCancel={() => setRejectTarget(null)}
                onConfirm={(note) => reject(rejectTarget!, note)}
              />

              <ManageDialog
                addon={manageTarget}
                pending={pending}
                error={error}
                onClose={() => setManageTarget(null)}
                onSetEnabledByDefault={(addon, value) => {
                  setPending(true);
                  setError(null);
                  void setAdminAddonEnabledByDefault(addon.id, value).then(
                    applyUpdate,
                  );
                }}
                onSetDefaultConfig={(addon, json) => {
                  setPending(true);
                  setError(null);
                  void setAdminAddonDefaultConfig(
                    addon.id,
                    json ? (JSON.parse(json) as Record<string, unknown>) : null,
                  ).then(applyUpdate);
                }}
                onDisable={disable}
              />
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
