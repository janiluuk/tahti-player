import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BROWSER_STATIONS_BLOCK_ID,
  useListenerWidgetsStore,
} from '@tahti-web/stores/listenerWidgetsStore';
import { ListenView } from '@tahti-web/views/ListenView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { selectTab } from './_lib/play';

const meta: Meta<typeof ListenView> = {
  title: 'Tahti/Listen/ListenView',
  component: ListenView,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The home Listen page (`/`) with its Listen / Feed / History section tabs. Listen shows Tahti Radio, recently played, internet radio, On air channels, new tracks, listener widgets and the disco widgets; signed-in listeners also get the widget store. The Order toggle in the header shows a drag handle on every section and widget; a widget added from the store goes to the top.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener), withTahtiRouter('/')],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tabs = within(
      await canvas.findByRole('tablist', { name: 'Listen sections' }),
    );

    await step('Listen dashboard sections render', async () => {
      const dashboard = within(await canvas.findByTestId('listen-dashboard'));
      for (const section of ['listen-on-air', 'listen-new-tracks']) {
        const [first] = await dashboard.findAllByTestId(section);
        await expect(first).toBeVisible();
      }
      await expect(
        await dashboard.findByRole('heading', { name: 'New tracks' }),
      ).toBeVisible();
    });

    await step('switch to Feed, History and back', async () => {
      await selectTab(tabs, /Feed/);
      await expect(
        await canvas.findByRole('heading', { level: 1, name: 'Feed' }),
      ).toBeVisible();
      await selectTab(tabs, /History/);
      await expect(
        await canvas.findByRole('heading', { level: 1, name: 'History' }),
      ).toBeVisible();
      await selectTab(tabs, /Listen/);
      await expect(await canvas.findByTestId('listen-dashboard')).toBeVisible();
    });
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null), withTahtiRouter('/')],
};

export const FeedTab: Story = {
  args: { tab: 'feed' },
  decorators: [
    withMockAuth(MOCK_USERS.listener),
    withTahtiRouter('/listen/feed'),
  ],
};

export const HistoryTab: Story = {
  args: { tab: 'history' },
  decorators: [
    withMockAuth(MOCK_USERS.listener),
    withTahtiRouter('/listen/history'),
  ],
};

const resetListenOrder = () => {
  const saved = useListenerWidgetsStore.getState();
  useListenerWidgetsStore.setState({
    listenOrder: [],
    savedBrowserStations: [],
    instances: [],
    installedTypeIds: [],
  });
  return () =>
    useListenerWidgetsStore.setState({
      listenOrder: saved.listenOrder,
      savedBrowserStations: saved.savedBrowserStations,
      instances: saved.instances,
      installedTypeIds: saved.installedTypeIds,
    });
};

const dashboardBlockIds = (canvasElement: HTMLElement) =>
  Array.from(
    canvasElement.querySelectorAll<HTMLElement>(
      '[data-testid="listen-dashboard"] [data-sortable-block]',
    ),
  ).map((node) => node.dataset.sortableBlock);

export const OrderSections: Story = {
  name: 'Order sections (drag handles)',
  decorators: [withMockAuth(MOCK_USERS.listener), withTahtiRouter('/')],
  beforeEach: resetListenOrder,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByTestId('listen-dashboard');
    await expect(
      canvas.queryByRole('button', { name: 'Move Tahti Radio' }),
    ).toBeNull();
    const toggle = canvas.getByRole('button', { name: 'Order sections' });
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    const handle = canvas.getByRole('button', { name: 'Move Tahti Radio' });
    handle.focus();
    const pause = () => new Promise((resolve) => setTimeout(resolve, 100));
    await userEvent.keyboard(' ');
    await pause();
    await userEvent.keyboard('{ArrowDown}');
    await pause();
    await userEvent.keyboard(' ');
    await waitFor(() =>
      expect(dashboardBlockIds(canvasElement).slice(0, 2)).toEqual([
        'selects',
        'tahti-radio',
      ]),
    );
    await expect(useListenerWidgetsStore.getState().listenOrder[0]).toBe(
      'selects',
    );
    await userEvent.click(toggle);
    await expect(
      canvas.queryByRole('button', { name: 'Move Tahti Radio' }),
    ).toBeNull();
  },
};

export const NewWidgetOnTop: Story = {
  name: 'New widget goes to the top',
  decorators: [withMockAuth(MOCK_USERS.listener), withTahtiRouter('/')],
  beforeEach: () => {
    const restore = resetListenOrder();
    useListenerWidgetsStore.getState().addSavedBrowserStation({
      id: 'story-kexp',
      name: 'KEXP',
      streamUrl: 'https://kexp.example/stream',
      country: 'United States',
    });
    return restore;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByTestId('listen-dashboard');
    await expect(dashboardBlockIds(canvasElement)[0]).toBe(
      BROWSER_STATIONS_BLOCK_ID,
    );
    await expect(await canvas.findByText('KEXP')).toBeVisible();
  },
};
