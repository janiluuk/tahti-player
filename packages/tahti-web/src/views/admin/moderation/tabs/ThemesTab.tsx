import { CheckIcon, ExternalLinkIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  Badge,
  Button,
  ButtonAnchor,
  Dialog,
  Select,
  Textarea,
} from '@tahti-player/ui';

import {
  approveAdminTheme,
  canApproveTheme,
  fetchAdminThemes,
  rejectAdminTheme,
  themeSwatches,
  type AdminTheme,
  type AdminThemeVisibility,
} from '../../../../api/admin';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';

const FILTERS: { id: AdminThemeVisibility | ''; label: string }[] = [
  { id: 'PENDING_REVIEW', label: 'Waiting for review' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: '', label: 'All themes' },
];

const PR_LABELS: Record<AdminTheme['prStatus'], string | null> = {
  NONE: null,
  PENDING: 'Opening registry PR…',
  OPENED: 'Registry PR open',
  ERROR: 'Registry PR failed',
};

function visibilityBadge(theme: AdminTheme) {
  switch (theme.visibility) {
    case 'PENDING_REVIEW':
      return (
        <Badge variant="pill" color="yellow">
          Waiting for review
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="pill" color="red">
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="pill" color="secondary">
          Private
        </Badge>
      );
  }
}

function RejectDialog({
  theme,
  onClose,
  onRejected,
}: {
  theme: AdminTheme | null;
  onClose: () => void;
  onRejected: () => void;
}) {
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNote('');
    setError(null);
  }, [theme]);

  return (
    <Dialog.Root isOpen={theme !== null} onClose={onClose} className="max-w-lg">
      <Dialog.Title>Reject {theme?.name}</Dialog.Title>
      <Dialog.Description>
        The author gets this note with the rejection.
      </Dialog.Description>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-foreground font-semibold">
          Note to the author
        </span>
        <Textarea
          value={note}
          rows={4}
          maxLength={2000}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      {error ? (
        <p className="text-accent-red-strong mt-2 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Dialog.Actions>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={pending || !note.trim()}
          onClick={() => {
            if (!theme) {
              return;
            }
            setPending(true);
            setError(null);
            void rejectAdminTheme(theme.id, note).then((result) => {
              setPending(false);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              onRejected();
            });
          }}
        >
          {pending ? 'Rejecting…' : 'Reject theme'}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}

export function ThemesTab() {
  const [filter, setFilter] = useState<AdminThemeVisibility | ''>(
    'PENDING_REVIEW',
  );
  const [themes, setThemes] = useState<AdminTheme[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<AdminTheme | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    const result = await fetchAdminThemes(filter || undefined);
    if (!result.ok) {
      setLoadError(result.error);
      return;
    }
    setThemes(result.themes);
  }, [filter]);

  useEffect(() => {
    setThemes(null);
    void load();
  }, [load]);

  const approve = (theme: AdminTheme) => {
    setBusyId(theme.id);
    setActionError(null);
    void approveAdminTheme(theme.id).then((result) => {
      setBusyId(null);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      void load();
    });
  };

  return (
    <StudioPanel
      title="Community themes"
      description="Approving opens a pull request that adds the theme to the tahti-registry catalog; it goes live when that PR is merged."
      action={
        <Select
          label="Show"
          value={filter}
          onValueChange={(value) =>
            setFilter(value as AdminThemeVisibility | '')
          }
          options={FILTERS}
          className="min-w-44"
        />
      }
    >
      {actionError ? (
        <p className="text-accent-red-strong mb-2 text-sm" role="alert">
          {actionError}
        </p>
      ) : null}
      {loadError ? (
        <PageError
          title="Couldn't load themes"
          description={loadError}
          onRetry={() => void load()}
        />
      ) : themes === null ? (
        <PageLoading label="Loading themes…" />
      ) : themes.length === 0 ? (
        <PageEmpty
          title={
            filter === 'PENDING_REVIEW'
              ? 'No themes waiting for review'
              : 'No themes here'
          }
        />
      ) : (
        <ul className="divide-border divide-y">
          {themes.map((theme) => {
            const prLabel = PR_LABELS[theme.prStatus];
            return (
              <li
                key={theme.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className="flex shrink-0 overflow-hidden rounded border"
                    aria-hidden
                  >
                    {themeSwatches(theme).map((color, index) => (
                      <span
                        key={`${color}-${index}`}
                        className="size-5"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 font-medium">
                      {theme.name}
                      {visibilityBadge(theme)}
                      {prLabel ? (
                        <Badge
                          variant="pill"
                          color={theme.prStatus === 'ERROR' ? 'red' : 'cyan'}
                        >
                          {prLabel}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="text-foreground-secondary text-xs">
                      @{theme.authorUsername} ·{' '}
                      {new Date(theme.createdAt).toLocaleDateString()}
                      {theme.moderationNote
                        ? ` · Note: ${theme.moderationNote}`
                        : ''}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {theme.prUrl ? (
                    <ButtonAnchor
                      href={theme.prUrl}
                      target="_blank"
                      rel="noreferrer"
                      size="sm"
                      variant="text"
                    >
                      <ExternalLinkIcon
                        size={14}
                        aria-hidden
                        className="mr-1.5"
                      />
                      Pull request
                    </ButtonAnchor>
                  ) : null}
                  {theme.visibility === 'PENDING_REVIEW' ? (
                    <>
                      <Button
                        size="sm"
                        disabled={
                          !canApproveTheme(theme) || busyId === theme.id
                        }
                        onClick={() => approve(theme)}
                      >
                        <CheckIcon size={14} aria-hidden className="mr-1.5" />
                        {theme.prStatus === 'ERROR'
                          ? 'Retry approval'
                          : 'Approve'}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === theme.id}
                        onClick={() => setRejecting(theme)}
                      >
                        <XIcon size={14} aria-hidden className="mr-1.5" />
                        Reject
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <RejectDialog
        theme={rejecting}
        onClose={() => setRejecting(null)}
        onRejected={() => {
          setRejecting(null);
          void load();
        }}
      />
    </StudioPanel>
  );
}
