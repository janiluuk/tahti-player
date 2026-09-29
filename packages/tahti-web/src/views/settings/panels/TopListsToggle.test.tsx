// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as topLists from '../../../api/me-top-lists';
import { TopListsToggle } from './TopListsToggle';

describe('setTopListsOptOut', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('patches the opt-out flag', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ topListsOptOut: true }), { status: 200 }),
      );
    await expect(topLists.setTopListsOptOut(true)).resolves.toEqual({
      ok: true,
      optOut: true,
    });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/tahti-api/api/me/top-lists-opt-out');
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(String(init?.body))).toEqual({ topListsOptOut: true });
  });
});

describe('TopListsToggle', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows inclusion as on when not opted out and opts out on toggle', async () => {
    vi.spyOn(topLists, 'fetchTopListsOptOut').mockResolvedValue({
      ok: true,
      optOut: false,
    });
    const save = vi
      .spyOn(topLists, 'setTopListsOptOut')
      .mockResolvedValue({ ok: true, optOut: true });
    await act(async () => {
      render(<TopListsToggle />);
    });
    const toggle = screen.getByRole('switch', {
      name: 'Put my new uploads in the top lists',
    });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(save).toHaveBeenCalledWith(true);
    expect(toggle.getAttribute('aria-checked')).toBe('false');
  });

  it('rolls back when the save fails', async () => {
    vi.spyOn(topLists, 'fetchTopListsOptOut').mockResolvedValue({
      ok: true,
      optOut: true,
    });
    vi.spyOn(topLists, 'setTopListsOptOut').mockResolvedValue({
      ok: false,
      error: 'Nope',
    });
    await act(async () => {
      render(<TopListsToggle />);
    });
    const toggle = screen.getByRole('switch', {
      name: 'Put my new uploads in the top lists',
    });
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
  });
});
