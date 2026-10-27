import { render, screen, within } from '@testing-library/react';

import {
  BreadcrumbAnchor,
  BreadcrumbCurrent,
  Breadcrumbs,
} from './Breadcrumbs';

describe('Breadcrumbs', () => {
  it('(Snapshot) renders a trail with separators', () => {
    const { container } = render(
      <Breadcrumbs>
        <BreadcrumbAnchor href="/admin">Admin</BreadcrumbAnchor>
        <BreadcrumbCurrent>Moderation</BreadcrumbCurrent>
      </Breadcrumbs>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('is a labelled navigation landmark with the current page marked', () => {
    render(
      <Breadcrumbs>
        <BreadcrumbAnchor href="/admin">Admin</BreadcrumbAnchor>
        <BreadcrumbAnchor href="/admin/governance">Governance</BreadcrumbAnchor>
        <BreadcrumbCurrent>2026</BreadcrumbCurrent>
      </Breadcrumbs>,
    );
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav.textContent).toBe('Admin→Governance→2026');
    expect(
      within(nav).getByRole('link', { name: 'Governance' }),
    ).toHaveAttribute('href', '/admin/governance');
    expect(within(nav).getByText('2026')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('skips empty children so no separator dangles', () => {
    const showMiddle = false;
    render(
      <Breadcrumbs>
        <BreadcrumbAnchor href="/admin">Admin</BreadcrumbAnchor>
        {showMiddle ? (
          <BreadcrumbAnchor href="/admin/storage">Storage</BreadcrumbAnchor>
        ) : null}
        <BreadcrumbCurrent>Files</BreadcrumbCurrent>
      </Breadcrumbs>,
    );
    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' }).textContent,
    ).toBe('Admin→Files');
  });
});
