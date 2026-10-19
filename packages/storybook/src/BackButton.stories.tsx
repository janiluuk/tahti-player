import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { BackButton, BackButtonAnchor } from '@tahti-player/ui';

const meta = {
  title: 'Components/BackButton',
  component: BackButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Universal round translucent back control for detail pages (channel, radio station, library chrome, full-screen player). Uses theme `background`/`foreground` so the frosted disc stays readable on light and dark themes. Use `BackButton` for history.back / onClick, `BackButtonLink` / `BackButtonAnchor` for routed links. `direction="forward"` mirrors the top-nav forward control.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BackButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Go back' });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Forward: Story = {
  args: {
    direction: 'forward',
    onClick: fn(),
  },
};

export const OnMediaBackdrop: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Frosted disc over a dark hero / visualizer strip — same tokens as chrome, so themes stay consistent.',
      },
    },
  },
  render: (args) => (
    <div className="relative flex h-40 w-72 items-start justify-start overflow-hidden rounded-xl bg-gradient-to-br from-teal-900 to-black p-4">
      <BackButton {...args} />
    </div>
  ),
  args: {
    onClick: fn(),
    'aria-label': 'Back to Listen',
  },
};

export const AsLink: Story = {
  render: () => <BackButtonAnchor href="#radio" aria-label="Back to radio" />,
};

export const PairInChrome: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Top-nav history pair: back + forward at the same large size.',
      },
    },
  },
  render: () => (
    <div className="bg-background-secondary border-border flex items-center gap-1 rounded-lg border p-2">
      <BackButton aria-label="Go back" onClick={fn()} />
      <BackButton direction="forward" aria-label="Go forward" onClick={fn()} />
    </div>
  ),
};
