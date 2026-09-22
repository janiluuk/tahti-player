import { Link } from '@tanstack/react-router';
import { BookOpenIcon, CopyIcon, DownloadIcon, LinkIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  ExternalLink,
  Input,
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
import { PageLoading } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { CreditsEditor } from './CreditsEditor';
import { DeliveryTab } from './DeliveryTab';
import {
  CATALOG_METHOD_TILES,
  DISCOGS_SUBMIT_URL,
  MUSICBRAINZ_SUBMIT_URL,
} from './distribution-content';
import {
  catalogToForm,
  statusColor,
  type CatalogForm,
} from './distribution-helpers';
import { GuidesTab } from './GuidesTab';

export function ReleaseOpsPanel({ release }: { release: StudioRelease }) {
  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState<ReleaseCatalog | null>(null);
  const [form, setForm] = useState<CatalogForm | null>(null);
  const [credits, setCredits] = useState<ReleaseCredit[]>([]);
  const [checklist, setChecklist] = useState<ReleaseChecklistItem[]>([]);
  const [billing, setBilling] = useState<RevelatorBillingStatus | null>(null);
  const [royalties, setRoyalties] = useState<RevelatorRoyaltyReportRow[]>([]);
  const [royaltiesLoaded, setRoyaltiesLoaded] = useState(false);
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
      .catch(() => toast.error('Could not load the distribution details.'))
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
        toast.success('Catalog saved.');
      })
      .catch(() => toast.error('Could not save the catalog.'))
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
        window.location.href = r.checkoutUrl;
        return;
      }
      toast.success('Submitted to Revelator.');
      setCatalog((prev) =>
        prev ? { ...prev, revelatorStatus: r.data.revelatorStatus } : prev,
      );
      setBilling((prev) => (prev ? { ...prev, paid: true } : prev));
      loadOps();
    } catch {
      toast.error('Could not submit to Revelator.');
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
      toast.error('Could not export the release.');
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
      toast.success('Exported JSON.');
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
        toast.error(`Export missing ${mode} prefill`);
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success(
        mode === 'musicbrainz'
          ? 'MusicBrainz prefill copied.'
          : 'Discogs prefill copied.',
      );
    } catch {
      toast.error('Could not read export pack');
    }
  };

  const catalogTab = (
    <div className="flex flex-col gap-4">
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
        <p className="mb-2 text-xs font-medium">Catalog methods</p>
        <SelectableTiles
          multiple
          items={CATALOG_METHOD_TILES}
          selected={[...activeMethods]}
          onChange={(ids) => setActiveMethods(new Set(ids))}
          className="text-xs sm:grid-cols-2 lg:grid-cols-4"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {activeMethods.has('upc') && (
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-foreground-secondary">UPC / EAN</span>
            <Input
              value={form?.upc ?? ''}
              disabled={busy}
              onChange={(e) =>
                setForm((previous) =>
                  previous ? { ...previous, upc: e.target.value } : previous,
                )
              }
            />
          </label>
        )}
        {activeMethods.has('musicbrainz') && (
          <>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-foreground-secondary">
                MusicBrainz release MBID
              </span>
              <Input
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
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-foreground-secondary">
                MusicBrainz artist MBID
              </span>
              <Input
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
            </label>
          </>
        )}
        {activeMethods.has('discogs') && (
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-foreground-secondary">
              Discogs release ID
            </span>
            <Input
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
          </label>
        )}
        {activeMethods.has('rights') && (
          <>
            {(['pLine', 'cLine', 'labelImprint'] as const).map((key) => (
              <label key={key} className="flex flex-col gap-1 text-xs">
                <span className="text-foreground-secondary">
                  {key === 'pLine'
                    ? 'P-line'
                    : key === 'cLine'
                      ? 'C-line'
                      : 'Label imprint'}
                </span>
                <Input
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
              </label>
            ))}
          </>
        )}
      </div>

      <CreditsEditor credits={credits} setCredits={setCredits} busy={busy} />

      <div className="flex flex-wrap gap-2">
        <SaveButton saving={busy} label="Save catalog" onClick={saveCatalog} />
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => void runExport('download')}
        >
          <DownloadIcon size={14} aria-hidden className="mr-1.5" />
          Export JSON
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => void runExport('musicbrainz')}
        >
          <CopyIcon size={14} aria-hidden className="mr-1.5" />
          Copy MusicBrainz prefill
        </Button>
        <ExternalLink
          href={MUSICBRAINZ_SUBMIT_URL}
          showIcon
          className="text-foreground-secondary text-xs"
        >
          Add on MusicBrainz
        </ExternalLink>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => void runExport('discogs')}
        >
          <CopyIcon size={14} aria-hidden className="mr-1.5" />
          Copy Discogs prefill
        </Button>
        <ExternalLink
          href={DISCOGS_SUBMIT_URL}
          showIcon
          className="text-foreground-secondary text-xs"
        >
          Search on Discogs
        </ExternalLink>
      </div>
    </div>
  );

  const deliveryTab = (
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
    />
  );

  const guidesTab = <GuidesTab />;

  return (
    <StudioPanel className="text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{release.title}</p>
          <p className="text-foreground-secondary text-xs">
            {release.type} · {release.state} ·{' '}
            {release._count?.tracks ?? release.tracks?.length ?? 0} tracks
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
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="pill" color={statusColor(revelatorStatus)}>
            {revelatorStatus ?? 'not submitted'}
          </Badge>
          <Button size="sm" variant="secondary" onClick={() => setOpen(!open)}>
            {open ? 'Hide' : 'Release ops'} ({doneCount || '—'}/
            {checklist.length || 5})
          </Button>
        </div>
      </div>

      {open &&
        (loading || !form ? (
          <PageLoading label="Loading…" />
        ) : (
          <Tabs
            className="mt-4"
            listClassName="border-border border-b pb-2"
            panelClassName="pt-4"
            items={[
              {
                id: 'catalog',
                label: 'Catalog & credits',
                icon: <BookOpenIcon size={14} />,
                content: catalogTab,
              },
              {
                id: 'delivery',
                label: 'Delivery & royalties',
                icon: <LinkIcon size={14} />,
                content: deliveryTab,
              },
              {
                id: 'guides',
                label: 'Guides',
                icon: <BookOpenIcon size={14} />,
                content: guidesTab,
              },
            ]}
          />
        ))}
    </StudioPanel>
  );
}
