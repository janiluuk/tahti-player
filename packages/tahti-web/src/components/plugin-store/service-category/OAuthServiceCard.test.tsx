import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ServiceAction, ServicePlugin } from '../serviceCatalog';
import { OAuthServiceCard } from './OAuthServiceCard';

const { toast, adapter } = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn() },
  adapter: {
    id: 'bandcamp',
    oauthUrl: '/oauth',
    checkStatus: vi.fn(),
    disconnect: vi.fn(),
    listAlbums: vi.fn(),
    importAlbum: vi.fn(),
  },
}));

vi.mock('sonner', () => ({ toast, Toaster: () => null }));
vi.mock('../../../plugins/import-sources', () => ({
  oauthAdapterFor: () => adapter,
}));
vi.mock('../../../api/studio-extras', () => ({
  fetchMeProfile: vi.fn(),
  patchMeProfile: vi.fn(),
}));

const plugin = {
  id: 'bandcamp',
  name: 'Bandcamp',
  author: 'Tahti',
  description: '',
} as unknown as ServicePlugin;
const action = {
  kind: 'oauth',
  integrationId: 'bandcamp',
  oauthPath: '/x',
} as unknown as Extract<ServiceAction, { kind: 'oauth' }>;

const albums = [
  { id: 'a1', title: 'One' },
  { id: 'a2', title: 'Two' },
];

const open = async () => {
  const gears = await screen.findAllByRole('button', { name: 'Configure' });
  fireEvent.click(gears[gears.length - 1]!);
};

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  adapter.checkStatus.mockResolvedValue({
    data: { connected: true, username: 'me' },
  });
  adapter.listAlbums.mockResolvedValue({ data: albums });
});

describe('OAuthServiceCard', () => {
  it('shows a message when the album list fails to load', async () => {
    adapter.listAlbums.mockRejectedValue(new Error('down'));
    render(<OAuthServiceCard plugin={plugin} action={action} />);
    await open();
    expect(
      await screen.findByText('Could not load your Bandcamp releases.'),
    ).toBeTruthy();
  });

  it('disables every album import while one runs and toasts the result', async () => {
    let finish: (v: unknown) => void = () => {};
    adapter.importAlbum.mockReturnValue(
      new Promise((resolve) => (finish = resolve)),
    );
    render(<OAuthServiceCard plugin={plugin} action={action} />);
    await open();
    const buttons = await screen.findAllByRole('button', { name: 'Import' });
    fireEvent.click(buttons[0]!);
    await waitFor(() =>
      expect((buttons[1] as HTMLButtonElement).disabled).toBe(true),
    );
    fireEvent.click(buttons[0]!);
    expect(adapter.importAlbum).toHaveBeenCalledTimes(1);
    finish({ ok: true, count: 3 });
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Imported 3 items.'),
    );
    expect((buttons[1] as HTMLButtonElement).disabled).toBe(false);
  });

  it('a throwing disconnect toasts and releases the button', async () => {
    adapter.disconnect.mockRejectedValue(new Error('x'));
    render(<OAuthServiceCard plugin={plugin} action={action} />);
    await open();
    const button = await screen.findByRole('button', { name: 'Disconnect' });
    fireEvent.click(button);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Could not disconnect Bandcamp.',
      ),
    );
    await waitFor(() =>
      expect(
        (
          screen.getByRole('button', {
            name: 'Disconnect',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false),
    );
  });
});
