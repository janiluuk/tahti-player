import { ButtonAnchor, ViewShell } from '@tahti-player/ui';

import { E2eRunGallery } from '../components/E2eRunGallery';
import { FlowGallery } from '../components/FlowGallery';
import { PortInventoryPanel } from '../components/PortInventoryPanel';
import { ScreenAtlas } from '../components/ScreenAtlas';
import { StudioPanel } from '../components/StudioPanel';
import { FeatureCompareCard } from './more/FeatureCompareCard';
import { featureParity, FEATURES } from './more/features';
import { SavedMapComments } from './more/SavedMapComments';

/** `storybook dev -p 6006` — see packages/storybook/package.json. Not
 * deployed anywhere; this only resolves when someone has it running
 * locally alongside this app. */
const STORYBOOK_URL = 'http://localhost:6006';

const JUMP_LINKS = [
  { href: '#cases-anonymous', label: 'Anonymous' },
  { href: '#cases-auth', label: 'Auth' },
  { href: '#cases-listener', label: 'Listener' },
  { href: '#cases-artist', label: 'Artist' },
  { href: '#cases-edge', label: 'Edge' },
  { href: '#flow-gallery', label: 'Flows' },
  { href: '#e2e-runs', label: 'E2E' },
  { href: '#design-system', label: 'Design' },
  { href: '#feature-matrix', label: 'Features' },
  { href: '#saved-comments', label: 'Comments' },
] as const;

export function MoreView() {
  const gapCount = FEATURES.filter((r) => featureParity(r) !== 'both').length;

  return (
    <ViewShell
      title="Tahti map"
      classes={{
        root: 'px-0 pt-0 mx-auto max-w-7xl',
        content: 'gap-8',
      }}
    >
      <nav aria-label="Jump to cases" className="flex flex-wrap gap-2">
        {JUMP_LINKS.map((link) => (
          <ButtonAnchor
            key={link.href}
            href={link.href}
            variant="tertiary"
            size="xs"
          >
            {link.label}
          </ButtonAnchor>
        ))}
      </nav>

      <ScreenAtlas />

      <FlowGallery />

      <E2eRunGallery />

      <PortInventoryPanel />

      <section id="design-system" className="scroll-mt-4">
        <StudioPanel
          title="Design system"
          action={
            <ButtonAnchor
              href={STORYBOOK_URL}
              target="_blank"
              rel="noreferrer"
              size="sm"
            >
              Open Storybook →
            </ButtonAnchor>
          }
        >
          <p className="text-foreground-secondary text-sm">
            Every shared tahti-web component and view — panels, dialogs,
            admin/studio chrome — is catalogued in Storybook alongside the
            existing <code className="text-foreground">@tahti-player/ui</code>{' '}
            library. New or changed UI should match what's documented there; see{' '}
            <code className="text-foreground">UI-REDESIGN-WORKLOG.md</code>
            's compliance-sweep entries for known gaps still being worked
            through.
          </p>
          <p className="text-foreground-secondary mt-2 text-xs">
            Not running locally? Start it with{' '}
            <code className="text-foreground">pnpm storybook</code> (port 6006).
          </p>
        </StudioPanel>
      </section>

      <SavedMapComments />

      <section
        id="feature-matrix"
        className="flex flex-col gap-3"
        aria-labelledby="feature-matrix-heading"
      >
        <div>
          <h2
            id="feature-matrix-heading"
            className="font-display text-2xl font-extrabold tracking-tight"
          >
            Feature matrix
          </h2>
          <p className="text-foreground-secondary mt-1 max-w-3xl text-sm">
            Same inventory as before — each row is Tahti | beta.tahti.live side
            by side. Rows that exist on only one surface show a parity-gap
            badge.
          </p>
          <p className="text-foreground-secondary mt-1 text-xs tracking-wide uppercase">
            {FEATURES.length} features · {gapCount} parity gap
            {gapCount === 1 ? '' : 's'}
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {FEATURES.map((row) => (
            <li key={row.feature}>
              <FeatureCompareCard row={row} />
            </li>
          ))}
        </ul>
      </section>

      <p className="text-foreground-secondary text-xs">
        Production site:{' '}
        <a
          href="https://tahti.live"
          target="_blank"
          rel="noreferrer"
          className="underline-offset-2 hover:underline"
        >
          tahti.live
        </a>
      </p>
    </ViewShell>
  );
}
