import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import '@tahti-player/tailwind-config';

import { CreatableCombobox } from '.';

const OPTIONS = ['Electronic', 'House', 'Techno'];

describe('CreatableCombobox', () => {
  it('selects an existing option', async () => {
    const onValueChange = vi.fn();
    render(
      <CreatableCombobox
        options={OPTIONS}
        value=""
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'House' }));
    expect(onValueChange).toHaveBeenCalledWith('House');
  });

  it('offers to add a typed value that has no match, normalized', async () => {
    const onValueChange = vi.fn();
    render(
      <CreatableCombobox
        options={OPTIONS}
        value=""
        onValueChange={onValueChange}
        normalize={(raw) => raw.trim().toUpperCase()}
      />,
    );
    await userEvent.type(screen.getByRole('combobox'), 'lo-fi');
    const createOption = await screen.findByRole('option', {
      name: /add "LO-FI"/i,
    });
    await userEvent.click(createOption);
    expect(onValueChange).toHaveBeenCalledWith('LO-FI');
  });

  it('does not offer to add a value that matches an option case-insensitively', async () => {
    render(
      <CreatableCombobox options={OPTIONS} value="" onValueChange={vi.fn()} />,
    );
    await userEvent.type(screen.getByRole('combobox'), 'house');
    await screen.findByRole('option', { name: 'House' });
    expect(screen.queryByText(/add "/i)).not.toBeInTheDocument();
  });

  it('shows the current value in the input', () => {
    render(
      <CreatableCombobox
        options={OPTIONS}
        value="Techno"
        onValueChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('combobox')).toHaveValue('Techno');
  });

  it('names the button that opens the options', () => {
    const { rerender } = render(
      <CreatableCombobox
        label="Genre"
        options={OPTIONS}
        value=""
        onValueChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Show Genre options' }),
    ).toBeInTheDocument();
    rerender(
      <CreatableCombobox options={OPTIONS} value="" onValueChange={vi.fn()} />,
    );
    expect(
      screen.getByRole('button', { name: 'Show options' }),
    ).toBeInTheDocument();
  });
});
