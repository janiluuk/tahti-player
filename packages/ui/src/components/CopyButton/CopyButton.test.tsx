import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';

import { CopyButton } from './CopyButton';

describe('CopyButton', () => {
  it('(Snapshot) renders default state', () => {
    const { container } = render(<CopyButton text="hello" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('copies text to clipboard when clicked', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(() => Promise.resolve());
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);

    render(<CopyButton text="copy me" data-testid="copy-btn" />);

    await user.click(screen.getByTestId('copy-btn'));

    expect(writeText).toHaveBeenCalledWith('copy me');
  });

  it('switches to check icon after copying', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();

    render(<CopyButton text="copy me" data-testid="copy-btn" />);

    const button = screen.getByTestId('copy-btn');
    const iconBefore = button.querySelector('svg')!.innerHTML;

    await user.click(button);

    const iconAfter = button.querySelector('svg')!.innerHTML;
    expect(iconAfter).not.toBe(iconBefore);
  });

  it('renders a visible label and swaps it to "Copied" after copying', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();

    render(<CopyButton text="copy me" label="Share" data-testid="copy-btn" />);

    const button = screen.getByTestId('copy-btn');
    expect(button).toHaveTextContent('Share');

    await user.click(button);

    expect(button).toHaveTextContent('Copied');
  });

  it('shows an error toast and does not enter the copied state when the clipboard write fails', async () => {
    const errorSpy = vi.spyOn(toast, 'error').mockImplementation(() => '');
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new Error('denied'),
    );

    render(<CopyButton text="copy me" data-testid="copy-btn" />);
    await user.click(screen.getByTestId('copy-btn'));

    expect(errorSpy).toHaveBeenCalled();
  });
});
