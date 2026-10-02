import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChannelTopBar } from './ChannelTopBar';

describe('ChannelTopBar', () => {
  it('shows the trimmed top bar text', () => {
    render(<ChannelTopBar text="  New album out Friday  " />);
    expect(screen.getByTestId('channel-top-bar').textContent).toBe(
      'New album out Friday',
    );
  });

  it('renders nothing when the text is unset or blank', () => {
    const { container, rerender } = render(<ChannelTopBar text={null} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<ChannelTopBar text="   " />);
    expect(container).toBeEmptyDOMElement();
  });
});
