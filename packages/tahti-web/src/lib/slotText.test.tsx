import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SLOT, withSlot } from './slotText';

describe('withSlot', () => {
  it('puts the node where the slot is', () => {
    const { container } = render(
      <p>{withSlot(`Try ${SLOT} now.`, <strong>this</strong>)}</p>,
    );
    expect(container.innerHTML).toBe('<p>Try <strong>this</strong> now.</p>');
  });

  it('returns the text unchanged without a slot', () => {
    expect(withSlot('Plain', <strong>x</strong>)).toBe('Plain');
  });
});
