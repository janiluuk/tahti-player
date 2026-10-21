// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { renderWithRouter } from '../test/renderWithRouter';
import { PageBackLink } from './PageBackLink';

describe('PageBackLink', () => {
  afterEach(cleanup);

  it('links to the parent page with its search', async () => {
    const { router } = await renderWithRouter(
      <PageBackLink
        to="/discover"
        search={{ tab: 'venues' }}
        label="All venues"
      />,
      { paths: ['/discover'] },
    );
    const link = screen.getByRole('link', { name: 'All venues' });
    expect(link.getAttribute('href')).toBe('/discover?tab=venues');
    fireEvent.click(link);
    expect(await screen.findByTestId('routed-to')).toHaveTextContent(
      '/discover',
    );
    expect(router.state.location.search).toEqual({ tab: 'venues' });
  });
});
