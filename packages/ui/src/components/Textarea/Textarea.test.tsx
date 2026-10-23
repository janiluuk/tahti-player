import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
});
