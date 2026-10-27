// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PublicChannelBlock } from '../../api/channel-blocks';
import { ChannelBlocksSection } from './ChannelBlocksSection';

vi.mock('./DiscoWidgetFrame', () => ({
  DiscoWidgetFrame: ({ name }: { name: string }) => <div>{name}</div>,
}));

const addonBlock = (
  id: string,
  width: PublicChannelBlock['width'],
): PublicChannelBlock => ({
  id,
  type: 'ADDON',
  width,
  position: 0,
  logoUrl: null,
  addon: {
    installId: `install-${id}`,
    widgetSlug: id,
    name: `Widget ${id}`,
    sandboxUrl: 'https://sandbox.example/w.html',
    version: '1.0.0',
    position: 0,
    config: {},
    context: {},
  },
});

afterEach(cleanup);

describe('ChannelBlocksSection', () => {
  it('lays blocks out in rows by width', () => {
    render(
      <ChannelBlocksSection
        blocks={[
          {
            id: 'logo',
            type: 'LOGO',
            width: 'FULL',
            position: 0,
            logoUrl: 'https://cdn.example/logo.png',
            addon: null,
          },
          addonBlock('a', 'HALF'),
          addonBlock('b', 'HALF'),
        ]}
      />,
    );

    const rows = screen.getAllByTestId('channel-block-row');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByAltText('Channel logo')).toBeTruthy();
    expect(
      within(rows[1]!)
        .getAllByTestId('channel-block')
        .map((block) => [block.textContent, block.dataset.width]),
    ).toEqual([
      ['Widget a', 'HALF'],
      ['Widget b', 'HALF'],
    ]);
  });

  it('renders nothing without blocks', () => {
    render(<ChannelBlocksSection blocks={[]} />);

    expect(screen.queryByTestId('channel-blocks')).toBeNull();
  });
});
