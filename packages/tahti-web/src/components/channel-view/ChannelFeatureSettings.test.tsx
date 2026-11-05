import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import {
  defaultChannelPageLayout,
  type ChannelPageItem,
} from '../../lib/channelPageLayout';
import { ChannelFeatureSettings } from './ChannelFeatureSettings';

function Harness({ radio = false }: { radio?: boolean }) {
  const [layout, setLayout] = useState<ChannelPageItem[]>(
    defaultChannelPageLayout(),
  );
  return (
    <>
      <ChannelFeatureSettings
        layout={layout}
        updateLayout={(updater) => setLayout((prev) => updater(prev))}
        isRadioChannel={radio}
      />
      <output data-testid="state">
        {layout
          .filter((item) => item.visible)
          .map((item) => item.type)
          .join(',')}
      </output>
    </>
  );
}

describe('ChannelFeatureSettings', () => {
  it('turns header details and sections on and off in the layout', async () => {
    render(<Harness />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    });
    const counts = await screen.findByRole('switch', {
      name: 'Follower and play counts',
    });
    expect(counts).toHaveAttribute('aria-checked', 'true');
    await act(async () => {
      fireEvent.click(counts);
    });
    expect(screen.getByTestId('state').textContent).not.toContain(
      'headerStats',
    );
    expect(
      screen.getByRole('switch', { name: 'Follower and play counts' }),
    ).toHaveAttribute('aria-checked', 'false');
    await act(async () => {
      fireEvent.click(screen.getByRole('switch', { name: 'Live shows' }));
    });
    expect(screen.getByTestId('state').textContent).toContain('events');
    expect(screen.getByRole('switch', { name: 'Live shows' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});

describe('ChannelFeatureSettings on a radio channel', () => {
  it('offers Programming and no Subscribe button', async () => {
    render(<Harness radio />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    });
    expect(
      await screen.findByRole('switch', { name: 'Programming' }),
    ).toBeTruthy();
    expect(
      screen.queryByRole('switch', { name: 'Subscribe button' }),
    ).toBeNull();
  });
});
