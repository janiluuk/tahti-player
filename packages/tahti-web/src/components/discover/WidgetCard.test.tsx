// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WidgetCard } from './WidgetCard';

describe('WidgetCard header', () => {
  afterEach(cleanup);

  it('uses the 18px Listen section heading and wraps long titles instead of truncating', () => {
    render(
      <WidgetCard
        id="tahti-selects"
        title="Loved by the community this month"
        subtitle="Picked for the Tahti Selects rotation"
        loading={false}
        items={[]}
        emptyMessage="Nothing yet"
        canMoveUp={false}
        canMoveDown={false}
        onMove={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Loved by the community this month',
    });
    expect(heading.className).toContain('text-lg');
    expect(heading.className).toContain('line-clamp-2');
    expect(heading.className).not.toContain('truncate');
    const subtitle = screen.getByText('Picked for the Tahti Selects rotation');
    expect(subtitle.className).not.toContain('truncate');
  });
});
