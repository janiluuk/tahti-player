import { Link } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  BarcodeIcon,
  BookOpenIcon,
  CopyIcon,
  Disc3Icon,
  DownloadIcon,
  ExternalLinkIcon,
  LinkIcon,
  Music2Icon,
  PlusIcon,
  SendIcon,
  Trash2Icon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  Input,
  SaveButton,
  Select,
  Tabs,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  fetchAllRoyalties,
  fetchReleaseCatalog,
  fetchReleaseExportJson,
  fetchReleaseRoyalties,
  fetchRevelatorBilling,
  parseCredits,
  patchReleaseCatalog,
  payAndSubmitToRevelator,
} from '../../api/distribution';
import { fetchStudioReleases } from '../../api/studio';
import type {
  ReleaseCatalog,
  ReleaseChecklistItem,
  ReleaseCredit,
  ReleaseCreditRole,
  RevelatorBillingStatus,
  RevelatorRoyaltyReportRow,
  StudioRelease,
} from '../../api/studio-types';
import { RELEASE_CREDIT_ROLES } from '../../api/studio-types';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { Eyebrow } from '../../components/tahti/Eyebrow';

const MUSICBRAINZ_SUBMIT_URL = 'https://musicbrainz.org/release/add';
const DISCOGS_SUBMIT_URL = 'https://www.discogs.com/search/';

const MUSICBRAINZ_GUIDE_STEPS = [
  'Export JSON (or copy UPC, ISRC, credits, P/C-lines).',
  'Open MusicBrainz “Add release” and choose the release type.',
  'Enter title, artist credit, and date — match your Tahti release.',
  'Add medium and tracklist; paste ISRCs from your export when you have them.',
  'Add label, catalog number, and barcode if applicable.',
  'Save, then copy the release MBID back into Tahti.',
] as const;

const DISCOGS_GUIDE_STEPS = [
  'Export JSON (or copy title, label, barcode, and credits).',
  'Search Discogs first — only add if the release is missing.',
  'Submit a new release with title, label, format, country, and date.',
  'Add the tracklist in order with durations from your export.',
  'Add barcode and catalog number if applicable, then submit for review.',
  'Copy the release URL or numeric ID back into Tahti.',
] as const;

const CATALOG_METHODS = [
  {
    id: 'upc',
    label: 'UPC / EAN',
    description: 'Identify the release with its barcode.',
    icon: BarcodeIcon,
  },
  {
    id: 'musicbrainz',
    label: 'MusicBrainz',
    description: 'Link the open catalog release and artist records.',
    icon: Music2Icon,
  },
  {
    id: 'discogs',
    label: 'Discogs',
    description: 'Link the community catalog release entry.',
    icon: Disc3Icon,
  },
  {
    id: 'rights',
    label: 'Rights & label',
    description: 'Store P-line, C-line, and label imprint details.',
    icon: BookOpenIcon,
  },
] as const;

const POST_RELEASE_CLAIM_LINKS = [
  {
    id: 'spotify',
    label: 'Spotify for Artists',
    url: 'https://artists.spotify.com/',
  },
  {
    id: 'apple',
    label: 'Apple Music for Artists',
    url: 'https://artists.apple.com/',
  },
  {
    id: 'youtube',
    label: 'YouTube Official Artist Channel',
    url: 'https://www.youtube.com/artist',
  },
] as const;

const COLLECTING_SOCIETY_POINTERS = [
  {
    id: 'teosto',
    region: 'Finland',
    label: 'Teosto',
    url: 'https://www.teosto.fi/en/',
    hint: 'Works and performers for public performance royalties.',
  },
  {
    id: 'gramex',
    region: 'Finland',
    label: 'Gramex',
    url: 'https://www.gramex.fi/en/',
    hint: 'Neighbouring rights for recordings.',
  },
  {
    id: 'prs',
    region: 'UK',
    label: 'PRS for Music',
    url: 'https://www.prsformusic.com/',
    hint: 'UK composition performance rights.',
  },
  {
    id: 'ascap',
    region: 'USA',
    label: 'ASCAP',
    url: 'https://www.ascap.com/',
    hint: 'US PRO for songwriters and publishers.',
  },
] as const;

function euros(cents: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

function statusColor(
  status: string | null,
): 'green' | 'yellow' | 'red' | 'secondary' {
  if (status === 'delivered' || status === 'live' || status === 'submitted') {
    return 'green';
  }
  if (status === 'pending') {
    return 'yellow';
  }
  if (status === 'failed') {
    return 'red';
  }
  return 'secondary';
}

type CatalogForm = {
  upc: string;
  musicbrainzReleaseId: string;
  musicbrainzArtistId: string;
  discogsReleaseId: string;
  pLine: string;
  cLine: string;
  labelImprint: string;
};

function catalogToForm(catalog: ReleaseCatalog): CatalogForm {
  return {
    upc: catalog.upc ?? '',
    musicbrainzReleaseId: catalog.musicbrainzReleaseId ?? '',
    musicbrainzArtistId: catalog.musicbrainzArtistId ?? '',
    discogsReleaseId: catalog.discogsReleaseId ?? '',
    pLine: catalog.pLine ?? '',
    cLine: catalog.cLine ?? '',
    labelImprint: catalog.labelImprint ?? '',
  };
}

function GuideDetail({
  title,
  steps,
  href,
  linkLabel,
}: {
  title: string;
  steps: readonly string[];
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="border-border bg-background-secondary/30 rounded-lg border p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <ol className="text-foreground-secondary mt-2 list-inside list-decimal space-y-1">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {href && linkLabel ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-primary mt-3 inline-flex items-center gap-1 underline underline-offset-2"
        >
          {linkLabel}
          <ExternalLinkIcon size={12} aria-hidden />
        </a>
      ) : null}
    </div>
  );
}

function ReleaseOpsPanel({ release }: { release: StudioRelease }) {
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
  const [activeMethods, setActiveMethods] = useState<Set<string>>(
    new Set(['upc', 'musicbrainz', 'discogs', 'rights']),
  );
  const [selectedGuide, setSelectedGuide] = useState('musicbrainz');

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
    void Promise.all([
      fetchReleaseCatalog(release.id),
      fetchRevelatorBilling(release.id),
    ]).then(([c, b]) => {
      if (c.data) {
        setCatalog(c.data);
        setForm(catalogToForm(c.data));
        setCredits(parseCredits(c.data.credits));
        setChecklist(c.data.checklist);
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
      setBilling(b.data);
      setLoading(false);
    });
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
    }).then((r) => {
      setBusy(false);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setCatalog(r.data);
      setForm(catalogToForm(r.data));
      setCredits(parseCredits(r.data.credits));
      setChecklist(r.data.checklist);
      toast.success('Catalog saved.');
    });
  };

  const runExport = async (
    mode: 'download' | 'musicbrainz' | 'discogs',
  ): Promise<void> => {
    setBusy(true);
    const res = await fetchReleaseExportJson(release.id);
    setBusy(false);
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
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CATALOG_METHODS.map((method) => {
            const Icon = method.icon;
            const active = activeMethods.has(method.id);
            return (
              <button
                key={method.id}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setActiveMethods((current) => {
                    const next = new Set(current);
                    if (next.has(method.id)) {
                      next.delete(method.id);
                    } else {
                      next.add(method.id);
                    }
                    return next;
                  })
                }
                className={`border-border flex items-center gap-2 rounded-md border p-2 text-left text-xs ${active ? 'bg-accent-blue/10 border-accent-blue' : 'opacity-70'}`}
              >
                <Icon size={18} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{method.label}</span>
                  <span className="text-foreground-secondary block">
                    {method.description}
                  </span>
                </span>
                <span aria-hidden>{active ? '✓' : '○'}</span>
              </button>
            );
          })}
        </div>
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

      <div>
        <p className="mb-2 text-xs font-medium">Credits & roles</p>
        {credits.length === 0 && (
          <p className="text-foreground-secondary mb-2 text-xs">
            No credits yet — add writers, performers, producers, etc.
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {credits.map((credit, index) => (
            <li
              key={index}
              className="grid gap-2 sm:grid-cols-[8rem_1fr_8rem_auto]"
            >
              <Select
                className="text-xs"
                options={RELEASE_CREDIT_ROLES.map((role) => ({
                  id: role,
                  label: role,
                }))}
                value={credit.role}
                disabled={busy}
                label="Credit role"
                onValueChange={(role) => {
                  const next = [...credits];
                  next[index] = {
                    ...credit,
                    role: role as ReleaseCreditRole,
                  };
                  setCredits(next);
                }}
              />
              <Input
                value={credit.name}
                placeholder="Name"
                disabled={busy}
                aria-label="Credit name"
                onChange={(e) => {
                  const next = [...credits];
                  next[index] = { ...credit, name: e.target.value };
                  setCredits(next);
                }}
              />
              <Input
                value={credit.artistUsername ? `@${credit.artistUsername}` : ''}
                placeholder="@username"
                disabled={busy}
                maxLength={33}
                aria-label="Tahti username"
                onChange={(e) => {
                  const raw = e.target.value
                    .trim()
                    .replace(/^@/, '')
                    .toLowerCase();
                  const next = [...credits];
                  next[index] = {
                    ...credit,
                    artistUsername: raw.length > 0 ? raw : undefined,
                  };
                  setCredits(next);
                }}
              />
              <Tooltip content="Remove credit" side="top">
                <Button
                  size="icon-sm"
                  variant="text"
                  disabled={busy}
                  aria-label={`Remove credit ${credit.name || index + 1}`}
                  onClick={() =>
                    setCredits(credits.filter((_, i) => i !== index))
                  }
                >
                  <Trash2Icon size={14} aria-hidden />
                </Button>
              </Tooltip>
            </li>
          ))}
        </ul>
        <Button
          size="sm"
          variant="secondary"
          className="mt-2"
          disabled={busy}
          onClick={() => setCredits([...credits, { role: 'writer', name: '' }])}
        >
          <PlusIcon size={14} aria-hidden className="mr-1.5" />
          Add credit
        </Button>
      </div>

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
        <a
          href={MUSICBRAINZ_SUBMIT_URL}
          target="_blank"
          rel="noreferrer"
          className="text-foreground-secondary hover:text-foreground inline-flex items-center gap-1 text-xs underline underline-offset-2"
        >
          Add on MusicBrainz
          <ExternalLinkIcon size={12} aria-hidden />
        </a>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => void runExport('discogs')}
        >
          <CopyIcon size={14} aria-hidden className="mr-1.5" />
          Copy Discogs prefill
        </Button>
        <a
          href={DISCOGS_SUBMIT_URL}
          target="_blank"
          rel="noreferrer"
          className="text-foreground-secondary hover:text-foreground inline-flex items-center gap-1 text-xs underline underline-offset-2"
        >
          Search on Discogs
          <ExternalLinkIcon size={12} aria-hidden />
        </a>
      </div>
    </div>
  );

  const deliveryTab = (
    <div className="flex flex-col gap-3">
      <p className="text-foreground-secondary text-xs">
        Submits catalog metadata to Revelator (Spotify, Apple, etc.). Requires
        UPC or ISRC on every track.
      </p>
      {revelatorStatus && (
        <p className="text-xs">
          Status: <strong>{revelatorStatus}</strong>
          {revelatorId && (
            <span className="text-foreground-secondary">
              {' '}
              · id {revelatorId}
            </span>
          )}
        </p>
      )}
      {billing && !billing.paid && (
        <p className="text-foreground-secondary text-xs">
          {billing.feeCents === 0 && billing.studioIncludedRemaining != null
            ? `Studio included slot (${billing.studioIncludedRemaining} left this year)`
            : `Distribution fee: ${euros(billing.feeCents)}`}
        </p>
      )}
      {billing?.paid && (
        <p className="text-foreground-secondary text-xs">
          {billing.waived
            ? 'Fee waived (Studio included)'
            : `Distribution fee paid${
                billing.distributionPaidAt
                  ? ` on ${new Date(billing.distributionPaidAt).toLocaleDateString()}`
                  : ''
              }`}
        </p>
      )}
      <Button
        size="sm"
        className="self-start"
        disabled={busy || !canSubmit}
        onClick={() => {
          setBusy(true);
          void payAndSubmitToRevelator(release.id).then((r) => {
            setBusy(false);
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
              prev
                ? { ...prev, revelatorStatus: r.data.revelatorStatus }
                : prev,
            );
            setBilling((prev) => (prev ? { ...prev, paid: true } : prev));
            loadOps();
          });
        }}
      >
        {!busy && <SendIcon size={14} aria-hidden className="mr-1.5" />}
        {busy
          ? 'Submitting…'
          : billing && !billing.paid && billing.feeCents > 0
            ? `Pay ${euros(billing.feeCents)} & submit`
            : 'Submit to Revelator'}
      </Button>

      {showRoyalties && (
        <div className="border-border border-t pt-3">
          <p className="mb-1 text-xs font-medium">Royalty reports</p>
          {!royaltiesLoaded ? (
            <PageLoading label="Loading…" />
          ) : royalties.length === 0 ? (
            <p className="text-foreground-secondary text-xs">
              No reports yet — synced monthly after DSP delivery.
            </p>
          ) : (
            <ul className="divide-border divide-y text-xs">
              {royalties.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-1.5"
                >
                  <span>{row.periodStart.slice(0, 7)}</span>
                  <span className="text-foreground-secondary">
                    {row.streams != null
                      ? `${row.streams.toLocaleString()} streams · `
                      : ''}
                    {euros(row.amountCents)} {row.currency}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );

  const guidesTab = (
    <div className="flex flex-col gap-4 text-xs">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { id: 'musicbrainz', label: 'MusicBrainz', icon: Music2Icon },
          { id: 'discogs', label: 'Discogs', icon: Disc3Icon },
          { id: 'upc', label: 'UPC / EAN', icon: BarcodeIcon },
          { id: 'automation', label: 'Automation', icon: LinkIcon },
        ].map((guide) => {
          const Icon = guide.icon;
          return (
            <button
              key={guide.id}
              type="button"
              onClick={() => setSelectedGuide(guide.id)}
              className={`border-border flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border p-3 text-center ${selectedGuide === guide.id ? 'bg-accent-blue/10 border-accent-blue' : ''}`}
            >
              <Icon size={28} aria-hidden />
              <span className="font-medium">{guide.label}</span>
            </button>
          );
        })}
      </div>
      {selectedGuide === 'musicbrainz' && (
        <GuideDetail
          title="MusicBrainz"
          steps={MUSICBRAINZ_GUIDE_STEPS}
          href={MUSICBRAINZ_SUBMIT_URL}
          linkLabel="Open MusicBrainz release editor"
        />
      )}
      {selectedGuide === 'discogs' && (
        <GuideDetail
          title="Discogs"
          steps={DISCOGS_GUIDE_STEPS}
          href={DISCOGS_SUBMIT_URL}
          linkLabel="Search Discogs"
        />
      )}
      {selectedGuide === 'upc' && (
        <GuideDetail
          title="UPC / EAN"
          steps={[
            'Use the barcode assigned to this exact release, not an artist or catalog number.',
            'Save it under Catalog & credits; it is included in the export JSON and distribution checklist.',
            'If the release has no UPC/EAN, add ISRC values to every track before delivery.',
          ]}
        />
      )}
      {selectedGuide === 'automation' && (
        <GuideDetail
          title="Automation"
          steps={[
            'Export JSON creates a portable metadata package for MusicBrainz, Discogs, and future delivery tools.',
            'Copy prefill prepares the relevant form with the release title, barcode, credits, and tracklist.',
            'Delivery & royalties can submit eligible releases to Revelator and show status and royalty reports here.',
          ]}
        />
      )}
      <div>
        <p className="mb-1 font-medium">Post-release claim links</p>
        <ul className="list-inside list-disc">
          {POST_RELEASE_CLAIM_LINKS.map((link) => (
            <li key={link.id}>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-1 font-medium">Collecting societies</p>
        <ul className="list-inside list-disc">
          {COLLECTING_SOCIETY_POINTERS.map((society) => (
            <li key={society.id}>
              <a
                href={society.url}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {society.label}
              </a>
              <span className="text-foreground-secondary">
                {' '}
                ({society.region}) — {society.hint}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

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

export function StudioDistributionView() {
  const [releases, setReleases] = useState<StudioRelease[]>([]);
  const [allRoyalties, setAllRoyalties] = useState<RevelatorRoyaltyReportRow[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([fetchStudioReleases(), fetchAllRoyalties()]).then(
      ([rel, roy]) => {
        setReleases(rel.data.releases ?? []);
        setAllRoyalties(roy.data ?? []);
        setLoading(false);
      },
    );
  }, []);

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-6">
        <StudioNav current="/studio/distribution" />
        <ViewShell
          title="Distribution"
          subtitle="DSP delivery & catalog metadata — submit releases to Revelator, track UPC/ISRC/MusicBrainz identifiers, and review royalty reports."
          classes={{ root: 'px-0 pt-0' }}
        >
          <Link
            to="/studio/releases"
            className="text-foreground-secondary hover:text-foreground inline-flex items-center gap-1 text-xs underline underline-offset-2"
          >
            <ArrowLeftIcon size={12} aria-hidden />
            Back to Releases
          </Link>

          <section className="flex flex-col gap-3">
            <h2>
              <Eyebrow>Releases</Eyebrow>
            </h2>
            {loading ? (
              <PageLoading label="Loading…" />
            ) : releases.length === 0 ? (
              <p className="text-foreground-secondary text-sm">
                No releases yet — create one under{' '}
                <Link to="/studio/releases" className="underline">
                  Releases
                </Link>{' '}
                first.
              </p>
            ) : (
              releases.map((release) => (
                <ReleaseOpsPanel key={release.id} release={release} />
              ))
            )}
          </section>

          {allRoyalties.length > 0 && (
            <StudioPanel title="All royalty reports">
              <ul className="divide-border divide-y text-sm">
                {allRoyalties.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                  >
                    <div>
                      <div className="font-medium">{row.releaseTitle}</div>
                      <div className="text-foreground-secondary text-xs">
                        {row.periodStart} – {row.periodEnd}
                      </div>
                    </div>
                    <div className="text-foreground-secondary text-xs">
                      {row.streams != null
                        ? `${row.streams.toLocaleString()} streams · `
                        : ''}
                      {euros(row.amountCents)} {row.currency}
                    </div>
                  </li>
                ))}
              </ul>
            </StudioPanel>
          )}
        </ViewShell>
      </div>
    </StudioGate>
  );
}
