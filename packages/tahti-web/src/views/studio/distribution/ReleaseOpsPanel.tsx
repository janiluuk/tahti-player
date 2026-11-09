import { Link } from '@tanstack/react-router';
import {
  BookOpenIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  DownloadIcon,
  LinkIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  ExternalLink,
  InlineError,
  Input,
  MediaArtwork,
  SaveButton,
  SelectableTiles,
  Tabs,
} from '@tahti-player/ui';

import {
  fetchReleaseCatalog,
  fetchReleaseExportJson,
  fetchReleaseRoyalties,
  fetchRevelatorBilling,
  parseCredits,
  patchReleaseCatalog,
  payAndSubmitToRevelator,
} from '../../../api/distribution';
import type {
  ReleaseCatalog,
  ReleaseChecklistItem,
  ReleaseCredit,
  RevelatorBillingStatus,
  RevelatorRoyaltyReportRow,
  StudioRelease,
} from '../../../api/studio-types';
import { PageError, PageLoading } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import {
  releaseStateLabel,
  releaseTypeLabel,
} from '../../../lib/releaseLabels';
import { assignStripeRedirectUrl } from '../../../lib/stripeRedirect';
import { CreditsEditor } from './CreditsEditor';
import { DeliveryTab } from './DeliveryTab';
import {
  catalogMethodTiles,
  DISCOGS_SUBMIT_URL,
  MUSICBRAINZ_SUBMIT_URL,
} from './distribution-content';
import {
  catalogToForm,
  revelatorStatusLabel,
  statusColor,
  type CatalogForm,
} from './distribution-helpers';
import { GuidesTab } from './GuidesTab';

export function ReleaseOpsPanel({ release }: { release: StudioRelease }) {
  const { t } = useTranslation('web');
  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState<ReleaseCatalog | null>(null);
  const [form, setForm] = useState<CatalogForm | null>(null);
  const [credits, setCredits] = useState<ReleaseCredit[]>([]);
  const [checklist, setChecklist] = useState<ReleaseChecklistItem[]>([]);
  const [billing, setBilling] = useState<RevelatorBillingStatus | null>(null);
  const [royalties, setRoyalties] = useState<RevelatorRoyaltyReportRow[]>([]);
  const [royaltiesLoaded, setRoyaltiesLoaded] = useState(false);
  const [royaltiesError, setRoyaltiesError] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [activeMethods, setActiveMethods] = useState<Set<string>>(
    new Set(['upc', 'musicbrainz', 'discogs', 'rights']),
  );
  const methodsInitialised = useRef(false);

  const revelatorStatus =
    catalog?.revelatorStatus ?? release.revelatorStatus ?? null;
  const revelatorId = catalog?.revelatorId ?? release.revelatorId ?? null;
  const canSubmit = !revelatorStatus || revelatorStatus === 'failed';
  const showRoyalties =
    revelatorStatus === 'submitted' ||
    revelatorStatus === 'delivered' ||
    revelatorStatus === 'pending';

  const loadOps = () => {
    setLoading(true);
    Promise.all([
      fetchReleaseCatalog(release.id),
      fetchRevelatorBilling(release.id),
    ])
      .then(([c, b]) => {
        setCatalogError(
          c.meta.source === 'api' ? (c.meta.reason ?? null) : null,
        );
        setBillingError(
          b.meta.source === 'api' ? (b.meta.reason ?? null) : null,
        );
        if (c.data) {
          setCatalog(c.data);
          setForm(catalogToForm(c.data));
          setCredits(parseCredits(c.data.credits));
          setChecklist(c.data.checklist);
          // Derive the active tiles only on the first load; later reloads
          // (after a save or submit) must not discard the user's toggles.
          if (!methodsInitialised.current) {
            methodsInitialised.current = true;
            setActiveMethods(
              new Set([
                ...(c.data.upc ? ['upc'] : []),
                ...(c.data.musicbrainzReleaseId || c.data.musicbrainzArtistId
                  ? ['musicbrainz']
                  : []),
                ...(c.data.discogsReleaseId ? ['discogs'] : []),
                ...(c.data.pLine || c.data.cLine || c.data.labelImprint
                  ? ['rights']
                  : []),
              ]),
            );
          }
        }
        setBilling(b.data);
      })
      .catch(() => {
        setCatalogError('Could not load the distribution details.');
        toast.error(i18n.t('web:toasts.couldNotLoadDistributionDetails'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    loadOps();
  }, [open, release.id]);

  useEffect(() => {
    if (!open || !showRoyalties || royaltiesLoaded) {
      return;
    }
    void fetchReleaseRoyalties(release.id).then((r) => {
      setRoyalties(r.data);
      setRoyaltiesError(
        r.meta.source === 'api' ? (r.meta.reason ?? null) : null,
      );
      setRoyaltiesLoaded(true);
    });
  }, [open, showRoyalties, royaltiesLoaded, release.id]);

  const doneCount = checklist.filter((c) => c.done).length;

  const saveCatalog = () => {
    if (!form) {
      return;
    }
    setBusy(true);
    const trimmedCredits = credits
      .map((c) => {
        const handle = c.artistUsername?.trim().replace(/^@/, '').toLowerCase();
        return {
          role: c.role,
          name: c.name.trim(),
          ...(handle && /^[a-z0-9_-]{2,32}$/.test(handle)
            ? { artistUsername: handle }
            : {}),
        };
      })
      .filter((c) => c.name.length > 0);

    void patchReleaseCatalog(release.id, {
      upc: form.upc.trim() || null,
      musicbrainzReleaseId: form.musicbrainzReleaseId.trim() || null,
      musicbrainzArtistId: form.musicbrainzArtistId.trim() || null,
      discogsReleaseId: form.discogsReleaseId.trim() || null,
      pLine: form.pLine.trim() || null,
      cLine: form.cLine.trim() || null,
      labelImprint: form.labelImprint.trim() || null,
      credits: trimmedCredits,
    })
      .then((r) => {
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        setCatalog(r.data);
        setForm(catalogToForm(r.data));
        setCredits(parseCredits(r.data.credits));
        setChecklist(r.data.checklist);
        toast.success(i18n.t('web:toasts.catalogSaved'));
      })
      .catch(() => toast.error(i18n.t('web:toasts.couldNotSaveCatalog')))
      .finally(() => setBusy(false));
  };

  const submitToRevelator = async () => {
    setBusy(true);
    try {
      const r = await payAndSubmitToRevelator(release.id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      if ('checkoutUrl' in r) {
        if (!assignStripeRedirectUrl(r.checkoutUrl)) {
          toast.error(i18n.t('web:toasts.checkoutNotStripe'));
        }
        return;
      }
      toast.success(
        'Queued for distribution. We notify you once it is sent, or if it fails.',
      );
      setCatalog((prev) =>
        prev ? { ...prev, revelatorStatus: r.data.revelatorStatus } : prev,
      );
      setBilling((prev) => (prev ? { ...prev, paid: true } : prev));
      loadOps();
    } catch {
      toast.error(i18n.t('web:toasts.couldNotSubmitRevelator'));
    } finally {
      setBusy(false);
    }
  };

  const runExport = async (
    mode: 'download' | 'musicbrainz' | 'discogs',
  ): Promise<void> => {
    setBusy(true);
    let res: Awaited<ReturnType<typeof fetchReleaseExportJson>>;
    try {
      res = await fetchReleaseExportJson(release.id);
    } catch {
      toast.error(i18n.t('web:toasts.couldNotExportRelease'));
      return;
    } finally {
      setBusy(false);
    }
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    if (mode === 'download') {
      const blob = new Blob([res.json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `release-${release.smartLinkSlug}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(i18n.t('web:toasts.exportedJson'));
      return;
    }
    try {
      const pack = JSON.parse(res.json) as {
        musicbrainzPrefill?: string;
        discogsPrefill?: string;
      };
      const text =
        mode === 'musicbrainz' ? pack.musicbrainzPrefill : pack.discogsPrefill;
      if (!text) {
        toast.error(i18n.t('web:toasts.exportMissingPrefill', { mode }));
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success(
        mode === 'musicbrainz'
          ? 'MusicBrainz prefill copied.'
          : 'Discogs prefill copied.',
      );
    } catch {
      toast.error(i18n.t('web:toasts.couldNotReadExportPack'));
    }
  };

  const catalogTab = (
    <div className="flex flex-col gap-4">
      {catalogError ? (
        <PageError
          title={t('loadErrors.couldNotLoadTheCatalog')}
          description={catalogError}
          onRetry={loadOps}
        />
      ) : null}
      <ul className="flex flex-col gap-1 text-xs">
        {checklist.map((step) => (
          <li key={step.id}>
            <span className="mr-1.5">{step.done ? '✓' : '○'}</span>
            <strong>{step.label}</strong>
            {step.hint && (
              <span className="text-foreground-secondary"> — {step.hint}</span>
            )}
          </li>
        ))}
      </ul>

      <div>
        <p className="mb-2 text-xs font-medium" aria-hidden>
          {t('releaseOps.catalogMethods')}
        </p>
        <SelectableTiles
          aria-label={t('releaseOps.catalogMethods')}
          multiple
          items={catalogMethodTiles(t)}
          selected={[...activeMethods]}
          onChange={(ids) => setActiveMethods(new Set(ids))}
          className="text-xs sm:grid-cols-2 lg:grid-cols-4"
        />
        {activeMethods.size === 0 ? (
          <InlineError announce={false} textSize="xs" className="mt-2">
            {t('releaseOps.selectAtLeastOneCatalog')}
          </InlineError>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {activeMethods.has('upc') && (
          <Input
            inputMode="numeric"
            spellCheck={false}
            label={t('releaseOps.upcEan')}
            value={form?.upc ?? ''}
            disabled={busy}
            onChange={(e) =>
              setForm((previous) =>
                previous ? { ...previous, upc: e.target.value } : previous,
              )
            }
          />
        )}
        {activeMethods.has('musicbrainz') && (
          <>
            <Input
              label={t('releaseOps.musicbrainzReleaseMbid')}
              value={form?.musicbrainzReleaseId ?? ''}
              disabled={busy}
              onChange={(e) =>
                setForm((previous) =>
                  previous
                    ? { ...previous, musicbrainzReleaseId: e.target.value }
                    : previous,
                )
              }
            />
            <Input
              label={t('releaseOps.musicbrainzArtistMbid')}
              value={form?.musicbrainzArtistId ?? ''}
              disabled={busy}
              onChange={(e) =>
                setForm((previous) =>
                  previous
                    ? { ...previous, musicbrainzArtistId: e.target.value }
                    : previous,
                )
              }
            />
          </>
        )}
        {activeMethods.has('discogs') && (
          <Input
            inputMode="numeric"
            spellCheck={false}
            label={t('releaseOps.discogsReleaseId')}
            value={form?.discogsReleaseId ?? ''}
            disabled={busy}
            onChange={(e) =>
              setForm((previous) =>
                previous
                  ? { ...previous, discogsReleaseId: e.target.value }
                  : previous,
              )
            }
          />
        )}
        {activeMethods.has('rights') && (
          <>
            {(['pLine', 'cLine', 'labelImprint'] as const).map((key) => (
              <Input
                key={key}
                label={
                  key === 'pLine'
                    ? 'P-line'
                    : key === 'cLine'
                      ? 'C-line'
                      : 'Label imprint'
                }
                value={form?.[key] ?? ''}
                disabled={busy}
                onChange={(e) =>
                  setForm((previous) =>
                    previous
                      ? { ...previous, [key]: e.target.value }
                      : previous,
                  )
                }
              />
            ))}
          </>
        )}
      </div>

      <CreditsEditor credits={credits} setCredits={setCredits} busy={busy} />

      <div className="flex flex-wrap gap-2">
        <SaveButton
          saving={busy}
          disabled={activeMethods.size === 0}
          label={t('releaseOps.saveCatalog')}
          onClick={saveCatalog}
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => void runExport('download')}
        >
          <DownloadIcon size={14} aria-hidden className="mr-1.5" />
          {t('releaseOps.exportJson')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => void runExport('musicbrainz')}
        >
          <CopyIcon size={14} aria-hidden className="mr-1.5" />
          {t('releaseOps.copyMusicbrainzPrefill')}
        </Button>
        <ExternalLink
          href={MUSICBRAINZ_SUBMIT_URL}
          showIcon
          className="text-foreground-secondary text-xs"
        >
          {t('releaseOps.addOnMusicbrainz')}
        </ExternalLink>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => void runExport('discogs')}
        >
          <CopyIcon size={14} aria-hidden className="mr-1.5" />
          {t('releaseOps.copyDiscogsPrefill')}
        </Button>
        <ExternalLink
          href={DISCOGS_SUBMIT_URL}
          showIcon
          className="text-foreground-secondary text-xs"
        >
          {t('releaseOps.searchOnDiscogs')}
        </ExternalLink>
      </div>
    </div>
  );

  const deliveryTab = (
    <div className="flex flex-col gap-3">
      {billingError ? (
        <PageError
          title={t('loadErrors.couldNotLoadBilling')}
          description={billingError}
          onRetry={loadOps}
        />
      ) : null}
      <DeliveryTab
        revelatorStatus={revelatorStatus}
        revelatorId={revelatorId}
        billing={billing}
        busy={busy}
        canSubmit={canSubmit}
        confirmSubmit={confirmSubmit}
        setConfirmSubmit={setConfirmSubmit}
        onSubmit={() => void submitToRevelator()}
        showRoyalties={showRoyalties}
        royaltiesLoaded={royaltiesLoaded}
        royalties={royalties}
        royaltiesError={royaltiesError}
        onRetryRoyalties={() => setRoyaltiesLoaded(false)}
      />
    </div>
  );

  const guidesTab = <GuidesTab />;

  return (
    <StudioPanel className="text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <MediaArtwork
            src={release.artworkUrl}
            alt=""
            seed={release.id}
            size="thumb"
            className="size-12 shrink-0 rounded"
          />
          <div className="min-w-0">
            <p className="font-medium">{release.title}</p>
            <p className="text-foreground-secondary text-xs">
              {releaseTypeLabel(release.type, t)} ·{' '}
              {releaseStateLabel(release.state, t)} ·{' '}
              {t('studioReleases.tracksCount', {
                count: release._count?.tracks ?? release.tracks?.length ?? 0,
              })}
              {release.upc ? ` · UPC ${release.upc}` : ''}
              {' · '}
              <Link
                to="/r/$slug"
                params={{ slug: release.smartLinkSlug }}
                className="underline"
              >
                /r/{release.smartLinkSlug}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="pill" color={statusColor(revelatorStatus)}>
            {revelatorStatusLabel(revelatorStatus, t)}
          </Badge>
          <Button
            size="sm"
            variant="secondary"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {checklist.length > 0
              ? t('releaseOpsPanel.releaseOpsProgress', {
                  done: doneCount,
                  total: checklist.length,
                })
              : t('releaseOpsPanel.releaseOps')}
            {open ? (
              <ChevronUpIcon size={14} aria-hidden className="ml-1" />
            ) : (
              <ChevronDownIcon size={14} aria-hidden className="ml-1" />
            )}
          </Button>
        </div>
      </div>

      {open &&
        (loading ? (
          <PageLoading label={t('loading.loading')} />
        ) : !form ? (
          catalogError ? (
            <PageError
              title={t('loadErrors.couldNotLoadTheCatalog')}
              description={catalogError}
              onRetry={loadOps}
            />
          ) : (
            <PageLoading label={t('loading.loading')} />
          )
        ) : (
          <Tabs
            className="mt-4"
            listClassName="border-border border-b pb-2"
            panelClassName="pt-4"
            items={[
              {
                id: 'catalog',
                label: t('releaseOpsPanel.catalogCredits'),
                icon: <BookOpenIcon size={14} />,
                content: catalogTab,
              },
              {
                id: 'delivery',
                label: t('releaseOpsPanel.deliveryRoyalties'),
                icon: <LinkIcon size={14} />,
                content: deliveryTab,
              },
              {
                id: 'guides',
                label: t('releaseOpsPanel.guides'),
                icon: <BookOpenIcon size={14} />,
                content: guidesTab,
              },
            ]}
          />
        ))}
    </StudioPanel>
  );
}
