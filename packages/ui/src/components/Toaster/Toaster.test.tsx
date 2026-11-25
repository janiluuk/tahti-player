import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { defaultUiLabels, UiLabelsProvider } from '../UiLabels';
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

  it('names the region and the close button from the UI labels', async () => {
    render(
      <UiLabelsProvider
        value={{
          ...defaultUiLabels,
          notifications: 'Ilmoitukset',
          close: 'Sulje',
        }}
      >
        <Toaster closeButton />
      </UiLabelsProvider>,
    );
    toast('Tallennettu');
    expect(
      await screen.findByRole('region', { name: /^Ilmoitukset/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sulje' })).toBeInTheDocument();
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

  it('offers a link beside the action that leaves a sticky toast up', async () => {
    const user = userEvent.setup();
    render(<Toaster />);
    showNotificationToast('Guidelines updated', {
      id: 'sticky-guidelines',
      sticky: true,
      actionLabel: 'Acknowledge',
      onAction: vi.fn(),
      link: { label: 'Read guidelines', href: '#guidelines' },
    });

    const link = await screen.findByRole('link', { name: 'Read guidelines' });
    expect(link).toHaveAttribute('href', '#guidelines');
    await user.click(link);
    expect(screen.getByText('Guidelines updated')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acknowledge' })).toBeVisible();
  });
});
