import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AiGeneratedBadge } from './AiGeneratedBadge';

describe('AiGeneratedBadge', () => {
  it('labels a track the artist marked as AI-generated', () => {
    render(<AiGeneratedBadge show />);
    expect(screen.getByText('AI-generated')).toBeInTheDocument();
  });

  it('renders nothing when the flag is off or missing', () => {
    const { container, rerender } = render(<AiGeneratedBadge show={false} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<AiGeneratedBadge show={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });
});
