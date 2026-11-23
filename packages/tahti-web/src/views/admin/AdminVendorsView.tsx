import { useEffect, useState } from 'react';

import {
  useTranslation,
  type ParseKeys,
  type TFunction,
} from '@tahti-player/i18n';
import { Badge, ViewShell } from '@tahti-player/ui';

import {
  fetchAdminIntegrationStatus,
  type AdminIntegrationStatus,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageEmpty, PageError } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';

type VendorStatus = 'live' | 'pending' | 'blocked';

type VendorSpec = {
  name: string;
  labelKey?: ParseKeys<'web'>;
  serviceKey: ParseKeys<'web'>;
  dpaRequired: boolean;
  status: VendorStatus;
  blockerKey: ParseKeys<'web'>;
};

const CRITICAL_VENDORS: readonly VendorSpec[] = [
  {
    name: 'Fiber ISP',
    labelKey: 'adminVendorsViewBatch30.fiberIspName',
    serviceKey: 'adminVendorsViewBatch30.fiberIspService',
    dpaRequired: false,
    status: 'pending',
    blockerKey: 'adminVendorsViewBatch30.fiberIspBlocker',
  },
  {
    name: 'UpCloud',
    serviceKey: 'adminVendorsViewBatch30.upcloudService',
    dpaRequired: true,
    status: 'pending',
    blockerKey: 'adminVendorsViewBatch30.upcloudBlocker',
  },
  {
    name: 'Stripe',
    serviceKey: 'adminVendorsViewBatch30.stripeService',
    dpaRequired: true,
    status: 'pending',
    blockerKey: 'adminVendorsViewBatch30.stripeBlocker',
  },
  {
    name: 'Domain registrar',
    labelKey: 'adminVendorsViewBatch30.domainRegistrarName',
    serviceKey: 'adminVendorsViewBatch30.domainRegistrarService',
    dpaRequired: false,
    status: 'pending',
    blockerKey: 'adminVendorsViewBatch30.domainRegistrarBlocker',
  },
];

const INTEGRATION_VENDORS: readonly VendorSpec[] = [
  {
    name: 'Mixcloud',
    serviceKey: 'adminVendorsViewBatch30.mixcloudService',
    dpaRequired: true,
    status: 'pending',
    blockerKey: 'adminVendorsViewBatch30.mixcloudBlocker',
  },
  {
    name: 'Revelator',
    serviceKey: 'adminVendorsViewBatch30.revelatorService',
    dpaRequired: true,
    status: 'blocked',
    blockerKey: 'adminVendorsViewBatch30.revelatorBlocker',
  },
  {
    name: 'Email provider',
    labelKey: 'adminVendorsViewBatch30.emailProviderName',
    serviceKey: 'adminVendorsViewBatch30.emailProviderService',
    dpaRequired: true,
    status: 'blocked',
    blockerKey: 'adminVendorsViewBatch30.emailProviderBlocker',
  },
  {
    name: 'hCaptcha',
    serviceKey: 'adminVendorsViewBatch30.hcaptchaService',
    dpaRequired: false,
    status: 'pending',
    blockerKey: 'adminVendorsViewBatch30.hcaptchaBlocker',
  },
  {
    name: 'Bandcamp',
    serviceKey: 'adminVendorsViewBatch30.bandcampService',
    dpaRequired: true,
    status: 'blocked',
    blockerKey: 'adminVendorsViewBatch30.bandcampBlocker',
  },
  {
    name: 'SoundCloud',
    serviceKey: 'adminVendorsViewBatch30.soundcloudService',
    dpaRequired: true,
    status: 'pending',
    blockerKey: 'adminVendorsViewBatch30.soundcloudBlocker',
  },
  {
    name: 'Google Drive',
    serviceKey: 'adminVendorsViewBatch30.googleDriveService',
    dpaRequired: true,
    status: 'pending',
    blockerKey: 'adminVendorsViewBatch30.googleDriveBlocker',
  },
  {
    name: 'Twitter / X',
    serviceKey: 'adminVendorsViewBatch30.autoPostService',
    dpaRequired: false,
    status: 'blocked',
    blockerKey: 'adminVendorsViewBatch30.autoPostBlocker',
  },
  {
    name: 'Instagram',
    serviceKey: 'adminVendorsViewBatch30.autoPostService',
    dpaRequired: false,
    status: 'blocked',
    blockerKey: 'adminVendorsViewBatch30.autoPostBlocker',
  },
  {
    name: 'AcoustID',
    serviceKey: 'adminVendorsViewBatch30.acoustidService',
    dpaRequired: false,
    status: 'pending',
    blockerKey: 'adminVendorsViewBatch30.acoustidBlocker',
  },
];

/** DSP/catalog partners with no vendor account of our own to configure —
 * artists self-serve through the provider's own portal. Tracked here so the
 * "what's left to do" list doesn't stop at Revelator; each references the
 * matching flow in Studio → Distribution. */
const DISTRIBUTION_ACTIONS = [
  { name: 'Revelator', actionKey: 'adminVendorsViewBatch30.revelatorAction' },
  { name: 'Discogs', actionKey: 'adminVendorsViewBatch30.discogsAction' },
  {
    name: 'MusicBrainz',
    actionKey: 'adminVendorsViewBatch30.musicbrainzAction',
  },
  {
    name: 'Spotify for Artists',
    actionKey: 'adminVendorsViewBatch30.spotifyAction',
  },
  {
    name: 'Apple Music for Artists',
    actionKey: 'adminVendorsViewBatch30.appleMusicAction',
  },
  {
    name: 'YouTube Official Artist Channel',
    actionKey: 'adminVendorsViewBatch30.youtubeAction',
  },
] as const satisfies ReadonlyArray<{
  name: string;
  actionKey: ParseKeys<'web'>;
}>;

type CooperativeActionStatus = 'needs-legal-review' | 'needs-board-decision';

const COOPERATIVE_ACTION_STATUS_LABEL: Record<
  CooperativeActionStatus,
  ParseKeys<'web'>
> = {
  'needs-legal-review': 'adminVendorsViewBatch30.needsLegalReview',
  'needs-board-decision': 'adminVendorsViewBatch30.needsBoardDecision',
};

/** Cooperative-governance and local-culture-organisation actions requested
 * for this page. None of this is legal advice or a confirmed procedure —
 * every row is a question for the board/legal counsel to resolve, not an
 * instruction this tool can verify or complete on its own. */
function cooperativeActions(t: TFunction<'web'>) {
  return [
    {
      title: t(
        'adminVendorsView.confirmNonprofitCooperativeRegistrationStatus',
      ),
      detail: t('adminVendorsViewBatch30.registrationDetail'),
      status: 'needs-legal-review',
    },
    {
      title: t('adminVendorsView.reviewCollectingSocietyAgreements'),
      detail: t('adminVendorsViewBatch30.collectingSocietyDetail'),
      status: 'needs-legal-review',
    },
    {
      title: t('adminVendorsView.confirmAnnualNonprofitActivityReport'),
      detail: t('adminVendorsViewBatch30.annualReportDetail'),
      status: 'needs-legal-review',
    },
    {
      title: t('adminVendorsView.decideCooperationTermsWithLocal'),
      detail: t('adminVendorsViewBatch30.cooperationTermsDetail'),
      status: 'needs-board-decision',
    },
  ] as const;
}

type Vendor = {
  name: string;
  label: string;
  service: string;
  dpaRequired: boolean;
  status: VendorStatus;
  blocker: string;
};

const localizeVendor = (spec: VendorSpec, t: TFunction<'web'>): Vendor => ({
  name: spec.name,
  label: spec.labelKey ? t(spec.labelKey) : spec.name,
  service: t(spec.serviceKey),
  dpaRequired: spec.dpaRequired,
  status: spec.status,
  blocker: t(spec.blockerKey),
});

const STATUS_LABEL: Record<VendorStatus, ParseKeys<'web'>> = {
  live: 'adminVendorsViewStates.live',
  pending: 'adminVendorsViewBatch30.verifyBeforeLive',
  blocked: 'adminVendorsViewStates.blockingLaunch',
};

const STATUS_COLOR: Record<VendorStatus, 'green' | 'yellow' | 'red'> = {
  live: 'green',
  pending: 'yellow',
  blocked: 'red',
};

function VendorTable({ vendors }: { vendors: readonly Vendor[] }) {
  const { t } = useTranslation('web');
  return (
    <ul className="divide-border divide-y break-words">
      {vendors.map((v) => (
        <li
          key={v.name}
          className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm first:pt-0 last:pb-0"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 font-medium">
              {v.label}
              <Badge variant="pill" color={STATUS_COLOR[v.status]}>
                {t(STATUS_LABEL[v.status])}
              </Badge>
            </div>
            <div className="text-foreground-secondary text-xs">{v.service}</div>
            <div className="text-foreground-secondary mt-1 text-xs">
              <span className="font-semibold">
                {t('adminVendorsViewBatch30.launchCheck')}
              </span>{' '}
              {v.blocker}
            </div>
          </div>
          {v.dpaRequired ? (
            <Badge variant="pill" color="orange">
              {t('adminVendors.dpaRequired')}
            </Badge>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function AdminVendorsContent() {
  const { t } = useTranslation('web');
  const [integrations, setIntegrations] = useState<AdminIntegrationStatus[]>(
    [],
  );

  const [statusError, setStatusError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    void fetchAdminIntegrationStatus().then((res) => {
      setIntegrations(res.data);
      setStatusError(
        res.meta.source === 'api' ? (res.meta.reason ?? null) : null,
      );
    });
  }, [attempt]);

  const criticalVendors = CRITICAL_VENDORS.map((spec) =>
    localizeVendor(spec, t),
  );
  const integrationVendors: Vendor[] = INTEGRATION_VENDORS.map((spec) => {
    const vendor = localizeVendor(spec, t);
    const liveStatus = integrations.find((row) => row.name === vendor.name);
    return {
      ...vendor,
      status: liveStatus?.live ? 'live' : vendor.status,
      blocker: liveStatus?.live ? liveStatus.detail : vendor.blocker,
    };
  });
  const allVendors: Vendor[] = [...criticalVendors, ...integrationVendors];
  const blockers = allVendors.filter((vendor) => vendor.status === 'blocked');
  const pending = allVendors.filter((vendor) => vendor.status === 'pending');

  return (
    <div className="flex flex-col gap-6">
      <ViewShell
        title={t('adminVendors.vendors')}
        subtitle={t('adminPages.vendorsDescription')}
        classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
      >
        <StudioPanel
          title={`${t('adminVendorsViewBatch30.launchBlockers', {
            count: blockers.length,
          })} · ${t('adminVendorsViewBatch30.checksPending', {
            count: pending.length,
          })}`}
          description={t('adminVendors.aVendorIsNotConsidered')}
        >
          {blockers.length > 0 ? (
            <ul className="text-foreground-secondary flex flex-col gap-2 text-sm break-words">
              {blockers.map((vendor) => (
                <li key={vendor.name}>
                  <span className="text-foreground font-medium">
                    {vendor.label}:
                  </span>{' '}
                  {vendor.blocker}
                </li>
              ))}
            </ul>
          ) : (
            <PageEmpty title={t('empties.noLaunchBlockers')} />
          )}
        </StudioPanel>

        {statusError && integrations.length === 0 ? (
          <StudioPanel title={t('adminVendors.distributionStatus')}>
            <PageError
              title={t('loadErrors.couldNotCheckLiveIntegrationStatus')}
              description={t('adminVendorsViewLabels.theBlockerListAboveUses', {
                statusError,
              })}
              onRetry={() => setAttempt((n) => n + 1)}
            />
          </StudioPanel>
        ) : null}

        {integrations.length > 0 && (
          <StudioPanel title={t('adminVendors.distributionStatus')}>
            <ul className="flex flex-col gap-2 break-words">
              {integrations.map((row) => (
                <li key={row.name} className="flex items-center gap-3 text-sm">
                  <Badge variant="pill" color={row.live ? 'green' : 'red'}>
                    {row.live
                      ? t('adminVendorsViewStates.live')
                      : t('adminVendorsViewStates.blockingLaunch')}
                  </Badge>
                  <div className="min-w-0">
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

        <StudioPanel title={t('adminVendors.criticalVendors')}>
          <VendorTable vendors={criticalVendors} />
        </StudioPanel>

        <StudioPanel title={t('adminVendors.integrations')}>
          <VendorTable vendors={integrationVendors} />
        </StudioPanel>

        <StudioPanel
          title={t('adminVendors.dspCatalogPartners')}
          description={t(
            'adminVendors.distributionPartnersArtistsReachThrough',
          )}
        >
          <ul className="divide-border divide-y break-words">
            {DISTRIBUTION_ACTIONS.map((row) => (
              <li
                key={row.name}
                className="py-2.5 text-sm first:pt-0 last:pb-0"
              >
                <div className="font-medium">{row.name}</div>
                <div className="text-foreground-secondary mt-0.5 text-xs">
                  {t(row.actionKey)}
                </div>
              </li>
            ))}
          </ul>
        </StudioPanel>

        <StudioPanel
          title={t(
            'adminVendors.cooperativeGovernanceLocalCultureOrganisation',
          )}
          description={t('adminVendors.openQuestionsForTheBoard')}
        >
          <ul className="divide-border divide-y break-words">
            {cooperativeActions(t).map((row) => (
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
                  {t(COOPERATIVE_ACTION_STATUS_LABEL[row.status])}
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
