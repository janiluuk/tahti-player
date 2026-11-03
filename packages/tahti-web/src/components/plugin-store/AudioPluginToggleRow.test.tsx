// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AudioPluginToggleRow } from './shared';

describe('AudioPluginToggleRow', () => {
  afterEach(cleanup);

  it('can be turned off again once active', () => {
    const onToggle = vi.fn();
    render(
      <AudioPluginToggleRow
        name="Radio Browser"
        author="radio-browser.info"
        description="Station directory"
        enabled
        onToggle={onToggle}
      />,
    );
    const toggle = screen.getByRole('switch', { name: 'Radio Browser on' });
    expect(toggle).toBeChecked();
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('offers Activate while off', () => {
    render(
      <AudioPluginToggleRow
        name="Radio Browser"
        author="radio-browser.info"
        description="Station directory"
        enabled={false}
        onToggle={() => undefined}
      />,
    );
    expect(screen.getByRole('button', { name: /Activate/ })).toBeEnabled();
    expect(screen.queryByRole('switch')).toBeNull();
  });
});
