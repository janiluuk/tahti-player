import { render, screen } from '@testing-library/react';

import { ButtonAnchor } from './ButtonLink';

describe('ButtonAnchor', () => {
  it('tells screen readers a new-tab link opens a new tab', () => {
    render(
      <ButtonAnchor href="https://example.com" target="_blank">
        Docs
      </ButtonAnchor>,
    );
    expect(
      screen.getByRole('link', { name: 'Docs (opens in a new tab)' }),
    ).toHaveAttribute('target', '_blank');
  });

  it('adds nothing to a same-tab link', () => {
    render(<ButtonAnchor href="/docs">Docs</ButtonAnchor>);
    expect(screen.getByRole('link', { name: 'Docs' })).toBeTruthy();
  });
});
