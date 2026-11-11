import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import '@tahti-player/tailwind-config';

import { Input } from '.';

describe('Input', () => {
  it('(Snapshot) renders text input with description', () => {
    const { container } = render(
      <Input
        id="input-username"
        label="Username"
        placeholder="your-username"
        description="This is your public display name."
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('(Snapshot) renders with error and no description', () => {
    const { container } = render(
      <Input
        id="input-username-error"
        label="Username"
        placeholder="your-username"
        error="Username is already taken"
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('points aria-describedby at the description and the error', () => {
    render(
      <Input
        id="described"
        label="Show name"
        description="Required."
        error="Add a show name."
      />,
    );
    expect(screen.getByLabelText('Show name')).toHaveAttribute(
      'aria-describedby',
      'described-description described-error',
    );
  });

  it('(Snapshot) renders with endAddon idle when empty', () => {
    const { container, getByTestId } = render(
      <Input
        id="input-with-addon"
        placeholder="Filter..."
        endAddon={<button type="button">X</button>}
      />,
    );
    expect(getByTestId('input-end-addon')).not.toHaveAttribute('data-active');
    expect(container.firstChild).toMatchSnapshot();
  });

  it('marks endAddon active when the field has a value', () => {
    const { getByTestId, rerender } = render(
      <Input
        id="input-with-addon-active"
        placeholder="Filter..."
        value=""
        onChange={() => {}}
        endAddon={<button type="button">X</button>}
      />,
    );
    expect(getByTestId('input-end-addon')).not.toHaveAttribute('data-active');
    rerender(
      <Input
        id="input-with-addon-active"
        placeholder="Filter..."
        value="midnight"
        onChange={() => {}}
        endAddon={<button type="button">X</button>}
      />,
    );
    expect(getByTestId('input-end-addon')).toHaveAttribute(
      'data-active',
      'true',
    );
  });

  it('(Snapshot) renders with startAddon', () => {
    const { container } = render(
      <Input
        id="input-with-prefix"
        placeholder="polar-nights"
        startAddon={<span>https://soundcloud.com/you/</span>}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('sizes the addon frame, not the inner field, from layout classes', () => {
    const { container } = render(
      <Input
        id="input-sized-addon"
        placeholder="Search"
        className="mb-4 max-w-md grow pr-9 sm:w-64"
        startAddon={<span>Q</span>}
      />,
    );
    const root = container.firstChild as HTMLElement;
    const field = container.querySelector('input') as HTMLInputElement;
    for (const cls of ['mb-4', 'max-w-md', 'grow', 'sm:w-64']) {
      expect(root.classList).toContain(cls);
      expect(field.classList).not.toContain(cls);
    }
    expect(field.classList).toContain('pr-9');
  });

  it('keeps every class on the field when there is no addon', () => {
    const { container } = render(
      <Input id="input-sized" placeholder="Search" className="mb-4 max-w-md" />,
    );
    const root = container.firstChild as HTMLElement;
    const field = container.querySelector('input') as HTMLInputElement;
    expect(field.classList).toContain('max-w-md');
    expect(field.classList).toContain('mb-4');
    expect(root.classList).not.toContain('max-w-md');
  });

  it('(Snapshot) renders a color swatch input', () => {
    const { container } = render(
      <Input
        id="input-color"
        type="color"
        value="#ff9900"
        aria-label="Accent"
        onChange={() => {}}
      />,
    );
    expect(container.querySelector('input')?.type).toBe('color');
    expect(container.firstChild).toMatchSnapshot();
  });
});
