// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChannelBlockView } from '../../api/channel-blocks';
import type { DiscoWidgetInstallView } from '../../api/disco-widgets';
import { renderWithRouter } from '../../test/renderWithRouter';
import { DiscoWidgetManagerPanel } from './DiscoWidgetManagerPanel';

const { addons, blocksApi } = vi.hoisted(() => ({
  addons: {
    fetchDiscoWidgetStore: vi.fn(),
    fetchDiscoWidgetInstalls: vi.fn(),
    createDiscoWidgetInstall: vi.fn(),
    patchDiscoWidgetInstall: vi.fn(),
    removeDiscoWidgetInstall: vi.fn(),
  },
  blocksApi: {
    fetchMyChannelBlocks: vi.fn(),
    createAddonBlock: vi.fn(),
    patchChannelBlockWidth: vi.fn(),
    reorderChannelBlocks: vi.fn(),
    deleteChannelBlock: vi.fn(),
  },
}));

vi.mock('../../api/disco-widgets', () => addons);
vi.mock('../../api/channel-blocks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/channel-blocks')>()),
  ...blocksApi,
}));

const install = (id: string, position: number): DiscoWidgetInstallView => ({
  id,
  position,
  enabled: true,
  configJson: {},
  createdAt: '2030-01-01T00:00:00.000Z',
  widget: {
    id: `widget-${id}`,
    slug: id,
    name: `Widget ${id}`,
    description: '',
    authorName: 'Tahti',
    categories: [],
    iconUrl: null,
    currentVersion: '1.0.0',
  },
});

const block = (
  installId: string,
  width: ChannelBlockView['width'],
  position: number,
): ChannelBlockView => ({
  id: `block-${installId}`,
  type: 'ADDON',
  width,
  position,
  configJson: { addonInstallId: installId },
});

const widthGroup = (name: string) =>
  screen.getByRole('radiogroup', {
    name: `Width of Widget ${name} on your channel`,
  });

const checkedWidth = (name: string) =>
  within(widthGroup(name))
    .getAllByRole('radio')
    .find((radio) => radio.getAttribute('aria-checked') === 'true')
    ?.textContent;

async function mount(scope: 'ARTIST' | 'LISTENER' = 'ARTIST') {
  await renderWithRouter(<DiscoWidgetManagerPanel scope={scope} />);
  await screen.findByText('Widget a');
}

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  addons.fetchDiscoWidgetStore.mockResolvedValue({ data: [], meta: {} });
  addons.fetchDiscoWidgetInstalls.mockResolvedValue({
    data: [install('a', 0), install('b', 1)],
    meta: {},
  });
  addons.patchDiscoWidgetInstall.mockResolvedValue({ error: null, data: {} });
  addons.removeDiscoWidgetInstall.mockResolvedValue({
    error: null,
    data: undefined,
  });
  blocksApi.reorderChannelBlocks.mockResolvedValue({
    error: null,
    data: undefined,
  });
  blocksApi.deleteChannelBlock.mockResolvedValue({
    error: null,
    data: undefined,
  });
  blocksApi.createAddonBlock.mockImplementation(
    async (installId: string, width: ChannelBlockView['width']) => ({
      error: null,
      data: block(installId, width, installId === 'a' ? 0 : 1),
    }),
  );
});

describe('DiscoWidgetManagerPanel channel layout', () => {
  it('lays out every add-on in list order when a width is first set', async () => {
    blocksApi.fetchMyChannelBlocks.mockResolvedValue({ error: null, data: [] });
    await mount();
    expect(checkedWidth('b')).toBe('Full');

    fireEvent.click(
      within(widthGroup('b')).getByRole('radio', { name: 'Half' }),
    );

    await waitFor(() => expect(checkedWidth('b')).toBe('Half'));
    expect(blocksApi.createAddonBlock.mock.calls).toEqual([
      ['a', 'FULL'],
      ['b', 'HALF'],
    ]);
  });

  it('changes the width of an add-on already in the layout', async () => {
    blocksApi.fetchMyChannelBlocks.mockResolvedValue({
      error: null,
      data: [block('a', 'HALF', 0), block('b', 'HALF', 1)],
    });
    blocksApi.patchChannelBlockWidth.mockResolvedValue({
      error: null,
      data: block('a', 'THIRD', 0),
    });
    await mount();
    await waitFor(() => expect(checkedWidth('a')).toBe('Half'));

    fireEvent.click(
      within(widthGroup('a')).getByRole('radio', { name: 'Third' }),
    );

    await waitFor(() => expect(checkedWidth('a')).toBe('Third'));
    expect(blocksApi.patchChannelBlockWidth).toHaveBeenCalledWith(
      'block-a',
      'THIRD',
    );
    expect(blocksApi.createAddonBlock).not.toHaveBeenCalled();
  });

  it('moves the layout with the list and drops a removed add-on', async () => {
    blocksApi.fetchMyChannelBlocks.mockResolvedValue({
      error: null,
      data: [block('a', 'HALF', 0), block('b', 'HALF', 1)],
    });
    await mount();
    await waitFor(() => expect(checkedWidth('a')).toBe('Half'));

    fireEvent.click(screen.getAllByRole('button', { name: 'Move up' })[1]!);
    await waitFor(() =>
      expect(blocksApi.reorderChannelBlocks).toHaveBeenCalledWith([
        'block-b',
        'block-a',
      ]),
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]!);
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: 'Remove Widget b?' }),
      ).getByRole('button', { name: 'Remove' }),
    );
    await waitFor(() =>
      expect(blocksApi.deleteChannelBlock).toHaveBeenCalledWith('block-b'),
    );
  });

  it('has no layout for listener add-ons', async () => {
    await mount('LISTENER');

    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.queryByText('Add a logo block')).toBeNull();
    expect(blocksApi.fetchMyChannelBlocks).not.toHaveBeenCalled();
  });

  it('places a logo in the channel layout, separate from add-on widths', async () => {
    blocksApi.fetchMyChannelBlocks.mockResolvedValue({
      error: null,
      data: [
        {
          id: 'logo-1',
          type: 'LOGO',
          width: 'HALF',
          position: 0,
          configJson: {
            assetId: 'asset-1',
            url: 'https://cdn.example/logo.png',
          },
        },
      ],
    });
    await mount();

    expect(
      screen.getByRole('radiogroup', {
        name: 'Width of this logo on your channel',
      }),
    ).toBeTruthy();
    expect(screen.getByLabelText('Add a logo block')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove logo' }));
    await waitFor(() =>
      expect(blocksApi.deleteChannelBlock).toHaveBeenCalledWith('logo-1'),
    );
  });
});
