// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Stepper, type StepperStep } from './Stepper';

const STATUS_LABELS = {
  complete: 'Done',
  current: 'Current step',
  upcoming: 'Not started',
  error: 'Needs attention',
};

const STEPS: StepperStep[] = [
  { id: 'show', title: 'Show info', status: 'complete', href: '/go?step=show' },
  {
    id: 'encoder',
    title: 'Encoder signal',
    caption: 'Waiting for signal',
    status: 'current',
    href: '/go?step=encoder',
  },
  {
    id: 'recording',
    title: 'Recording',
    caption: 'Optional',
    status: 'upcoming',
    href: '/go?step=recording',
  },
  {
    id: 'destinations',
    title: 'Destinations',
    caption: 'Key rejected',
    status: 'error',
    href: '/go?step=destinations',
  },
];

describe('Stepper', () => {
  afterEach(cleanup);

  it('renders an ordered list of links named with their status', () => {
    render(
      <Stepper
        steps={STEPS}
        statusLabels={STATUS_LABELS}
        aria-label="Go live steps"
        collapse="never"
      />,
    );
    const list = screen.getByRole('list', { name: 'Go live steps' });
    expect(list.tagName).toBe('OL');
    const links = within(list).getAllByRole('link');
    expect(links).toHaveLength(4);
    expect(links[0]).toHaveAccessibleName('Show info Done');
    expect(links[1]).toHaveAccessibleName(
      'Encoder signal Waiting for signal Current step',
    );
    expect(links[2]).toHaveAccessibleName('Recording Optional Not started');
    expect(links[3]).toHaveAccessibleName(
      'Destinations Key rejected Needs attention',
    );
    expect(links[1]).toHaveAttribute('href', '/go?step=encoder');
  });

  it('marks only the current step with aria-current="step"', () => {
    render(
      <Stepper
        steps={STEPS}
        statusLabels={STATUS_LABELS}
        aria-label="Go live steps"
        collapse="never"
      />,
    );
    const current = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'step');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute('href', '/go?step=encoder');
  });

  it('renders buttons that report the step id when steps have no href', () => {
    const onSelect = vi.fn();
    render(
      <Stepper
        steps={STEPS.map((step) => ({ ...step, href: undefined }))}
        statusLabels={STATUS_LABELS}
        aria-label="Go live steps"
        onSelect={onSelect}
        collapse="never"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /^Recording/ }));
    expect(onSelect).toHaveBeenCalledWith('recording');
  });

  it('wraps links with renderLink', () => {
    render(
      <Stepper
        steps={STEPS}
        statusLabels={STATUS_LABELS}
        aria-label="Go live steps"
        collapse="never"
        renderLink={({ href, children, ...rest }) => (
          <a data-router-link href={`/app${href}`} {...rest}>
            {children}
          </a>
        )}
      />,
    );
    const link = screen.getByRole('link', { name: /^Show info/ });
    expect(link).toHaveAttribute('href', '/app/go?step=show');
    expect(link).toHaveAttribute('data-router-link');
  });

  it('folds into a disclosure naming the current step', () => {
    render(
      <Stepper
        steps={STEPS}
        statusLabels={STATUS_LABELS}
        aria-label="Go live steps"
        collapse="always"
      />,
    );
    const toggle = screen.getByRole('button', {
      name: 'Step 2 of 4: Encoder signal',
    });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const list = document.getElementById(
      toggle.getAttribute('aria-controls')!,
    )!;
    expect(list).toHaveClass('hidden');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(list).not.toHaveClass('hidden');
  });

  it('uses the caller’s collapsed label', () => {
    render(
      <Stepper
        steps={STEPS}
        statusLabels={STATUS_LABELS}
        aria-label="Go live steps"
        collapse="always"
        collapsedLabel={(position, total, title) =>
          `Vaihe ${position}/${total}: ${title}`
        }
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Vaihe 2/4: Encoder signal' }),
    ).toBeInTheDocument();
  });

  it('keeps the list visible from md up in mobile mode', () => {
    render(
      <Stepper
        steps={STEPS}
        statusLabels={STATUS_LABELS}
        aria-label="Go live steps"
      />,
    );
    expect(screen.getByRole('button', { name: /^Step 2 of 4/ })).toHaveClass(
      'md:hidden',
    );
    expect(screen.getByRole('list', { hidden: true })).toHaveClass('md:flex');
  });
});
