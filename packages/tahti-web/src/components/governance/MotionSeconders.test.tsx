// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MotionSeconders } from './MotionSeconders';

const fetchMotionSeconders = vi.fn();

vi.mock('../../api/governance-motion-detail', () => ({
  fetchMotionSeconders: (id: string) => fetchMotionSeconders(id),
}));

describe('MotionSeconders', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('lists who seconded the motion', async () => {
    fetchMotionSeconders.mockResolvedValue({
      data: [
        {
          displayName: 'Aino',
          username: 'aino',
          secondedAt: '2026-10-14T08:00:00.000Z',
        },
        {
          displayName: 'Beata',
          username: 'beata',
          secondedAt: '2026-10-14T09:00:00.000Z',
        },
      ],
      meta: { source: 'api' },
    });
    render(<MotionSeconders motionId="m1" />);

    expect(
      await screen.findByRole('heading', { name: 'Seconded by' }),
    ).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('@beata')).toBeTruthy();
    expect(fetchMotionSeconders).toHaveBeenCalledWith('m1');
  });

  it('shows nothing when nobody has seconded', async () => {
    fetchMotionSeconders.mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    const { container } = render(<MotionSeconders motionId="m1" />);

    await vi.waitFor(() => expect(fetchMotionSeconders).toHaveBeenCalled());
    expect(container.textContent).toBe('');
  });

  it('says the seconders failed to load instead of hiding them', async () => {
    fetchMotionSeconders.mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    render(<MotionSeconders motionId="m1" />);
    expect(
      await screen.findByText('Could not load who seconded this motion'),
    ).toBeTruthy();

    fetchMotionSeconders.mockResolvedValue({
      data: [
        {
          displayName: 'Aino',
          username: 'aino',
          secondedAt: '2026-10-14T08:00:00.000Z',
        },
      ],
      meta: { source: 'api' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(
      await screen.findByRole('heading', { name: 'Seconded by' }),
    ).toBeTruthy();
  });
});
