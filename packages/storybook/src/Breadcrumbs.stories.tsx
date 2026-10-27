import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import {
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
} from '@tahti-player/ui';

import {
  storyRouterSettled,
  withTahtiRouter,
} from './tahti-web/_lib/decorators';

const meta: Meta<typeof Breadcrumbs> = {
  title: 'Components/Breadcrumbs',
  component: Breadcrumbs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Trail of ancestor pages above a page title. Ancestors are `BreadcrumbLink` (router) or `BreadcrumbAnchor` (plain `<a>`); the last item is `BreadcrumbCurrent`. Separators are added automatically and empty children are skipped.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/')],
};

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {
  render: () => (
    <Breadcrumbs>
      <BreadcrumbLink to="/">Admin</BreadcrumbLink>
      <BreadcrumbLink to="/">Governance</BreadcrumbLink>
      <BreadcrumbLink to="/">Grants</BreadcrumbLink>
      <BreadcrumbCurrent>2026</BreadcrumbCurrent>
    </Breadcrumbs>
  ),
  play: async ({ canvasElement }) => {
    await storyRouterSettled();
    const nav = within(canvasElement).getByRole('navigation', {
      name: 'Breadcrumb',
    });
    await expect(within(nav).getAllByRole('link')).toHaveLength(3);
    await expect(within(nav).getByText('2026')).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};

export const TwoLevels: Story = {
  render: () => (
    <Breadcrumbs>
      <BreadcrumbLink to="/">Admin</BreadcrumbLink>
      <BreadcrumbCurrent>Moderation</BreadcrumbCurrent>
    </Breadcrumbs>
  ),
};
