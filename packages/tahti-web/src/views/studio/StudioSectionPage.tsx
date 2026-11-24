import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { ViewShell } from '@tahti-player/ui';

import { StudioGate } from '../../components/StudioGate';
import { useScrollToHash } from '../../hooks/useScrollToHash';
import { STUDIO_SECTION_COPY } from '../../lib/studioSectionCopy';

/** One Studio → Profile or Studio → Channel page. The sub-tabs live in
 * `StudioNav`, so on phones the selected tab names the page and the title
 * is kept for screen readers only. */
export function StudioSectionPage({
  section,
  requireChannel,
  'data-testid': testId,
  children,
}: {
  section: keyof typeof STUDIO_SECTION_COPY;
  requireChannel: boolean;
  'data-testid': string;
  children: ReactNode;
}) {
  const { t } = useTranslation('web');
  const copy = STUDIO_SECTION_COPY[section];
  useScrollToHash();

  return (
    <StudioGate requireChannel={requireChannel}>
      <div className="studio-page-layout mx-auto flex w-full max-w-6xl flex-col gap-4 px-1 py-2">
        <ViewShell
          title={t(copy.title)}
          subtitle={t(copy.description)}
          classes={{
            root: 'px-0 pt-0',
            title: 'max-sm:sr-only',
            content: 'gap-5',
          }}
        >
          <div className="flex min-w-0 flex-col gap-4" data-testid={testId}>
            {children}
          </div>
        </ViewShell>
      </div>
    </StudioGate>
  );
}
