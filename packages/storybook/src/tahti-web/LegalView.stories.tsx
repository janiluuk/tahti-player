import type { Meta, StoryObj } from '@storybook/react-vite';
import { LegalView } from '@tahti-web/views/LegalView';
import { expect, waitFor, within } from 'storybook/test';

import {
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { stubPhoneViewport } from './_lib/phone';

const meta: Meta<typeof LegalView> = {
  title: 'Tahti/Reference/LegalView',
  component: LegalView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Static info pages from `content/legal.ts`: `/about` and `/how-it-works`. An unknown slug renders the not-found empty state.',
      },
    },
  },
  args: { slug: 'about' },
  decorators: [withMockAuth(), withPageSurface(), withTahtiRouter('/about')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const About: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'About Tahti', level: 1 }),
      ).toBeVisible(),
    );
    const article = canvas.getByRole('article');
    await expect(article).toBeVisible();
    await expect(
      within(article).getByRole('link', { name: 'Terms of service' }),
    ).toBeVisible();
    await expect(
      within(
        canvas.getByRole('navigation', { name: 'About and legal' }),
      ).getByRole('link', { name: 'Terms of service' }),
    ).toBeVisible();
  },
};

export const HowItWorks: Story = {
  args: { slug: 'how-it-works' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'How Tahti works', level: 1 }),
      ).toBeVisible(),
    );
    await expect(
      within(canvas.getByRole('article')).getByRole('heading', {
        name: 'For listeners',
        level: 2,
      }),
    ).toBeVisible();
  },
};

export const Phone: Story = {
  args: { slug: 'how-it-works' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  beforeEach: stubPhoneViewport,
  decorators: [
    (Story) => (
      <div className="w-full max-w-[358px]">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'How Tahti works', level: 1 }),
      ).toBeVisible(),
    );
    const article = canvas.getByRole('article');
    await expect(article.scrollWidth).toBeLessThanOrEqual(
      article.clientWidth + 1,
    );
  },
};

export const UnknownSlug: Story = {
  args: { slug: 'no-such-page' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByRole('heading', { level: 1 })).toBeVisible(),
    );
    await expect(canvas.queryByRole('article')).toBeNull();
  },
};
