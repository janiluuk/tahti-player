import type { ReactNode } from 'react';

import { ViewShell } from '@tahti-player/ui';

import { LegalHubLinks } from './LegalHubLinks';
import { PageBackLink } from './PageBackLink';

export function LegalDocSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export function LegalDocShell({
  title,
  meta,
  children,
}: {
  title: string;
  meta: string;
  children: ReactNode;
}) {
  return (
    <ViewShell
      title={title}
      subtitle={meta}
      classes={{ root: 'px-0 pt-0 mx-auto max-w-3xl' }}
    >
      <div className="flex flex-col gap-6">
        <PageBackLink to="/help" label="Help center" />
        {children}
        <LegalHubLinks />
      </div>
    </ViewShell>
  );
}
