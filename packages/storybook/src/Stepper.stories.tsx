import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { Stepper, type StepperStep } from '@tahti-player/ui';

const STATUS_LABELS = {
  complete: 'Done',
  current: 'Current step',
  upcoming: 'Not started',
  error: 'Needs attention',
};

const GO_LIVE_STEPS: StepperStep[] = [
  { id: 'show', title: 'Show info', status: 'complete', href: '#show' },
  {
    id: 'credentials',
    title: 'Stream credentials',
    status: 'complete',
    href: '#credentials',
  },
  {
    id: 'encoder',
    title: 'Encoder signal',
    caption: 'Waiting for your encoder',
    status: 'current',
    href: '#encoder',
  },
  {
    id: 'recording',
    title: 'Recording',
    caption: 'Optional',
    status: 'upcoming',
    href: '#recording',
  },
  {
    id: 'destinations',
    title: 'Destinations',
    caption: 'YouTube key rejected',
    status: 'error',
    href: '#destinations',
  },
  {
    id: 'green-room',
    title: 'Green room',
    caption: 'Optional',
    status: 'upcoming',
    href: '#green-room',
  },
];

const meta = {
  title: 'Navigation/Stepper',
  component: Stepper,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Vertical list of the steps in a task. Each step is a link (`href`, wrapped by `renderLink`) or a button (`onSelect`) showing its number, a check when complete or an alert when in error, a title and a caption. The current step has `aria-current="step"`; every step’s accessible name ends with its localized status. Below 768px (`collapse="mobile"`) the list folds into one disclosure button.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    steps: GO_LIVE_STEPS,
    statusLabels: STATUS_LABELS,
    'aria-label': 'Go live steps',
    collapse: 'never',
    className: 'max-w-xs',
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GoLive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('list', { name: 'Go live steps' });
    const links = within(list).getAllByRole('link');
    await expect(links).toHaveLength(6);
    await expect(links[0]).toHaveAccessibleName('Show info Done');
    await expect(links[2]).toHaveAttribute('aria-current', 'step');
    await expect(links[2]).toHaveAccessibleName(
      'Encoder signal Waiting for your encoder Current step',
    );
    await expect(links[4]).toHaveAccessibleName(
      'Destinations YouTube key rejected Needs attention',
    );
    for (const link of links) {
      await expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(
        44,
      );
    }
    await userEvent.tab();
    await expect(links[0]).toHaveFocus();
    await expect(getComputedStyle(links[0]!).outlineStyle).toBe('solid');
  },
};

function SelectableStepper(
  props: Omit<ComponentProps<typeof Stepper>, 'onSelect' | 'steps'>,
) {
  const [current, setCurrent] = useState('show');
  const steps = GO_LIVE_STEPS.map((step) => ({
    ...step,
    href: undefined,
    status:
      step.id === current
        ? ('current' as const)
        : step.status === 'current'
          ? ('upcoming' as const)
          : step.status,
  }));
  return <Stepper {...props} steps={steps} onSelect={setCurrent} />;
}

export const Buttons: Story = {
  render: (args) => <SelectableStepper {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^Recording/ }));
    await expect(
      canvas.getByRole('button', { name: /^Recording/ }),
    ).toHaveAttribute('aria-current', 'step');
  },
};

export const Collapsed: Story = {
  args: { collapse: 'always' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', {
      name: 'Step 3 of 6: Encoder signal',
    });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('list')).toBeNull();
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(
      canvas.getByRole('list', { name: 'Go live steps' }),
    ).toBeVisible();
  },
};

export const Mobile: Story = {
  args: { collapse: 'mobile' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
