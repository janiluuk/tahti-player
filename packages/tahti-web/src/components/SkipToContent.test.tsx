import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MAIN_CONTENT_ID, SkipToContent } from './SkipToContent';

describe('SkipToContent', () => {
  it('moves focus to the main content', () => {
    render(
      <>
        <SkipToContent />
        <div id={MAIN_CONTENT_ID} tabIndex={-1}>
          Page
        </div>
      </>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'Skip to content' }));
    expect(document.activeElement).toBe(screen.getByText('Page'));
  });
});
