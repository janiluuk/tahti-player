import type { Meta, StoryObj } from '@storybook/react-vite';
import { LatestNewsWidget } from '@tahti-web/components/LatestNewsWidget';
import { useListenerWidgetsStore } from '@tahti-web/stores/listenerWidgetsStore';
import { expect, userEvent, within } from 'storybook/test';

import { withPageSurface, withTahtiRouter } from './_lib/decorators';

const seedSources = () => {
  useListenerWidgetsStore.setState({
    installedTypeIds: ['news'],
    instances: [
      {
        id: 'djmag',
        typeId: 'news',
        input: 'https://djmag.com/rss.xml',
        label: 'DJ Mag',
        addedAt: '2026-11-01T00:00:00.000Z',
      },
      {
        id: 'cdm',
        typeId: 'news',
        input: 'https://cdm.link/feed/',
        label: 'CDM',
        addedAt: '2026-11-01T00:00:00.000Z',
      },
    ],
  });
};

const meta: Meta<typeof LatestNewsWidget> = {
  title: 'Tahti/Listen/LatestNewsWidget',
  component: LatestNewsWidget,
  args: { surface: 'listen' },
  parameters: {
    docs: {
      description: {
        component:
          'Every News add-on feed on the page merged into one **Latest News** row of `StoryCard`s, newest first (shown on Listen and in Feed). **Sources** adds and removes feeds (suggested DJ and production feeds, or any RSS / Atom URL); **more News** lists every merged headline; a card opens the article in `FeedStoryDialog`.',
      },
    },
  },
  decorators: [
    (Story) => {
      seedSources();
      return <Story />;
    },
    withPageSurface(),
    withTahtiRouter('/'),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cards = await canvas.findAllByTestId('news-story');
    await expect(cards.length).toBeGreaterThan(0);
    await userEvent.click(canvas.getByRole('button', { name: /Sources/ }));
    const body = within(document.body);
    const list = await body.findByRole('list', { name: 'Your sources' });
    await expect(within(list).getByText('DJ Mag')).toBeVisible();
    await expect(within(list).getByText('CDM')).toBeVisible();
  },
};
