// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SavedLooksRow } from './SavedLooksRow';

describe('SavedLooksRow', () => {
  afterEach(cleanup);

  it('says the saved looks failed to load instead of hiding them', () => {
    const onRetry = vi.fn();
    render(
      <SavedLooksRow
        presets={[]}
        loadError="HTTP 502"
        onRetry={onRetry}
        presetBusy={false}
        onApply={() => {}}
        onRequestDelete={() => {}}
      />,
    );
    expect(screen.getByText('Could not load your saved looks')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('stays hidden when there are no saved looks', () => {
    const { container } = render(
      <SavedLooksRow
        presets={[]}
        presetBusy={false}
        onApply={() => {}}
        onRequestDelete={() => {}}
      />,
    );
    expect(container.textContent).toBe('');
  });
});
