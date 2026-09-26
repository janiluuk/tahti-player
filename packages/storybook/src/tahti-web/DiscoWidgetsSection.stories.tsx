import type { Meta, StoryObj } from '@storybook/react-vite';
import { DiscoWidgetsSection } from '@tahti-web/components/disco-widgets/DiscoWidgetsSection';

const meta: Meta<typeof DiscoWidgetsSection> = {
  title: 'Tahti/Widgets/DiscoWidgetsSection',
  component: DiscoWidgetsSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Renders every disco-widget a listener, channel, or artist profile has installed, each inside its own sandboxed, cookieless iframe. The iframes below point at a placeholder URL, so they render blank — a real `sandboxUrl` is issued by the disco-widget API for an approved, hosted widget bundle.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Installed: Story = {
  args: {
    widgets: [
      {
        installId: 'install-1',
        widgetSlug: 'live-status',
        name: 'Live status',
        sandboxUrl: 'about:blank',
        version: '1.2.0',
        position: 0,
        config: {},
        context: { channelSlug: 'northern-lights' },
      },
      {
        installId: 'install-2',
        widgetSlug: 'upcoming-shows',
        name: 'Upcoming shows',
        sandboxUrl: 'about:blank',
        version: '1.0.3',
        position: 1,
        config: {},
        context: { channelSlug: 'northern-lights' },
      },
    ],
  },
};

// Renders nothing when nothing is installed — the component's actual,
// intentional empty behavior (returns null).
export const Empty: Story = {
  args: { widgets: [] },
};

export const LoadFailed: Story = {
  args: { widgets: [], status: 'error', onRetry: () => undefined },
};
