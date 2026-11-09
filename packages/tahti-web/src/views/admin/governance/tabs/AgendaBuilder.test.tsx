// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AgendaBuilder } from './AgendaBuilder';

const items = () =>
  screen.getAllByRole('listitem').map((li) => li.textContent?.trim());

describe('AgendaBuilder', () => {
  afterEach(cleanup);

  it('reads the agenda as text, with no open fields', () => {
    render(<AgendaBuilder initial={['Call to order', 'Close']} />);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(items()).toEqual(['1.Call to order', '2.Close']);
  });

  it('edits one line at a time and saves it', () => {
    render(<AgendaBuilder initial={['Call to order', 'Close']} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Edit item 1: Call to order' }),
    );
    const field = screen.getByRole('textbox', { name: 'Agenda item 1' });
    expect(
      screen.getByRole('button', { name: 'Edit item 2: Close' }),
    ).toBeDisabled();
    fireEvent.change(field, { target: { value: 'Opening' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(items()[0]).toBe('1.Opening');
  });

  it('Escape drops the edit', () => {
    render(<AgendaBuilder initial={['Call to order']} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Edit item 1: Call to order' }),
    );
    const field = screen.getByRole('textbox', { name: 'Agenda item 1' });
    fireEvent.change(field, { target: { value: 'Something else' } });
    fireEvent.keyDown(field, { key: 'Escape' });
    expect(items()).toEqual(['1.Call to order']);
  });

  it('opens a new line for editing, and Cancel removes it again', () => {
    render(<AgendaBuilder initial={['Call to order']} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add agenda item' }));
    expect(
      screen.getByRole('textbox', { name: 'Agenda item 2' }),
    ).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(items()).toEqual(['1.Call to order']);
  });

  it('moves and removes lines', () => {
    render(<AgendaBuilder initial={['A', 'B', 'C']} />);
    fireEvent.click(screen.getByRole('button', { name: 'Move down: A' }));
    expect(items()).toEqual(['1.B', '2.A', '3.C']);
    fireEvent.click(screen.getByRole('button', { name: 'Remove item 3: C' }));
    expect(items()).toEqual(['1.B', '2.A']);
  });
});
