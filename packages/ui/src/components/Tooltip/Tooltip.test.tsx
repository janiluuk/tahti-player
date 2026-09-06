import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tooltip } from './Tooltip';

function mockPointerFine(matches: boolean) {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    matches: query === '(pointer: coarse)' ? matches : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

describe('Tooltip', () => {
  it('(Snapshot) renders children without tooltip visible', () => {
    const { asFragment } = render(
      <Tooltip content="Hello">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('shows tooltip on hover and hides on unhover', async () => {
    render(
      <Tooltip content="Settings">
        <button>Hover me</button>
      </Tooltip>,
    );

    await userEvent.hover(screen.getByText('Hover me'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Settings');

    await userEvent.unhover(screen.getByText('Hover me'));
    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  it('does not show tooltip when disabled', async () => {
    render(
      <Tooltip content="Settings" disabled>
        <button>Hover me</button>
      </Tooltip>,
    );

    await userEvent.hover(screen.getByText('Hover me'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('never shows on coarse-pointer (touch) devices, even on tap-triggered focus', async () => {
    const restore = mockPointerFine(true);
    try {
      render(
        <Tooltip content="Settings">
          <button>Tap me</button>
        </Tooltip>,
      );

      const button = screen.getByText('Tap me');
      await userEvent.hover(button);
      button.focus();
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it('renders ReactNode content', async () => {
    render(
      <Tooltip content={<span data-testid="custom-content">Custom</span>}>
        <button>Hover me</button>
      </Tooltip>,
    );

    await userEvent.hover(screen.getByText('Hover me'));
    expect(await screen.findByTestId('custom-content')).toBeInTheDocument();
  });
});
