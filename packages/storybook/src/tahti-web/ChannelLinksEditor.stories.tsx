import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ChannelLink } from '@tahti-web/api/channel-design';
import { ChannelLinksEditor } from '@tahti-web/components/ChannelLinksEditor';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { DESIGN_LINKS } from './_fixtures/channel-design';

/** Links block editor in the channel layers panel: add, edit, hide and
 * remove outbound links. */
const meta: Meta<typeof ChannelLinksEditor> = {
  title: 'Tahti/Channel/Designer/LinksEditor',
  component: ChannelLinksEditor,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { links: DESIGN_LINKS, onChange: fn() },
  render: function Render(args) {
    const [links, setLinks] = useState<ChannelLink[]>(args.links);
    return (
      <div className="max-w-md">
        <ChannelLinksEditor
          links={links}
          onChange={(next) => {
            setLinks(next);
            args.onChange(next);
          }}
        />
      </div>
    );
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeLinks: Story = {
  name: 'Three links (one hidden)',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByDisplayValue('Bandcamp')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Show link on channel' }),
    ).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(canvas.getByRole('button', { name: 'Add link' }));
    const labels = canvas.getAllByPlaceholderText('Label (e.g. Bandcamp)');
    await expect(labels).toHaveLength(4);
    const urls = canvas.getAllByPlaceholderText('https://…');
    await userEvent.type(labels[3] as HTMLElement, 'Mixcloud');
    await userEvent.type(
      urls[3] as HTMLElement,
      'https://mixcloud.com/northern-lights',
    );
    await expect(args.onChange).toHaveBeenLastCalledWith(
      expect.arrayContaining([
        { label: 'Mixcloud', url: 'https://mixcloud.com/northern-lights' },
      ]),
    );

    const hideButtons = canvas.getAllByRole('button', {
      name: 'Hide link from channel',
    });
    await userEvent.click(hideButtons[0] as HTMLElement);
    await expect(
      canvas.getAllByRole('button', { name: 'Show link on channel' }),
    ).toHaveLength(2);

    await userEvent.click(
      canvas.getAllByRole('button', { name: 'Remove link' })[1] as HTMLElement,
    );
    await expect(canvas.queryByDisplayValue('Instagram')).toBeNull();
  },
};

export const Empty: Story = {
  name: 'No links yet (one blank row)',
  args: { links: [] },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getAllByPlaceholderText('Label (e.g. Bandcamp)'),
    ).toHaveLength(1);
  },
};
