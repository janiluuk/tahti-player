import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Box } from '@tahti-player/ui';
import type { ReactNode } from 'react';

type Status = 'shipped' | 'next' | 'leave' | 'gap';

type BacklogRow = {
  status: Status;
  surface: string;
  swap: string;
};

const STATUS_LABEL: Record<Status, string> = {
  shipped: 'Shipped',
  next: 'Next',
  leave: 'Leave',
  gap: 'Gap',
};

const STATUS_COLOR: Record<
  Status,
  'green' | 'blue' | 'secondary' | 'orange'
> = {
  shipped: 'green',
  next: 'blue',
  leave: 'secondary',
  gap: 'orange',
};

const CURRENT: BacklogRow[] = [
  {
    status: 'shipped',
    surface: 'Listen / Discover artists',
    swap: 'CardGrid + Card via DirectoryArtistCardGrid. WidgetCard embeds stay out.',
  },
  {
    status: 'shipped',
    surface: 'Admin / Studio / Library rankings',
    swap: 'TopList. Discover widget rankings stay WidgetTrackRow.',
  },
  {
    status: 'shipped',
    surface: 'Help keyboard shortcuts',
    swap: 'KeyCombo rows. Settings remapping deferred.',
  },
  {
    status: 'shipped',
    surface: 'Track listings first pass',
    swap: 'PlayableTrackContextMenu + StudioSoundRowMenu.',
  },
  {
    status: 'shipped',
    surface: 'Settings Themes',
    swap: 'ThemeController + Toggle; compact ThemeStoreItem.',
  },
  {
    status: 'shipped',
    surface: 'Admin Logs + Activity',
    swap: 'LogViewer. Empty copy and the red warning box still open.',
  },
  {
    status: 'shipped',
    surface: 'Admin Dashboard / Content / Storage KPIs',
    swap: 'StatChip. Governance tiles still hand-rolled.',
  },
  {
    status: 'shipped',
    surface: 'Admin Disco widgets type filter',
    swap: 'FilterChips already.',
  },
  {
    status: 'shipped',
    surface: 'Settings modal footer',
    swap: 'About link removed. /about and Help remain.',
  },
  {
    status: 'shipped',
    surface: 'Radio Browser directory shell',
    swap: 'ConfigurableCard + Browser/Stations. Save → Listen tiles still open.',
  },
];

const NEXT: BacklogRow[] = [
  {
    status: 'next',
    surface: 'Admin Top lists FilterRow',
    swap: 'FilterChips (period, dimension, sort). Same shape as Studio Stats.',
  },
  {
    status: 'next',
    surface: 'Admin Users / Top lists / Storage search',
    swap: 'Input startAddon SearchIcon — drop overlay pl-9.',
  },
  {
    status: 'next',
    surface: 'Moderation Support + Selects archive search',
    swap: 'Move SearchIcon from endAddon to startAddon.',
  },
  {
    status: 'next',
    surface: 'Admin Radio preset Enable/Disable',
    swap: 'Toggle. Storage “Group by user” too.',
  },
  {
    status: 'next',
    surface: 'Admin empty / load-error copy (~25 spots)',
    swap: 'PageEmpty / PageError / EmptyState. Heaviest: Radio ×4, Storage ×5, moderation tabs.',
  },
  {
    status: 'next',
    surface: 'Admin Governance KPI tiles',
    swap: 'StatChip.',
  },
  {
    status: 'next',
    surface: 'Admin Artwork presets grid',
    swap: 'ImageReveal. Leave RadioStationCover hover-replace.',
  },
  {
    status: 'next',
    surface: 'Studio chip / range filters',
    swap: 'FilterChips. See studio-storybook-sweep.md.',
  },
  {
    status: 'next',
    surface: 'Remaining native / overlay Inputs',
    swap: 'Input / Textarea / Select. See input-storybook-sweep.md.',
  },
  {
    status: 'next',
    surface: 'Radio Browser Stations tab',
    swap: 'SaveButton → Listen radio tiles (shell already shipped).',
  },
  {
    status: 'next',
    surface: 'Player bar queue',
    swap: 'Right rail QueuePanel; WaveformSeekbar. Compact viewport still open.',
  },
];

const LEAVE: BacklogRow[] = [
  {
    status: 'leave',
    surface: 'Moderation / Selects / Radio queues',
    swap: 'Dense operational tables. Not TrackTable or CardGrid.',
  },
  {
    status: 'leave',
    surface: 'Admin Map',
    swap: 'ScreenAtlas already. Chrome story added for the wrapped page.',
  },
  {
    status: 'leave',
    surface: 'Grant EUR amounts',
    swap: 'Stay StatNumber / formatted copy.',
  },
  {
    status: 'leave',
    surface: 'Hidden file inputs + hover-replace covers',
    swap: 'Media-upload convention, not FilePicker-for-show.',
  },
  {
    status: 'gap',
    surface: 'Admin Logs warning box',
    swap: 'Needs a shared Alert/Banner primitive before swapping.',
  },
  {
    status: 'gap',
    surface: 'Chip-group vs Tabs',
    swap: 'No SegmentedControl. Label-only groups use FilterChips this pass.',
  },
];

const BacklogTable = ({ rows }: { rows: BacklogRow[] }) => (
  <div className="flex flex-col gap-2">
    {rows.map((row) => (
      <Box
        key={row.surface}
        variant="tertiary"
        shadow="none"
        className="h-auto flex-col gap-2 p-3 sm:flex-row sm:items-start"
      >
        <Badge variant="pill" color={STATUS_COLOR[row.status]} className="w-fit shrink-0">
          {STATUS_LABEL[row.status]}
        </Badge>
        <div className="min-w-0">
          <p className="text-foreground text-sm font-semibold">{row.surface}</p>
          <p className="text-foreground-secondary text-sm">{row.swap}</p>
        </div>
      </Box>
    ))}
  </div>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="flex flex-col gap-3">
    <h2 className="text-foreground text-xl font-bold">{title}</h2>
    {children}
  </section>
);

const StorybookFirstBacklog = () => (
  <div className="mx-auto flex max-w-3xl flex-col gap-10 p-8">
    <header className="flex flex-col gap-3">
      <h1 className="text-foreground text-3xl font-bold">
        Storybook-first backlog
      </h1>
      <p className="text-foreground-secondary text-sm">
        Canonical next-candidate list for tahti-web. Prefer Nuclear primitives
        from Components/*. Admin-specific stories are references, not a second
        design system. Plans live in packages/tahti-web/WORKPLAN.md and
        docs/todo/. This page is the Storybook copy of that list.
      </p>
    </header>

    <Section title="Current situation">
      <BacklogTable rows={CURRENT} />
    </Section>

    <Section title="Next candidates">
      <p className="text-foreground-secondary text-sm">
        Admin sweep first, then the already-planned Studio / Input / Radio
        Browser / Settings About / player-bar queue items.
      </p>
      <BacklogTable rows={NEXT} />
    </Section>

    <Section title="Leave / missing primitives">
      <BacklogTable rows={LEAVE} />
    </Section>
  </div>
);

const meta: Meta<typeof StorybookFirstBacklog> = {
  title: 'Tahti/Reference/Storybook-first backlog',
  component: StorybookFirstBacklog,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Living reference for Storybook-first work. Current situation, next Admin/Studio/Input candidates, and leave/gap items. Details: docs/todo/admin-storybook-sweep.md, studio-storybook-sweep.md, input-storybook-sweep.md.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
