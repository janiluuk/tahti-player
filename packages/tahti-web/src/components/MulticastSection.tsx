import {
  Cast,
  Facebook,
  Instagram,
  Music2Icon,
  PlusIcon,
  RadioTowerIcon,
  Twitch,
  Youtube,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, Dialog, Input, SaveButton, Tooltip } from '@tahti-player/ui';

import {
  createRtmpTarget,
  deleteRtmpTarget,
  fetchRtmpTargets,
  patchRtmpTarget,
  testRtmpTarget,
  type RtmpTarget,
} from '../api/broadcast';
import {
  multicastProviders,
  type MulticastProviderId,
} from '../plugins/multicast';

const PROVIDER_ICON: Record<MulticastProviderId, LucideIcon> = {
  YOUTUBE: Youtube,
  TWITCH: Twitch,
  FACEBOOK: Facebook,
  INSTAGRAM: Instagram,
  TIKTOK: Music2Icon,
  MIXCLOUD_LIVE: RadioTowerIcon,
  KICK: Cast,
  CUSTOM: Cast,
};

/** Each service's own brand color, applied to its icon tile regardless of
 * theme — a fixed identity mark, not something a theme should recolor. */
const PROVIDER_COLOR: Record<MulticastProviderId, { bg: string; fg: string }> =
  {
    YOUTUBE: { bg: '#FF0000', fg: '#FFFFFF' },
    TWITCH: { bg: '#9146FF', fg: '#FFFFFF' },
    FACEBOOK: { bg: '#1877F2', fg: '#FFFFFF' },
    INSTAGRAM: { bg: '#C13584', fg: '#FFFFFF' },
    TIKTOK: { bg: '#000000', fg: '#FFFFFF' },
    MIXCLOUD_LIVE: { bg: '#52D869', fg: '#0B1220' },
    KICK: { bg: '#53FC18', fg: '#0B1220' },
    CUSTOM: { bg: '#475569', fg: '#FFFFFF' },
  };

function ProviderTile({
  providerId,
  size,
  dimmed = false,
}: {
  providerId: MulticastProviderId;
  size: number;
  dimmed?: boolean;
}) {
  const Icon = PROVIDER_ICON[providerId];
  const color = PROVIDER_COLOR[providerId];
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-md"
      style={{
        background: color.bg,
        color: color.fg,
        opacity: dimmed ? 0.5 : 1,
      }}
    >
      <Icon size={size} aria-hidden />
    </div>
  );
}

type EditingState = {
  providerId: MulticastProviderId | null;
  target: RtmpTarget | null;
};

function DestinationDialog({
  state,
  existingTargets,
  onClose,
  onSaved,
  onDeleted,
}: {
  state: EditingState;
  existingTargets: RtmpTarget[];
  onClose: () => void;
  onSaved: (target: RtmpTarget) => void;
  onDeleted: () => void;
}) {
  const provider = multicastProviders.find((p) => p.id === state.providerId);
  const [providerId, setProviderId] = useState(state.providerId);
  const selectedProvider = multicastProviders.find((p) => p.id === providerId);
  const isCustom = providerId === 'CUSTOM';
  const [label, setLabel] = useState(
    state.target?.label ?? provider?.label ?? '',
  );
  const [streamKey, setStreamKey] = useState('');
  const [rtmpUrl, setRtmpUrl] = useState(state.target?.rtmpUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<
    | { ok: true; reachable: boolean; error?: string }
    | { ok: false; error: string }
    | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [savedTarget, setSavedTarget] = useState(state.target);

  const save = () => {
    setSaving(true);
    setError(null);
    if (savedTarget) {
      void patchRtmpTarget(savedTarget.id, {
        label: label.trim() || undefined,
        ...(streamKey.trim() ? { streamKey: streamKey.trim() } : {}),
      }).then((result) => {
        setSaving(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        const updated = {
          ...savedTarget,
          label: label.trim() || savedTarget.label,
        };
        setSavedTarget(updated);
        setStreamKey('');
        onSaved(updated);
      });
      return;
    }
    if (!providerId) {
      setSaving(false);
      return;
    }
    void createRtmpTarget({
      provider: providerId,
      label: label.trim(),
      streamKey: streamKey.trim(),
      rtmpUrl: isCustom ? rtmpUrl.trim() : undefined,
    }).then((result) => {
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedTarget(result.target);
      setStreamKey('');
      onSaved(result.target);
    });
  };

  const runTest = () => {
    if (!savedTarget) {
      return;
    }
    setTesting(true);
    setTestResult(null);
    void testRtmpTarget(savedTarget.id).then((result) => {
      setTesting(false);
      setTestResult(result);
    });
  };

  return (
    <Dialog.Root
      isOpen
      onClose={onClose}
      className={providerId ? 'max-w-lg' : 'max-w-4xl'}
    >
      <Dialog.Title>
        {savedTarget
          ? `Configure ${provider?.label}`
          : providerId
            ? `Add ${selectedProvider?.label}`
            : 'Add multicast source'}
      </Dialog.Title>
      <Dialog.Description>
        {!providerId
          ? 'Choose a destination to configure.'
          : isCustom
            ? 'Paste the RTMP address and stream key for this destination.'
            : `Paste the stream key from your ${selectedProvider?.label} dashboard.`}
      </Dialog.Description>
      <div className="mt-4 flex flex-col gap-3">
        {!providerId ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {multicastProviders
              .filter(
                (option) =>
                  !existingTargets.some(
                    (target) => target.provider === option.id && target.enabled,
                  ),
              )
              .map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setProviderId(option.id);
                    setLabel(option.label);
                  }}
                  className="border-border bg-background-secondary hover:border-primary flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-colors"
                >
                  <div className="size-9 shrink-0">
                    <ProviderTile providerId={option.id} size={16} />
                  </div>
                  <span className="text-foreground truncate text-xs font-medium">
                    {option.label}
                  </span>
                </button>
              ))}
          </div>
        ) : (
          <>
            {!savedTarget && (
              <Button
                size="sm"
                variant="text"
                className="self-start"
                onClick={() => setProviderId(null)}
              >
                ← Choose another source
              </Button>
            )}
            {error && (
              <p className="text-accent-red text-sm" role="alert">
                {error}
              </p>
            )}
            <Input
              label="Label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder={selectedProvider?.label}
            />
            <Input
              label={savedTarget ? 'New stream key' : 'Stream key'}
              type="password"
              autoComplete="off"
              value={streamKey}
              onChange={(event) => setStreamKey(event.target.value)}
              placeholder={
                savedTarget
                  ? `Leave blank to keep the current key (···${savedTarget.keyLast4 ?? '····'})`
                  : undefined
              }
            />
            {isCustom && (
              <Input
                label="RTMP address"
                value={rtmpUrl}
                onChange={(event) => setRtmpUrl(event.target.value)}
                placeholder="rtmp://example.com/live"
                disabled={Boolean(savedTarget)}
              />
            )}
            {savedTarget && (
              <div className="border-border flex flex-wrap items-center gap-2 rounded-md border p-3">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={testing}
                  onClick={runTest}
                >
                  {testing ? 'Testing…' : 'Test connection'}
                </Button>
                <Button
                  size="sm"
                  variant={savedTarget.enabled ? 'secondary' : undefined}
                  onClick={() => {
                    void patchRtmpTarget(savedTarget.id, {
                      enabled: !savedTarget.enabled,
                    }).then((result) => {
                      if (!result.ok) {
                        setError(result.error);
                        return;
                      }
                      const updated = {
                        ...savedTarget,
                        enabled: !savedTarget.enabled,
                      };
                      setSavedTarget(updated);
                      onSaved(updated);
                    });
                  }}
                >
                  {savedTarget.enabled ? 'Disable' : 'Enable'}
                </Button>
                {testResult && (
                  <p
                    className={
                      testResult.ok && testResult.reachable
                        ? 'text-accent-green w-full text-xs'
                        : 'text-accent-red w-full text-xs'
                    }
                    role="status"
                  >
                    {testResult.ok
                      ? testResult.reachable
                        ? 'Reachable — the destination is accepting connections.'
                        : (testResult.error ??
                          'Could not reach the destination.')
                      : testResult.error}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <Dialog.Actions>
        <Dialog.Close>Close</Dialog.Close>
        {providerId && savedTarget && (
          <Button
            intent="danger"
            variant="secondary"
            disabled={deleting}
            onClick={() => {
              setDeleting(true);
              void deleteRtmpTarget(savedTarget.id).then((result) => {
                setDeleting(false);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                onDeleted();
              });
            }}
          >
            {deleting ? 'Removing…' : 'Remove'}
          </Button>
        )}
        {providerId &&
          (savedTarget ? (
            <SaveButton
              disabled={saving || !label.trim()}
              saving={saving}
              label="Save changes"
              onClick={save}
            />
          ) : (
            <Button
              disabled={saving || !label.trim() || !streamKey.trim()}
              onClick={save}
            >
              {saving ? 'Saving…' : 'Add destination'}
            </Button>
          ))}
      </Dialog.Actions>
    </Dialog.Root>
  );
}

function DestinationsGrid() {
  const [targets, setTargets] = useState<RtmpTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingState | null>(null);

  const reload = () => {
    void fetchRtmpTargets().then((r) => {
      setTargets(r.data);
      setLoading(false);
    });
  };

  useEffect(reload, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-foreground-secondary text-sm">
          Configure the destinations that should receive your live broadcast.
        </p>
        <Tooltip content="Add multicast source" side="top">
          <Button
            size="icon-sm"
            aria-label="Add multicast source"
            onClick={() => setEditing({ providerId: null, target: null })}
          >
            <PlusIcon size={17} aria-hidden />
          </Button>
        </Tooltip>
      </div>
      {loading ? (
        <p className="text-foreground-secondary text-sm">
          Loading destinations…
        </p>
      ) : (
        <div className="border-border rounded-xl border p-3">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
            {multicastProviders.map((provider) => {
              const target = targets.find(
                (candidate) => candidate.provider === provider.id,
              );
              const active = target?.enabled ?? false;
              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() =>
                    setEditing({
                      providerId: provider.id,
                      target: target ?? null,
                    })
                  }
                  title={
                    target
                      ? `${target.label || provider.label} · ${active ? 'enabled' : 'disabled'}`
                      : `${provider.label} · not configured`
                  }
                  className={`border-border hover:border-primary/60 relative flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-colors ${
                    !target
                      ? 'border-dashed opacity-70'
                      : !active
                        ? 'opacity-70'
                        : ''
                  }`}
                >
                  <div className="relative size-9 shrink-0">
                    <ProviderTile
                      providerId={provider.id}
                      size={16}
                      dimmed={Boolean(target) && !active}
                    />
                    {target ? (
                      <span
                        className={`border-background absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 ${
                          active ? 'bg-accent-green' : 'bg-foreground-secondary'
                        }`}
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  <span className="text-foreground w-full truncate text-[11px] font-medium">
                    {provider.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {editing && (
        <DestinationDialog
          state={editing}
          existingTargets={targets}
          onClose={() => setEditing(null)}
          onSaved={reload}
          onDeleted={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

/** Manage → Multicast: destinations as thumbnails (Sources-style) plus the
 * shared stream-overlay editor, replacing the old always-visible
 * add-destination form + plain provider list. */
export function MulticastSection() {
  return <DestinationsGrid />;
}
