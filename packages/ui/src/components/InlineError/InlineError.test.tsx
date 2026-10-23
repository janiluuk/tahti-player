import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InlineError } from './InlineError';

describe('InlineError', () => {
  it('announces the message as an alert', () => {
    render(<InlineError>Could not save</InlineError>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Could not save');
    expect(alert).toHaveClass('text-accent-red-strong', 'text-sm');
  });

  it('takes a smaller size and extra classes', () => {
    render(
      <InlineError textSize="xs" className="mt-2" data-testid="err">
        Too big
      </InlineError>,
    );
    expect(screen.getByTestId('err')).toHaveClass('text-xs', 'mt-2');
  });
});
