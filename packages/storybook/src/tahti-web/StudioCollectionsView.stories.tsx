import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioCollectionsView } from '@tahti-web/views/studio/StudioCollectionsView';
import { expect, userEvent, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';
import { expectVisible, findDialog } from './_lib/play';

const meta: Meta<typeof StudioCollectionsView> = {
  title: 'Tahti/Studio/StudioCollectionsView',
  component: StudioCollectionsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Collections: filter chips by style, search, quick-create dialog, and links into Design / playlist editors.',
      },
    },
  },
  decorators: [
    withTahtiRouter('/studio/collections'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(
      await canvas.findByRole('heading', { name: 'Collections' }),
    );
    await expectVisible(
      await canvas.findByRole('link', { name: 'Midnight Archive' }),
    );
    await expectVisible(canvas.getByRole('link', { name: 'Favorites mix' }));
    await expectVisible(canvas.getByRole('link', { name: 'Short Signals' }));
  },
};

export const FilteredEmpty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('link', { name: 'Midnight Archive' });
    await userEvent.type(
      canvas.getByLabelText('Search collections'),
      'zzzz-no-match',
    );
    await expectVisible(
      await canvas.findByText('No collections match these filters.'),
    );
  },
};

export const QuickCreatePhone: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [
    (Story) => (
      <div className="w-[390px] max-w-full overflow-hidden">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'New collection' }),
    );
    const dialog = await findDialog(canvasElement, 'New collection');
    await expectVisible(dialog.getByLabelText('Title'));
    await expectVisible(dialog.getByLabelText('Collection style'));
    const box = (
      canvasElement.ownerDocument.body.querySelector(
        '[role="dialog"]',
      ) as HTMLElement
    ).getBoundingClientRect();
    await expect(box.width).toBeLessThanOrEqual(390);
  },
};

export const EmptyCatalog: Story = {
  parameters: { mockData: mockData({ studioCollections: () => [] }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(await canvas.findByText('No collections yet'));
  },
};
