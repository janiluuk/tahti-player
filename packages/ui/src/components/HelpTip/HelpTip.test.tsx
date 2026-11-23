import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HelpTip } from './HelpTip';

describe('HelpTip', () => {
  it('is a named button described by its help text', () => {
    render(
      <HelpTip
        label="About dynamic theme"
        content="Colours follow the artwork that is playing."
      />,
    );
    const button = screen.getByRole('button', { name: 'About dynamic theme' });
    expect(button).toHaveAccessibleDescription(
      'Colours follow the artwork that is playing.',
    );
  });
});
