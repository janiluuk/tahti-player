import type { Meta, StoryObj } from '@storybook/react-vite';
import { DiscoWidgetManagerPanel } from '@tahti-web/components/disco-widgets/DiscoWidgetManagerPanel';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof DiscoWidgetManagerPanel> = {
  title: 'Tahti/Widgets/DiscoWidgetManagerPanel',
  component: DiscoWidgetManagerPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Install/reorder/remove UI for disco-widgets, scoped to a listener account or an artist channel. The store list and install list both come from the live API; without a backend this renders its honest empty state rather than fake fixtures.',
      },
    },
  },
  decorators: [withTahtiRouter('/studio'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ArtistScope: Story = {
  args: {
    scope: 'ARTIST',
    description:
      'Add-ons shown on your public channel page, alongside the audience.',
  },
};

// Nothing installed: Browse add-ons jumps to the store search.
export const ListenerScope: Story = {
  args: {
    scope: 'LISTENER',
    description: 'Add-ons shown on your Listen page.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Browse add-ons' }),
    );
    await waitFor(() =>
      expect(
        canvas.getByRole('searchbox', { name: 'Search Disco-widgets' }),
      ).toHaveFocus(),
    );
  },
};

export const ListenerCompactStore: Story = {
  args: {
    scope: 'LISTENER',
    compact: true,
    description:
      'The Listen-page add-widget dialog uses this compact store layout and the same installed-widget configuration controls.',
  },
};
