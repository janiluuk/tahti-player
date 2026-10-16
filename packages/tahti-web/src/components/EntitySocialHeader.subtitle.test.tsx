import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EntitySocialHeader } from './EntitySocialHeader';

describe('EntitySocialHeader subtitle contrast', () => {
  it('uses primary-foreground for the @handle on the default teal header', () => {
    render(<EntitySocialHeader title="Aurora" subtitle="@aurora" />);

    const subtitle = screen.getByTestId('entity-social-header-subtitle');
    expect(subtitle.className).toContain('text-primary-foreground');
    expect(subtitle.className).not.toContain('text-foreground-secondary');
  });

  it('keeps scheme muted colour when a channel colour scheme is set', () => {
    render(
      <EntitySocialHeader
        title="Aurora"
        subtitle="@aurora"
        colorScheme={{
          bg: '#0f172a',
          text: '#f8fafc',
          muted: '#94a3b8',
          accent: '#38bdf8',
          highlight: '#7dd3fc',
        }}
      />,
    );

    const subtitle = screen.getByTestId('entity-social-header-subtitle');
    expect(subtitle).toHaveStyle({ color: 'rgb(148, 163, 184)' });
  });
});
