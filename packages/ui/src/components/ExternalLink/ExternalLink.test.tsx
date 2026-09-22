import { render, screen } from '@testing-library/react';

import { ExternalLink } from './ExternalLink';

describe('ExternalLink', () => {
  it('opens in a new tab with safe rel', () => {
    render(<ExternalLink href="https://example.com">Docs</ExternalLink>);
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer noopener');
  });
});
