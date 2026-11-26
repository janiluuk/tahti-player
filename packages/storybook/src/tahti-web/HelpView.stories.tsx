import type { Meta, StoryObj } from '@storybook/react-vite';
import { HelpArticleView, HelpHubView } from '@tahti-web/views/HelpView';
import { expect, within } from 'storybook/test';

import {
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';

const meta: Meta = {
  title: 'Tahti/Reference/Help center',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Help hub and article surfaces. Cards and panels use shared `Box`, `Badge`, `Button`, `Input`, `Tabs`, `SectionShell`, and `EmptyState` so Storybook and the live `/help` route share the same primitives.',
      },
    },
  },
  decorators: [withMockAuth(), withPageSurface()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Hub: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Lives on `/help`. Documents library, quick starts, and searchable guide index.',
      },
    },
  },
  decorators: [withTahtiRouter('/help')],
  render: () => <HelpHubView />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = await canvas.findByRole('heading', {
      name: 'How can we help?',
    });
    await expect(heading.parentElement?.querySelector('p')).toBeNull();
    await expect(canvas.queryByText(/Short guides for listening/)).toBeNull();
    await expect(
      canvas.getByRole('searchbox', { name: 'Search help guides' }),
    ).toBeVisible();
    await expect(canvas.getByTestId('help-guide-index')).toBeVisible();
  },
};

export const ArtistGuide: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Lives on `/help/for-artists`. Includes gallery upload/reorder guidance.',
      },
    },
  },
  decorators: [withTahtiRouter('/help/for-artists')],
  render: () => <HelpArticleView slug="for-artists" />,
};

export const GettingAround: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Lives on `/help/getting-around`. Navigation map for Listen, Favorites, Library, Studio, Help, and Settings.',
      },
    },
  },
  decorators: [withTahtiRouter('/help/getting-around')],
  render: () => <HelpArticleView slug="getting-around" />,
};

export const Support: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Lives on `/help/support`. Includes the support contact form.',
      },
    },
  },
  decorators: [withTahtiRouter('/help/support')],
  render: () => <HelpArticleView slug="support" />,
};

export const KeyboardNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Lives on `/help/keyboard-shortcuts`. Bindings use Storybook `KeyCombo` rows (same shape as Components/KeyCombo). Linked from the Help hub quick starts.',
      },
    },
  },
  decorators: [withTahtiRouter('/help/keyboard-shortcuts')],
  render: () => <HelpArticleView slug="keyboard-shortcuts" />,
};
