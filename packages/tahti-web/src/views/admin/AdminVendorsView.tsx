import { useEffect, useState } from 'react';

import { Badge, ViewShell } from '@tahti-player/ui';

import {
  fetchAdminIntegrationStatus,
  type AdminIntegrationStatus,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { StudioPanel } from '../../components/StudioPanel';

const CRITICAL_VENDORS = [
  {
    name: 'Fiber ISP',
    service: 'Business fiber (symmetric gigabit, static IP)',
    dpaRequired: false,
    status: 'pending',
    blocker:
      'Confirm production circuit, static IP, support contact, and failover test.',
  },
  {
    name: 'UpCloud',
    service: 'VPS / object storage disaster recovery',
    dpaRequired: true,
    status: 'pending',
    blocker:
      'Confirm production account, R2/backup ownership, restore test, and DPA.',
  },
  {
    name: 'Stripe',
    service: 'Payments — platform and Connect payouts',
    dpaRequired: true,
    status: 'pending',
    blocker:
      'Confirm live keys, webhook signing secret, Connect payouts, and DPA.',
  },
  {
    name: 'Domain registrar',
    service: 'tahti.live DNS',
    dpaRequired: false,
    status: 'pending',
    blocker:
      'Confirm domain ownership, renewal access, DNS records, and incident contact.',
  },
] as const;

const INTEGRATION_VENDORS = [
  {
    name: 'Mixcloud',
    service: 'OAuth / archive uploads',
    dpaRequired: true,
    status: 'pending',
    blocker: 'Confirm production OAuth callback, scopes, and DPA.',
  },
  {
    name: 'Revelator',
    service: 'DSP distribution — ISRC registration, royalty pull-back',
    dpaRequired: true,
    status: 'blocked',
    blocker:
      'Sign the production distribution contract and issue a live API key from the Revelator partner dashboard, then set it in the distribution service config — Studio → Distribution reads it via fetchRevelatorBilling/payAndSubmitToRevelator and stays "not submitted" for every release until it is set.',
  },
  {
    name: 'Email provider',
    service: 'SMTP, newsletter dispatch, bounce webhook',
    dpaRequired: true,
    status: 'blocked',
    blocker:
      'Production SMTP credentials, sender domain, bounce webhook, and DPA are missing.',
  },
  {
    name: 'hCaptcha',
    service: 'Bot protection on signup and login',
    dpaRequired: false,
    status: 'pending',
    blocker:
      'Confirm production site/secret keys and verify fail-closed behavior.',
  },
  {
    name: 'Bandcamp',
    service: 'Import own releases into the archive',
    dpaRequired: true,
    status: 'blocked',
    blocker:
      'Import write endpoint and provider approval are still missing in the sibling API.',
  },
  {
    name: 'SoundCloud',
    service: 'Import own downloadable tracks into the archive',
    dpaRequired: true,
    status: 'pending',
    blocker:
      'Confirm production OAuth app, download scopes, callback, and DPA.',
  },
  {
    name: 'Google Drive',
    service: 'Cloud-storage import into the archive',
    dpaRequired: true,
    status: 'pending',
    blocker: 'Confirm production OAuth app, storage scopes, callback, and DPA.',
  },
  {
    name: 'Twitter / X',
    service: 'Auto-post broadcast and release announcements',
    dpaRequired: false,
    status: 'blocked',
    blocker:
      'Provider app review, publishing credentials, and server-side posting contract are missing.',
  },
  {
    name: 'Instagram',
    service: 'Auto-post broadcast and release announcements',
    dpaRequired: false,
    status: 'blocked',
    blocker:
      'Provider app review, publishing credentials, and server-side posting contract are missing.',
  },
  {
    name: 'AcoustID',
    service: 'Track fingerprint / metadata lookup',
    dpaRequired: false,
    status: 'pending',
    blocker:
      'Confirm production API key, rate limits, attribution, and privacy terms.',
  },
] as const;

/** DSP/catalog partners with no vendor account of our own to configure —
 * artists self-serve through the provider's own portal. Tracked here so the
 * "what's left to do" list doesn't stop at Revelator; each references the
 * matching flow in Studio → Distribution. */
const DISTRIBUTION_ACTIONS = [
  {
    name: 'Revelator',
    action:
      'Association-owned account (see Integrations below) — this is the one distribution vendor we configure centrally, not per-artist.',
  },
  {
    name: 'Discogs',
    action:
      'No account needed from us — an artist submits their own release via Discogs’ "Submit a new release" form after export. Studio → Distribution → Guides has the exact steps and a prefilled-metadata copy button.',
  },
  {
    name: 'MusicBrainz',
    action:
      'Same as Discogs — self-service, no vendor account. The release editor in Studio → Distribution walks an artist through it and copies a prefill.',
  },
  {
    name: 'Spotify for Artists',
    action:
      'No vendor account — once Revelator delivery marks a release "delivered", the artist claims their own profile at artists.spotify.com. Nothing for us to configure beyond keeping Revelator delivery working.',
  },
  {
    name: 'Apple Music for Artists',
    action:
      'Same pattern as Spotify — artist self-claims at artists.apple.com after DSP delivery.',
  },
  {
    name: 'YouTube Official Artist Channel',
    action:
      'Same pattern — artist requests their Official Artist Channel from YouTube directly; no vendor setup on our side.',
  },
] as const;

type CooperativeActionStatus = 'needs-legal-review' | 'needs-board-decision';

const COOPERATIVE_ACTION_STATUS_LABEL: Record<CooperativeActionStatus, string> =
  {
    'needs-legal-review': 'Needs legal review',
    'needs-board-decision': 'Needs board decision',
  };

/** Cooperative-governance and local-culture-organisation actions requested
 * for this page. None of this is legal advice or a confirmed procedure —
 * every row is a question for the board/legal counsel to resolve, not an
 * instruction this tool can verify or complete on its own. */
const COOPERATIVE_ACTIONS = [
  {
    title: 'Confirm nonprofit/cooperative registration status',
    detail:
      'Verify current registration (e.g. yhdistysrekisteri/osuuskuntarekisteri with the Finnish Patent and Registration Office, PRH) is active, bylaws are up to date, and officers on file match the current board.',
    status: 'needs-legal-review',
  },
  {
    title: 'Review collecting-society agreements',
    detail:
      'Confirm membership/reporting status with Teosto and Gramex (see Studio → Distribution → Guides for the pointers already in-app) covers the association’s current activity, not just individual artists.',
    status: 'needs-legal-review',
  },
  {
    title: 'Confirm annual nonprofit activity report obligations',
    detail:
      'Check with the board’s accountant/auditor (tilintarkastaja or toiminnantarkastaja) what the annual report generator (Governance → Annual report generator) needs to satisfy statutory filing requirements.',
    status: 'needs-legal-review',
  },
  {
    title: 'Decide cooperation terms with local culture organisations',
    detail:
      'For co-produced events or shared venues with other local culture organisations, agree who holds insurance/liability, and record the agreement — this tool cannot draft or verify that agreement.',
    status: 'needs-board-decision',
  },
] as const;

type VendorStatus = 'live' | 'pending' | 'blocked';

type Vendor = {
  name: string;
  service: string;
  dpaRequired: boolean;
  status: VendorStatus;
  blocker: string;
};

const STATUS_LABEL: Record<VendorStatus, string> = {
  live: 'Live',
  pending: 'Verify before live',
  blocked: 'Blocking launch',
};

const STATUS_COLOR: Record<VendorStatus, 'green' | 'yellow' | 'red'> = {
  live: 'green',
  pending: 'yellow',
  blocked: 'red',
};

function VendorTable({ vendors }: { vendors: readonly Vendor[] }) {
  return (
    <ul className="divide-border divide-y">
      {vendors.map((v) => (
        <li
          key={v.name}
          className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm first:pt-0 last:pb-0"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 font-medium">
              {v.name}
              <Badge variant="pill" color={STATUS_COLOR[v.status]}>
                {STATUS_LABEL[v.status]}
              </Badge>
            </div>
            <div className="text-foreground-secondary text-xs">{v.service}</div>
            <div className="text-foreground-secondary mt-1 text-xs">
              <span className="font-semibold">Launch check:</span> {v.blocker}
            </div>
          </div>
          {v.dpaRequired ? (
            <Badge variant="pill" color="orange">
              DPA required
            </Badge>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function AdminVendorsContent() {
  const [integrations, setIntegrations] = useState<AdminIntegrationStatus[]>(
    [],
  );

  useEffect(() => {
    void fetchAdminIntegrationStatus().then((res) => setIntegrations(res.data));
  }, []);

  const integrationVendors: Vendor[] = INTEGRATION_VENDORS.map((vendor) => {
    const liveStatus = integrations.find((row) => row.name === vendor.name);
    return {
      ...vendor,
      status: liveStatus?.live ? 'live' : vendor.status,
      blocker: liveStatus?.live ? liveStatus.detail : vendor.blocker,
    };
  });
  const allVendors: Vendor[] = [...CRITICAL_VENDORS, ...integrationVendors];
  const blockers = allVendors.filter((vendor) => vendor.status === 'blocked');
  const pending = allVendors.filter((vendor) => vendor.status === 'pending');

  return (
    <div className="flex flex-col gap-6">
      <ViewShell
        title="Vendors"
        classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
      >
        <StudioPanel
          title={`${blockers.length} launch blockers · ${pending.length} checks pending`}
          description="A vendor is not considered live until its credentials, contract, callback/webhook, DPA, and operational test are confirmed."
        >
          {blockers.length > 0 ? (
            <ul className="text-foreground-secondary flex flex-col gap-2 text-sm">
              {blockers.map((vendor) => (
                <li key={vendor.name}>
                  <span className="text-foreground font-medium">
                    {vendor.name}:
                  </span>{' '}
                  {vendor.blocker}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">No explicit launch blockers are recorded.</p>
          )}
        </StudioPanel>

        {integrations.length > 0 && (
          <StudioPanel title="Distribution status">
            <ul className="flex flex-col gap-2">
              {integrations.map((row) => (
                <li key={row.name} className="flex items-center gap-3 text-sm">
                  <Badge variant="pill" color={row.live ? 'green' : 'red'}>
                    {row.live ? 'Live' : 'Blocking launch'}
                  </Badge>
                  <div>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-foreground-secondary text-xs">
                      {row.detail}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </StudioPanel>
        )}

        <StudioPanel title="Critical vendors">
          <VendorTable vendors={CRITICAL_VENDORS} />
        </StudioPanel>

        <StudioPanel title="Integrations">
          <VendorTable vendors={integrationVendors} />
        </StudioPanel>

        <StudioPanel
          title="DSP & catalog partners"
          description="Distribution partners artists reach through Studio → Distribution — no vendor account for us to configure beyond Revelator."
        >
          <ul className="divide-border divide-y">
            {DISTRIBUTION_ACTIONS.map((row) => (
              <li
                key={row.name}
                className="py-2.5 text-sm first:pt-0 last:pb-0"
              >
                <div className="font-medium">{row.name}</div>
                <div className="text-foreground-secondary mt-0.5 text-xs">
                  {row.action}
                </div>
              </li>
            ))}
          </ul>
        </StudioPanel>

        <StudioPanel
          title="Cooperative governance & local culture-organisation actions"
          description="Open questions for the board/legal counsel — not legal advice, and not something this tool has verified or completed."
        >
          <ul className="divide-border divide-y">
            {COOPERATIVE_ACTIONS.map((row) => (
              <li
                key={row.title}
                className="flex flex-wrap items-start justify-between gap-2 py-2.5 text-sm first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{row.title}</div>
                  <div className="text-foreground-secondary mt-0.5 text-xs">
                    {row.detail}
                  </div>
                </div>
                <Badge variant="pill" color="orange">
                  {COOPERATIVE_ACTION_STATUS_LABEL[row.status]}
                </Badge>
              </li>
            ))}
          </ul>
        </StudioPanel>
      </ViewShell>
    </div>
  );
}

export function AdminVendorsView() {
  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/vendors">
          <div className="flex max-w-5xl flex-col gap-6">
            <AdminVendorsContent />
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
