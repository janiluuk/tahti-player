// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChannelBackdropCard } from './ChannelBackdropCard';

vi.mock('./ChannelVisualizer', () => ({ ChannelVisualizer: () => null }));

afterEach(cleanup);

describe('ChannelBackdropCard name', () => {
  it('is the page heading on the channel page', () => {
    render(
      <ChannelBackdropCard
        displayName="Night Radio"
        username="night"
        nameAsHeading
      />,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Night Radio' }),
    ).toBeTruthy();
  });

  it('is not a heading in a preview', () => {
    render(<ChannelBackdropCard displayName="Night Radio" username="night" />);
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });
});
