import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { OverflowMenu } from '.';

describe('OverflowMenu', () => {
  it('(Snapshot) renders the trigger', () => {
    const { container } = render(
      <OverflowMenu
        items={[
          { id: 'edit', label: 'Edit', onSelect: () => undefined },
          {
            id: 'delete',
            label: 'Delete',
            onSelect: () => undefined,
            destructive: true,
          },
        ]}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('opens and runs the selected action', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(
      <OverflowMenu
        items={[{ id: 'edit', label: 'Edit', onSelect: onEdit }]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledOnce();
  });
});
