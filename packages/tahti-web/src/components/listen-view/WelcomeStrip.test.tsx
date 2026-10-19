import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { renderWithRouter } from '../../test/renderWithRouter';
import { WelcomeStrip } from './WelcomeStrip';

describe('WelcomeStrip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('introduces Tahti with links onward', async () => {
    await renderWithRouter(<WelcomeStrip />);

    expect(
      screen.getByRole('heading', { name: 'Independent music, live.' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: /Join free/ })).toHaveAttribute(
      'href',
      '/join',
    );
    expect(
      screen.getByRole('link', { name: 'Tahti for artists' }),
    ).toHaveAttribute('href', '/for-artists');
  });

  it('stays hidden after it is dismissed', async () => {
    const first = await renderWithRouter(<WelcomeStrip />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Hide this introduction' }),
    );
    expect(screen.queryByTestId('listen-welcome')).toBeNull();
    first.unmount();

    await renderWithRouter(<WelcomeStrip />);
    expect(screen.queryByTestId('listen-welcome')).toBeNull();
  });
});
