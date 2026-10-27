import { Building2Icon } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { ExternalLink, InlineLoader } from '@tahti-player/ui';

import {
  fetchAssociationProfile,
  type AssociationProfile,
  type GovernanceAuditor,
} from '../../api/governance-association';
import { PageEmpty, PageError } from '../PageStates';
import { GovernancePanel } from './GovernancePanel';

function auditorRole(auditor: GovernanceAuditor): string {
  const role = auditor.kind === 'AUDITOR' ? 'Auditor' : 'Operations inspector';
  return auditor.deputy ? `Deputy ${role.toLowerCase()}` : role;
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="text-foreground-secondary text-xs">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

function hasDetails(profile: AssociationProfile): boolean {
  return Boolean(
    profile.name ||
    profile.businessId ||
    profile.registerNumber ||
    profile.domicile ||
    profile.contactEmail ||
    profile.postalAddress ||
    profile.website,
  );
}

/** The association's registered identity, contacts and serving auditors
 * (GET /api/v1/governance/association). */
export function AssociationPanel() {
  const [profile, setProfile] = useState<AssociationProfile | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    void fetchAssociationProfile().then((result) => {
      if (cancelled) {
        return;
      }
      setProfile(result.data);
      setLoadError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
      setState(result.data ? 'ready' : 'failed');
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <GovernancePanel title="The association" icon={Building2Icon}>
      {state === 'loading' ? (
        <InlineLoader label="Loading…" />
      ) : state === 'failed' || !profile ? (
        <PageError
          title="Could not load the association's details"
          description={loadError ?? undefined}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : (
        <>
          {hasDetails(profile) ? (
            <dl className="grid gap-2 sm:grid-cols-2">
              {profile.name ? <Fact label="Name" value={profile.name} /> : null}
              {profile.businessId ? (
                <Fact label="Business ID" value={profile.businessId} />
              ) : null}
              {profile.registerNumber ? (
                <Fact label="Register number" value={profile.registerNumber} />
              ) : null}
              {profile.domicile ? (
                <Fact label="Domicile" value={profile.domicile} />
              ) : null}
              {profile.postalAddress ? (
                <Fact label="Postal address" value={profile.postalAddress} />
              ) : null}
              {profile.contactEmail ? (
                <Fact
                  label="Contact"
                  value={
                    <a
                      href={`mailto:${profile.contactEmail}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {profile.contactEmail}
                    </a>
                  }
                />
              ) : null}
              {profile.website ? (
                <Fact
                  label="Website"
                  value={
                    <ExternalLink
                      href={profile.website}
                      className="no-underline underline-offset-2 hover:underline"
                    >
                      {profile.website}
                    </ExternalLink>
                  }
                />
              ) : null}
            </dl>
          ) : (
            <PageEmpty title="The board has not entered the association's details yet." />
          )}
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold">Auditors</h3>
            {profile.auditors.length === 0 ? (
              <PageEmpty title="No auditor or operations inspector is serving." />
            ) : (
              <ul className="flex flex-col gap-1">
                {profile.auditors.map((auditor) => (
                  <li key={auditor.id} className="text-sm">
                    <span className="font-medium">{auditor.name}</span>
                    {auditor.firm ? `, ${auditor.firm}` : ''}
                    <span className="text-foreground-secondary ml-1.5 text-xs">
                      {auditorRole(auditor)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </GovernancePanel>
  );
}
