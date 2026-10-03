// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PostLink } from './PostLink';

describe('PostLink', () => {
  it('shows the label and opens the link in a new tab', () => {
    render(<PostLink linkUrl="https://example.com/t" linkLabel="Tickets" />);
    const link = screen.getByRole('link', { name: 'Tickets' });
    expect(link).toHaveAttribute('href', 'https://example.com/t');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('falls back to the host when there is no label', () => {
    render(<PostLink linkUrl="https://example.com/t" linkLabel={null} />);
    expect(screen.getByRole('link', { name: 'example.com' })).toBeVisible();
  });

  it('renders nothing for a missing or non-web link', () => {
    const { container } = render(
      <>
        <PostLink linkUrl={null} linkLabel="x" />
        <PostLink linkUrl="javascript:alert(1)" linkLabel="x" />
      </>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
