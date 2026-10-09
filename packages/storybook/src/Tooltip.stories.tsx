import { Meta, StoryObj } from '@storybook/react-vite';
import {
  BlocksIcon,
  PaletteIcon,
  ScrollTextIcon,
  SettingsIcon,
} from 'lucide-react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button, Tooltip } from '@tahti-player/ui';

import { withinBody } from './tahti-web/_lib/play';

const meta: Meta<typeof Tooltip> = {
  title: 'Components/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Hover/focus label. Every icon-only Button (size icon / icon-sm) in the player and tahti-web must wrap Tooltip — native title= is not enough; keep aria-label. Reference: SidebarIcons. Sweep list: docs/todo/icon-button-tooltips.md (288 missing as of 2026-09-04). Form “?” help badges are a separate sweep.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<Meta<typeof Tooltip>>;

export const AllSides: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-16 p-20">
      <Tooltip content="Top tooltip" side="top">
        <Button>Top</Button>
      </Tooltip>

      <div className="flex items-center gap-24">
        <Tooltip content="Left tooltip" side="left">
          <Button>Left</Button>
        </Tooltip>
        <Tooltip content="Right tooltip (default)" side="right">
          <Button>Right</Button>
        </Tooltip>
      </div>

      <Tooltip content="Bottom tooltip" side="bottom">
        <Button>Bottom</Button>
      </Tooltip>
    </div>
  ),
};

export const SidebarIcons: Story = {
  render: () => (
    <div className="bg-background-secondary flex flex-col items-center gap-2 rounded-md p-2">
      <Tooltip content="Settings" side="right">
        <Button variant="text" size="icon" aria-label="Settings">
          <SettingsIcon />
        </Button>
      </Tooltip>
      <Tooltip content="Plugins" side="right">
        <Button variant="text" size="icon" aria-label="Plugins">
          <BlocksIcon />
        </Button>
      </Tooltip>
      <Tooltip content="Themes" side="right">
        <Button variant="text" size="icon" aria-label="Themes">
          <PaletteIcon />
        </Button>
      </Tooltip>
      <Tooltip content="Logs" side="right">
        <Button variant="text" size="icon" aria-label="Logs">
          <ScrollTextIcon />
        </Button>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = withinBody(canvasElement);
    await expect(body.queryByRole('tooltip')).toBeNull();

    await userEvent.hover(canvas.getByRole('button', { name: 'Plugins' }));
    await expect(await body.findByRole('tooltip')).toHaveTextContent('Plugins');
    await userEvent.unhover(canvas.getByRole('button', { name: 'Plugins' }));
    await waitFor(() => expect(body.queryByRole('tooltip')).toBeNull());

    // Keyboard focus opens it too, not just the mouse.
    canvas.getByRole('button', { name: 'Logs' }).focus();
    await expect(await body.findByRole('tooltip')).toHaveTextContent('Logs');
    canvas.getByRole('button', { name: 'Logs' }).blur();
    await waitFor(() => expect(body.queryByRole('tooltip')).toBeNull());
  },
};

export const WithReactNodeContent: Story = {
  render: () => (
    <div className="p-20">
      <Tooltip
        content={
          <span className="flex items-center gap-2">
            <SettingsIcon size={14} />
            Settings
          </span>
        }
        side="right"
      >
        <Button variant="text" size="icon" aria-label="Settings">
          <SettingsIcon />
        </Button>
      </Tooltip>
    </div>
  ),
};
