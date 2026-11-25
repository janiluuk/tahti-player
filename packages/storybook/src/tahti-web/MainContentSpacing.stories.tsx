import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  MAIN_CONTENT_PADDING,
  MAIN_PANE_INSET,
  MAIN_SCROLL_BOTTOM_INSET,
  MAIN_SCROLLPORT_SHADOW_ROOM,
} from '@tahti-web/layout/contentPadding';
import { MoreHorizontalIcon } from 'lucide-react';
import { expect, userEvent, within } from 'storybook/test';

import {
  BackButton,
  backButtonCornerClassName,
  Button,
  cn,
  ViewShell,
} from '@tahti-player/ui';

const meta = {
  title: 'Tahti/Layout/MainContentSpacing',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function CornerContent() {
  return (
    <ViewShell
      title="Corner controls"
      subtitle="Page actions keep their focus rings and shadows inside the main pane."
      corner={
        <div className={backButtonCornerClassName}>
          <BackButton aria-label="Back to previous page" />
        </div>
      }
      actions={
        <Button size="icon" variant="secondary" aria-label="More actions">
          <MoreHorizontalIcon aria-hidden />
        </Button>
      }
      classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
    >
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="border-border bg-background-secondary rounded-lg border p-4"
        >
          Content row {index + 1}
        </div>
      ))}
    </ViewShell>
  );
}

async function expectControlsInsidePane(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const pane = canvas.getByTestId('main-pane').getBoundingClientRect();
  const back = canvas.getByRole('button', { name: 'Back to previous page' });
  const more = canvas.getByRole('button', { name: 'More actions' });

  await userEvent.click(back);
  await expect(back).toHaveFocus();
  await userEvent.click(more);
  await expect(more).toHaveFocus();

  for (const control of [back, more]) {
    const bounds = control.getBoundingClientRect();
    await expect(bounds.left).toBeGreaterThanOrEqual(pane.left);
    await expect(bounds.top).toBeGreaterThanOrEqual(pane.top);
    await expect(bounds.right).toBeLessThanOrEqual(pane.right);
    await expect(bounds.bottom).toBeLessThanOrEqual(pane.bottom);
  }
}

export const Desktop: Story = {
  render: () => (
    <div className="bg-background-secondary h-[32rem] p-3">
      <main
        data-testid="main-pane"
        className={cn(
          'bg-background h-full min-w-0 overflow-hidden rounded-xl border',
          MAIN_PANE_INSET,
        )}
      >
        <div
          className={cn(
            'h-full min-w-0 overflow-x-hidden overflow-y-auto',
            MAIN_SCROLLPORT_SHADOW_ROOM,
            MAIN_SCROLL_BOTTOM_INSET,
          )}
        >
          <CornerContent />
        </div>
      </main>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expectControlsInsidePane(canvasElement);
  },
};

export const Phone: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  render: () => (
    <main
      data-testid="main-pane"
      className={cn(
        'bg-background h-[32rem] min-w-0 overflow-x-hidden overflow-y-auto',
        MAIN_CONTENT_PADDING,
      )}
    >
      <CornerContent />
    </main>
  ),
  play: async ({ canvasElement }) => {
    await expectControlsInsidePane(canvasElement);
  },
};
