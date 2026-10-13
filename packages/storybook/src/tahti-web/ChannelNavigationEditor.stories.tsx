import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelNavigationEditor } from '@tahti-web/components/ChannelNavigationEditor';
import type { ChannelNavigationTab } from '@tahti-web/lib/channelPageLayout';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

const CANDIDATES = [
  { id: 'sound', label: 'Tracks' },
  { id: 'events', label: 'Upcoming shows' },
  { id: 'playlist-favorites-vault', label: 'favorites-vault' },
  { id: 'feed', label: 'Feed' },
];

const TABS: ChannelNavigationTab[] = [
  { id: 'tab-stage', label: 'Stage', itemIds: ['sound', 'events'] },
  { id: 'tab-music', label: 'Music', itemIds: ['playlist-favorites-vault'] },
];

/** Navigation block editor: which tabs the channel page shows and which
 * blocks sit under each one. */
const meta: Meta<typeof ChannelNavigationEditor> = {
  title: 'Tahti/Channel/Designer/NavigationEditor',
  component: ChannelNavigationEditor,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { tabs: TABS, candidateItems: CANDIDATES, onChange: fn() },
  render: function Render(args) {
    const [tabs, setTabs] = useState<ChannelNavigationTab[]>(args.tabs);
    return (
      <div className="max-w-md">
        <ChannelNavigationEditor
          tabs={tabs}
          candidateItems={args.candidateItems}
          onChange={(next) => {
            setTabs(next);
            args.onChange(next);
          }}
        />
      </div>
    );
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoTabs: Story = {
  name: 'Two tabs',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Pick which sections appear/)).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Add tab' }));
    const label = canvas.getByPlaceholderText('Tab 3 label (e.g. Releases)');
    await userEvent.type(label, 'Updates');
    const updates = canvas.getByRole('group', {
      name: 'Sections shown under Updates',
    });
    await userEvent.click(
      within(updates).getByRole('checkbox', { name: 'Feed' }),
    );
    await expect(
      within(updates).getByRole('checkbox', { name: 'Feed' }),
    ).toHaveAttribute('aria-checked', 'true');
    await expect(args.onChange).toHaveBeenLastCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Updates', itemIds: ['feed'] }),
      ]),
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Remove Music' }));
    await expect(canvas.queryByDisplayValue('Music')).toBeNull();
  },
};

export const SingleTab: Story = {
  name: 'One tab (tab bar hidden)',
  args: { tabs: TABS.slice(0, 1) },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText(/only shows once there's a second tab/),
    ).toBeVisible();
  },
};

export const NoCandidates: Story = {
  name: 'No other blocks to assign',
  args: { candidateItems: [] },
};
