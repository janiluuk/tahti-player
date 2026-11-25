import { render, screen } from '@testing-library/react';
import { UsersIcon } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { EntitySocialHeader } from './EntitySocialHeader';

const stats = [
  { key: 'followers', label: 'Followers', value: 3, icon: UsersIcon },
];

describe('EntitySocialHeader compactOnPhone', () => {
  it('shrinks the image, moves the actions to their own row and keeps the counts on one swipeable row on phones', () => {
    render(
      <EntitySocialHeader
        title="Aurora"
        imageUrl="https://example.com/a.png"
        roundImage
        stats={stats}
        actions={<span>Follow</span>}
        compactOnPhone
      />,
    );

    expect(screen.getByTestId('entity-social-header')).toHaveClass(
      'max-sm:p-4',
    );
    expect(screen.getByTestId('entity-social-header-actions')).toHaveClass(
      'max-sm:basis-full',
    );
    expect(screen.getByTestId('entity-social-stats')).toHaveClass(
      'max-sm:flex-nowrap',
      'max-sm:overflow-x-auto',
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Aurora' }),
    ).toHaveClass('max-sm:text-2xl');
  });

  it('leaves the phone layout alone by default', () => {
    render(
      <EntitySocialHeader
        title="Aurora"
        stats={stats}
        actions={<span>Follow</span>}
      />,
    );

    expect(screen.getByTestId('entity-social-header')).not.toHaveClass(
      'max-sm:p-4',
    );
    expect(screen.getByTestId('entity-social-stats')).toHaveClass('flex-wrap');
    expect(screen.getByTestId('entity-social-stats')).not.toHaveClass(
      'max-sm:flex-nowrap',
    );
  });
});
