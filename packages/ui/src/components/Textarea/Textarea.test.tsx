import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import '@tahti-player/tailwind-config';

import { Textarea } from '.';

describe('Textarea', () => {
  it('(Snapshot) renders with placeholder', () => {
    const { container } = render(
      <Textarea placeholder="Add a description..." />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('(Snapshot) renders with secondary tone', () => {
    const { container } = render(
      <Textarea tone="secondary" placeholder="Notes..." />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('labels, describes and flags an error like Input', () => {
    render(
      <Textarea
        label="Message"
        description="Up to 500 characters."
        error="Too long"
      />,
    );
    const field = screen.getByRole('textbox', { name: 'Message' });
    expect(field).toHaveAccessibleDescription('Up to 500 characters. Too long');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Too long')).toHaveAttribute(
      'id',
      field.getAttribute('aria-errormessage'),
    );
  });

  it('renders the bare textarea without label props', () => {
    const { container } = render(<Textarea aria-label="Notes" />);
    expect(container.firstElementChild?.tagName).toBe('TEXTAREA');
  });
  describe('submitOnModEnter', () => {
    const renderForm = (disabled = false, submitOnModEnter = true) => {
      const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
        event.preventDefault(),
      );
      render(
        <form onSubmit={onSubmit}>
          <Textarea aria-label="Note" submitOnModEnter={submitOnModEnter} />
          <button type="submit" disabled={disabled}>
            Save
          </button>
        </form>,
      );
      return { onSubmit, field: screen.getByRole('textbox', { name: 'Note' }) };
    };

    it('submits the form on Cmd+Enter and Ctrl+Enter', () => {
      const { onSubmit, field } = renderForm();
      fireEvent.keyDown(field, { key: 'Enter', metaKey: true });
      fireEvent.keyDown(field, { key: 'Enter', ctrlKey: true });
      expect(onSubmit).toHaveBeenCalledTimes(2);
    });

    it('keeps plain Enter for new lines', () => {
      const { onSubmit, field } = renderForm();
      fireEvent.keyDown(field, { key: 'Enter' });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does nothing while the submit button is disabled', () => {
      const { onSubmit, field } = renderForm(true);
      fireEvent.keyDown(field, { key: 'Enter', metaKey: true });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('is off unless asked for', () => {
      const { onSubmit, field } = renderForm(false, false);
      fireEvent.keyDown(field, { key: 'Enter', metaKey: true });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
