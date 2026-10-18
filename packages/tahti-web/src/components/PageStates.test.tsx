// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RouteChunkSkeleton } from './PageStates';

describe('RouteChunkSkeleton', () => {
  it('exposes a compact loading status for lazy route chunks', () => {
    render(<RouteChunkSkeleton />);
    expect(screen.getByRole('status', { name: 'Loading page' })).toBeTruthy();
  });
});
