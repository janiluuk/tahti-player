import type { Meta, StoryObj } from '@storybook/react-vite';

import { PlayerShell } from '@tahti-player/ui';

const meta = {
  title: 'Components/PlayerShell',
  component: PlayerShell,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PlayerShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three rows: top bar, scrolling workspace, bottom player bar. */
export const Default: Story = {
  render: () => (
    <PlayerShell className="h-[28rem] w-full">
      <div className="bg-background-secondary border-border border-b px-4 py-3 text-sm font-semibold">
        Top bar
      </div>
      <div className="overflow-auto p-4 text-sm">
        {Array.from({ length: 30 }, (_, i) => (
          <p key={i} className="text-foreground-secondary py-1">
            Workspace row {i + 1}
          </p>
        ))}
      </div>
      <div className="bg-background-secondary border-border border-t px-4 py-3 text-sm">
        Player bar
      </div>
    </PlayerShell>
  ),
};
