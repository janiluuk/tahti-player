// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AdminAddon } from '../../../api/admin';
import { ManageDialog } from './ManageDialog';

const addon = {
  id: 'a1',
  name: 'Lyrics',
  scope: 'CHANNEL',
  enabledByDefault: false,
  defaultConfigJson: null,
} as unknown as AdminAddon;

describe('ManageDialog', () => {
  afterEach(cleanup);

  it('confirms disabling an add-on with a red button', () => {
    const onDisable = vi.fn();
    render(
      <ManageDialog
        addon={addon}
        pending={false}
        error={null}
        onClose={vi.fn()}
        onSetEnabledByDefault={vi.fn()}
        onSetDefaultConfig={vi.fn()}
        onDisable={onDisable}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Disable add-on' }));
    const confirm = screen.getByRole('button', { name: 'Disable' });
    expect(confirm.className).toContain('bg-accent-red');
    fireEvent.click(confirm);
    expect(onDisable).toHaveBeenCalledWith(addon);
  });
});
