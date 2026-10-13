import { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { DEFAULT_PAGINATION_LABELS, Pagination } from '@tahti-player/ui';

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  args: {
    currentPage: 12,
    totalPages: 24,
    labels: DEFAULT_PAGINATION_LABELS,
    onPageChange: fn(),
  },
  argTypes: {
    labels: { control: false },
    onPageChange: { action: 'page-change' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Page number row with previous/next. Pass labels in the player (i18n); Storybook uses DEFAULT_PAGINATION_LABELS. Renders nothing when totalPages is 1.',
      },
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof Pagination>;

export const Default: Story = {};

export const Interactive: Story = {
  render: () => {
    const [manyPagesCurrent, setManyPagesCurrent] = useState(12);
    const [fewPagesCurrent, setFewPagesCurrent] = useState(2);
    const [wideWindowCurrent, setWideWindowCurrent] = useState(10);

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-foreground text-sm font-semibold">Many pages</h3>
          <Pagination
            currentPage={manyPagesCurrent}
            totalPages={24}
            labels={DEFAULT_PAGINATION_LABELS}
            onPageChange={setManyPagesCurrent}
          />
          <p className="text-foreground/60 text-xs">
            Page {manyPagesCurrent} of 24. Ellipses appear on both sides in the
            middle; walk to page 1 or 24 to see the boundary states.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-foreground text-sm font-semibold">Few pages</h3>
          <Pagination
            currentPage={fewPagesCurrent}
            totalPages={5}
            labels={DEFAULT_PAGINATION_LABELS}
            onPageChange={setFewPagesCurrent}
          />
          <p className="text-foreground/60 text-xs">
            All pages fit, so no ellipsis is ever shown.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-foreground text-sm font-semibold">
            Wider sibling window
          </h3>
          <Pagination
            currentPage={wideWindowCurrent}
            totalPages={20}
            siblingCount={2}
            labels={DEFAULT_PAGINATION_LABELS}
            onPageChange={setWideWindowCurrent}
          />
          <p className="text-foreground/60 text-xs">
            siblingCount 2 keeps two neighbors on each side of the current page.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-foreground text-sm font-semibold">Single page</h3>
          <Pagination
            currentPage={1}
            totalPages={1}
            labels={DEFAULT_PAGINATION_LABELS}
            onPageChange={() => {}}
          />
          <p className="text-foreground/60 text-xs">
            Renders nothing when there is only one page.
          </p>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const navs = canvas.getAllByRole('navigation', {
      name: DEFAULT_PAGINATION_LABELS.navigation,
    });
    // The single-page example renders nothing.
    await expect(navs).toHaveLength(3);

    const few = within(navs[1]!);
    await userEvent.click(
      few.getByRole('button', { name: DEFAULT_PAGINATION_LABELS.previous }),
    );
    await expect(
      few.getByRole('button', { name: DEFAULT_PAGINATION_LABELS.previous }),
    ).toBeDisabled();
    await userEvent.click(
      few.getByRole('button', { name: DEFAULT_PAGINATION_LABELS.next }),
    );
    await expect(
      few.getByRole('button', { name: DEFAULT_PAGINATION_LABELS.previous }),
    ).toBeEnabled();

    const many = within(navs[0]!);
    await userEvent.click(
      many.getByRole('button', { name: DEFAULT_PAGINATION_LABELS.next }),
    );
    await expect(canvas.getByText(/Page 13 of 24/)).toBeVisible();
  },
};
