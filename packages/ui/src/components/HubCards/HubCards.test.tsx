// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { HeartIcon, NewspaperIcon } from 'lucide-react';
import { afterEach, describe, expect, it } from 'vitest';

import { HubCards } from './HubCards';

const ITEMS = [
  {
    id: 'posts',
    href: '/studio/updates',
    icon: NewspaperIcon,
    title: 'Posts',
    description: 'Write updates for your followers.',
    badge: '2 drafts',
  },
  {
    id: 'memberships',
    href: '/studio/audience?tab=tiers',
    icon: HeartIcon,
    title: 'Memberships',
    description: 'Monthly support tiers.',
  },
];

describe('HubCards', () => {
  afterEach(cleanup);

  it('renders one link per card with its title, description and badge', () => {
    render(<HubCards items={ITEMS} aria-label="Fans tools" />);
    const list = screen.getByRole('list', { name: 'Fans tools' });
    const links = within(list).getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/studio/updates');
    expect(links[0]).toHaveTextContent('Posts');
    expect(links[0]).toHaveTextContent('2 drafts');
    expect(links[1]).toHaveTextContent('Monthly support tiers.');
  });

  it('wraps each card with renderLink', () => {
    render(
      <HubCards
        items={ITEMS}
        renderLink={(href, children, className) => (
          <a data-custom href={`#${href}`} className={className}>
            {children}
          </a>
        )}
      />,
    );
    const links = screen.getAllByRole('link');
    expect(links[1]).toHaveAttribute('href', '#/studio/audience?tab=tiers');
    expect(links[1]).toHaveAttribute('data-custom');
  });
});
