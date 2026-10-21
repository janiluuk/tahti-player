import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { showNotificationToast, toast, Toaster } from './Toaster';

describe('Toaster', () => {
  // Sonner removes a closed toast on a 200ms timer; flush it while the
  // Toaster is still mounted, or it fires after jsdom has been torn down.
  afterEach(async () => {
    act(() => {
      toast.dismiss();
    });
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)));
  });

  it('(Snapshot) renders the host', () => {
    const { container } = render(<Toaster />);
    expect(container).toMatchSnapshot();
  });

  it('shows a toast message', async () => {
    render(<Toaster />);
    toast('Saved playlist');
    expect(await screen.findByText('Saved playlist')).toBeInTheDocument();
  });

  it('keeps a sticky toast until it is acknowledged', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Toaster />);
    showNotificationToast('Theme is in review', {
      id: 'sticky-theme',
      description: 'An admin will decide soon.',
      sticky: true,
      actionLabel: 'Acknowledge',
      onAction,
    });

    expect(await screen.findByText('Theme is in review')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Acknowledge' }));
    expect(onAction).toHaveBeenCalledOnce();
  });
});
