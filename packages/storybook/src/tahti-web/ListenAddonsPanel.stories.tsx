import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListenAddonsPanel } from '@tahti-web/components/ListenAddonsPanel';
import { useListenerWidgetsStore } from '@tahti-web/stores/listenerWidgetsStore';
import { expect, userEvent, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof ListenAddonsPanel> = {
  title: 'Tahti/Widgets/ListenAddonsPanel',
  component: ListenAddonsPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Favorites plus SoundCloud, Spotify, YouTube, hearthis.at, and Bandcamp — the same Listen catalog as Settings → Add-ons. The Listen-page add-widget dialog uses the compact available-first layout.',
      },
    },
  },
  decorators: [withTahtiRouter('/'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const StoreCategory: Story = {};

// Nothing installed: Browse add-ons switches to the Available tab.
export const NothingInstalled: Story = {
  beforeEach: () => {
    const previous = useListenerWidgetsStore.getState();
    useListenerWidgetsStore.setState({ installedTypeIds: [], instances: [] });
    return () => {
      useListenerWidgetsStore.setState({
        installedTypeIds: previous.installedTypeIds,
        instances: previous.instances,
      });
    };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Browse add-ons' }),
    );
    await expect(
      canvas.getByRole('tab', { name: /Available/ }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(
      canvas.queryByRole('button', { name: 'Browse add-ons' }),
    ).toBeNull();
  },
};

export const AddWidgetPicker: Story = {
  args: {
    initialTab: 'available',
    compact: true,
  },
};
