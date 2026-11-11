import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { NavLinks } from '@tahti-player/ui';

import { withTahtiRouter } from './tahti-web/_lib/decorators';

const STUDIO = [
  { id: 'home', to: '/studio', label: 'Home' },
  { id: 'music', to: '/studio/releases', label: 'Music' },
  {
    id: 'broadcast',
    to: '/studio/broadcast',
    label: 'Broadcast',
    active: true,
  },
  { id: 'fans', to: '/studio/fans', label: 'Fans' },
  { id: 'stats', to: '/studio/stats', label: 'Stats' },
  { id: 'profile', to: '/studio/profile', label: 'Profile' },
];

const BROADCAST = [
  { id: 'go-live', to: '/studio/go-live', label: 'Go live' },
  { id: 'schedule', to: '/studio/schedule', label: 'Schedule', active: true },
  { id: 'shows', to: '/studio/shows', label: 'Shows' },
  { id: 'channel', to: '/studio/channel', label: 'Channel' },
];

const meta = {
  title: 'Navigation/NavLinks',
  component: NavLinks,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Route navigation as links with `aria-current="page"` on the current one. `underline` for a section\'s top-level pages, `fill` (quiet control-surface chip) one level down. Use `Tabs` for in-page panels.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/studio/schedule')],
} satisfies Meta<typeof NavLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Underline: Story = {
  args: { 'aria-label': 'Studio pages', items: STUDIO },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('navigation', { name: 'Studio pages' }),
    ).toBeVisible();
    await expect(canvas.queryByRole('tab')).toBeNull();
    const current = canvas.getByRole('link', { name: 'Broadcast' });
    await expect(current).toHaveAttribute('aria-current', 'page');
    await expect(current).toHaveClass('border-foreground', 'font-semibold');
    await expect(current).not.toHaveClass('bg-primary');
    await expect(canvas.getByRole('link', { name: 'Music' })).toHaveClass(
      'text-foreground-secondary',
    );
  },
};

export const Fill: Story = {
  args: { 'aria-label': 'Broadcast pages', variant: 'fill', items: BROADCAST },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const current = canvas.getByRole('link', { name: 'Schedule' });
    await expect(current).toHaveAttribute('aria-current', 'page');
    await expect(current).toHaveClass('bg-background-input');
    await expect(current).not.toHaveClass('bg-primary');
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Go live' })).toHaveFocus();
    await expect(canvas.getByRole('link', { name: 'Go live' })).toHaveClass(
      'focus-visible:outline-focus-ring',
    );
  },
};

/** Two levels together, as on a Studio → Broadcast page. */
export const TwoLevels: Story = {
  args: { 'aria-label': 'Studio pages', items: STUDIO },
  render: () => (
    <div className="flex max-w-3xl flex-col gap-3">
      <NavLinks aria-label="Studio pages" items={STUDIO} />
      <NavLinks aria-label="Broadcast pages" variant="fill" items={BROADCAST} />
    </div>
  ),
};

export const PhoneOverflow: Story = {
  args: { 'aria-label': 'Studio pages', items: STUDIO },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => (
    <div className="w-[300px]">
      <NavLinks aria-label="Studio pages" items={STUDIO} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const current = within(canvasElement).getByRole('link', {
      name: 'Broadcast',
    });
    await expect(current).toHaveAttribute('aria-current', 'page');
  },
};
