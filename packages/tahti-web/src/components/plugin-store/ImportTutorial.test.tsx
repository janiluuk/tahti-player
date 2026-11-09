import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ImportTutorial } from './ImportTutorial';

describe('ImportTutorial', () => {
  it('walks through importing from another service and turning embeds into uploads', () => {
    render(<ImportTutorial />);
    const guide = screen.getByRole('region', {
      name: 'How to import your tracks from another service',
    });
    expect(within(guide).getAllByRole('listitem')).toHaveLength(4);
    expect(
      within(guide).getByText('tahti hearthis import-embeds'),
    ).toBeTruthy();
    expect(within(guide).getByText(/Host the audio on Tahti/)).toBeTruthy();
  });
});
