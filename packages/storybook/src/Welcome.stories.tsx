import type { Meta, StoryObj } from '@storybook/react-vite';

const Welcome = () => (
  <div className="max-w-2xl p-8">
    <h1 className="text-foreground mb-6 text-4xl font-bold">
      Welcome to Nuclear Storybook
    </h1>
    <p className="text-foreground-secondary mb-4 text-lg">
      Component development environment for Tahti Player and tahti-web. Prefer
      primitives under Components/* before adding a second control.
    </p>
    <p className="text-foreground-secondary mb-2 text-sm">
      Current situation and next Storybook-first candidates (Admin sweep,
      Studio, Inputs, Radio Browser Stations Save, player-bar queue) live on{' '}
      <strong className="text-foreground">
        Tahti / Reference / Storybook-first backlog
      </strong>
      .
    </p>
    <p className="text-foreground-secondary text-sm">
      Admin section stories are under Tahti / Admin. Missing live views added
      2026-09-04: Content, Venues, Artwork presets, Reports, Selects, Orphan
      pages, Map. Grant cycle stays documented-only (`$year` param).
    </p>
  </div>
);

const meta = {
  title: 'Welcome',
  component: Welcome,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Entry page. Next-candidate list: Tahti/Reference/Storybook-first backlog.',
      },
    },
  },
} satisfies Meta<typeof Welcome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
