import type { Meta, StoryObj } from '@storybook/react-vite';

import { TahtiLogo, TopBar, TopBarNavigation } from '@tahti-player/ui';

const meta = {
  title: 'Layout/TopBar',
  component: TopBar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'App header under the window TitleBar. Player chrome uses the mark-only TahtiLogo.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithContent: Story = {
  name: 'White theme search bar reference',
  args: {
    children: (
      <div className="ml-4 flex items-center gap-4">
        <TahtiLogo markOnly className="text-sm" />
        <div className="flex gap-2">
          <button className="bg-secondary rounded-md px-2 py-1 text-xs">
            File
          </button>
          <button className="bg-secondary rounded-md px-2 py-1 text-xs">
            Edit
          </button>
          <button className="bg-secondary rounded-md px-2 py-1 text-xs">
            View
          </button>
        </div>
      </div>
    ),
  },
};

export const PlayerHeader: Story = {
  name: 'Player header (Tahti)',
  args: {
    children: (
      <>
        <div className="flex flex-row items-center gap-4">
          <TahtiLogo markOnly className="text-sm" />
          <TopBarNavigation canGoBack canGoForward />
        </div>
        <span className="text-foreground-secondary text-sm">Search</span>
        <div />
      </>
    ),
  },
};

export const CustomClassName: Story = {
  args: {
    className: 'bg-red-500',
    children: <span className="ml-4 text-white">Custom styled TopBar</span>,
  },
};
