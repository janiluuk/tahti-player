import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { withInlineCode } from './inlineCode';

describe('withInlineCode', () => {
  it('wraps backtick-quoted parts in code elements', () => {
    const { container } = render(
      <p>{withInlineCode('Import `.nml` or `.txt` files')}</p>,
    );
    expect(container.querySelectorAll('code')).toHaveLength(2);
    expect(container.textContent).toBe('Import .nml or .txt files');
  });
});
