import { CheckIcon, ExternalLinkIcon, PaletteIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  ButtonAnchor,
  Dialog,
  InlineError,
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
import { ListingDate } from '../../../../components/ListingDate';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';
import { useSettingsModalStore } from '../../../../stores/settingsModalStore';

function visibilityBadge(
  theme: AdminTheme,
  labels: { pending: string; rejected: string; privateLabel: string },
) {
  switch (theme.visibility) {
    case 'PENDING_REVIEW':
      return (
        <Badge variant="pill" color="yellow">
          {labels.pending}
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="pill" color="red">
          {labels.rejected}
        </Badge>
      );
    default:
      return (
        <Badge variant="pill" color="secondary">
          {labels.privateLabel}
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
  const { t } = useTranslation('web');
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNote('');
    setError(null);
  }, [theme]);

  return (
    <Dialog.Root isOpen={theme !== null} onClose={onClose} className="max-w-lg">
      <Dialog.Title>
        {t('adminThemes.rejectTitle', { name: theme?.name ?? '' })}
      </Dialog.Title>
      <Dialog.Description>
        {t('adminThemes.rejectDescription')}
      </Dialog.Description>
      <form
        className="contents"
        onSubmit={(event) => {
          event.preventDefault();
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
        <Textarea
          submitOnModEnter
          label={t('adminThemes.rejectNote')}
          value={note}
          rows={4}
          maxLength={2000}
          onChange={(event) => setNote(event.target.value)}
        />
        {error ? <InlineError className="mt-2">{error}</InlineError> : null}
        <Dialog.Actions>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('actions.cancel')}
          </Button>
          <Button disabled={pending || !note.trim()} type="submit">
            {pending
              ? t('adminThemes.rejecting')
              : t('adminThemes.rejectConfirm')}
          </Button>
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
}

export function ThemesTab() {
  const { t } = useTranslation('web');
  const openSettings = useSettingsModalStore((state) => state.open);
  const [filter, setFilter] = useState<AdminThemeVisibility | ''>(
    'PENDING_REVIEW',
  );
  const [themes, setThemes] = useState<AdminTheme[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<AdminTheme | null>(null);

  const filters: { id: AdminThemeVisibility | ''; label: string }[] = [
    { id: 'PENDING_REVIEW', label: t('adminThemes.filterPending') },
    { id: 'REJECTED', label: t('adminThemes.filterRejected') },
    { id: '', label: t('adminThemes.filterAll') },
  ];

  const prLabels: Record<AdminTheme['prStatus'], string | null> = {
    NONE: null,
    PENDING: t('adminThemes.prPending'),
    OPENED: t('adminThemes.prOpened'),
    ERROR: t('adminThemes.prError'),
  };

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
      title={t('adminThemes.title')}
      description={t('adminThemes.description')}
      action={
        <Select
          label={t('adminThemes.show')}
          value={filter}
          onValueChange={(value) =>
            setFilter(value as AdminThemeVisibility | '')
          }
          options={filters}
          className="min-w-44"
        />
      }
    >
      {actionError ? (
        <InlineError className="mb-2">{actionError}</InlineError>
      ) : null}
      {loadError ? (
        <PageError
          title={t('adminThemes.loadError')}
          description={loadError}
          onRetry={() => void load()}
        />
      ) : themes === null ? (
        <PageLoading label={t('adminThemes.loading')} />
      ) : themes.length === 0 ? (
        <PageEmpty
          title={
            filter === 'PENDING_REVIEW'
              ? t('adminThemes.emptyPending')
              : t('adminThemes.empty')
          }
          action={
            filter === '' ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openSettings('themes')}
              >
                <PaletteIcon size={16} aria-hidden />
                {t('emptyActions.submitTheme')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="divide-border divide-y">
          {themes.map((theme) => {
            const prLabel = prLabels[theme.prStatus];
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
                      {visibilityBadge(theme, {
                        pending: t('adminThemes.badgePending'),
                        rejected: t('adminThemes.badgeRejected'),
                        privateLabel: t('adminThemes.badgePrivate'),
                      })}
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
                      <ListingDate value={theme.createdAt} />
                      {theme.moderationNote
                        ? ` · ${t('adminThemes.note', { note: theme.moderationNote })}`
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
                      {t('adminThemes.pullRequest')}
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
                          ? t('adminThemes.retryApproval')
                          : t('adminThemes.approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === theme.id}
                        onClick={() => setRejecting(theme)}
                      >
                        <XIcon size={14} aria-hidden className="mr-1.5" />
                        {t('adminThemes.reject')}
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
