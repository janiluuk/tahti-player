import { ButtonAnchor, ViewShell } from '@tahti-player/ui';

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

export function MoreView() {
  const gapCount = FEATURES.filter((r) => featureParity(r) !== 'both').length;

  return (
    <ViewShell
      title="Tahti map"
      classes={{
        root: 'px-0 pt-0 mx-auto max-w-7xl',
        scrollableArea: 'gap-8',
      }}
    >
      <nav className="flex flex-wrap gap-2 text-xs">
        <a
          href="#cases-anonymous"
          className="border-border hover:text-foreground text-foreground-secondary rounded-md border px-2 py-1"
        >
          Anonymous
        </a>
        <a
          href="#cases-auth"
          className="border-border hover:text-foreground text-foreground-secondary rounded-md border px-2 py-1"
        >
          Auth
        </a>
        <a
          href="#cases-listener"
          className="border-border hover:text-foreground text-foreground-secondary rounded-md border px-2 py-1"
        >
          Listener
        </a>
        <a
          href="#cases-artist"
          className="border-border hover:text-foreground text-foreground-secondary rounded-md border px-2 py-1"
        >
          Artist
        </a>
        <a
          href="#cases-edge"
          className="border-border hover:text-foreground text-foreground-secondary rounded-md border px-2 py-1"
        >
          Edge
        </a>
        <a
          href="#flow-gallery"
          className="border-border hover:text-foreground text-foreground-secondary rounded-md border px-2 py-1"
        >
          Flows
        </a>
        <a
          href="#design-system"
          className="border-border hover:text-foreground text-foreground-secondary rounded-md border px-2 py-1"
        >
          Design
        </a>
        <a
          href="#feature-matrix"
          className="border-border hover:text-foreground text-foreground-secondary rounded-md border px-2 py-1"
        >
          Features
        </a>
        <a
          href="#saved-comments"
          className="border-border hover:text-foreground text-foreground-secondary rounded-md border px-2 py-1"
        >
          Comments
        </a>
      </nav>

      <ScreenAtlas />

      <FlowGallery />

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
