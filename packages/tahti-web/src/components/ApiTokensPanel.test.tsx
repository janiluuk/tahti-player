// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/api-tokens';
import { ApiTokensPanel } from './ApiTokensPanel';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const base = {
  tokenPrefix: 'tahti_ab',
  scopes: ['read'] as Array<'read' | 'write'>,
  lastUsedAt: null,
  createdAt: '2026-09-01T00:00:00.000Z',
};

async function renderPanel(tokens: api.ApiToken[]) {
  vi.spyOn(api, 'fetchApiTokens').mockResolvedValue({
    data: tokens,
    meta: { source: 'api' },
  } as never);
  await act(async () => {
    render(<ApiTokensPanel />);
  });
}

describe('ApiTokensPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('marks an expired token and says when a live one expires', async () => {
    await renderPanel([
      { ...base, id: 't1', name: 'old', expiresAt: '2020-01-01T00:00:00.000Z' },
      {
        ...base,
        id: 't2',
        name: 'soon',
        expiresAt: '2999-01-01T00:00:00.000Z',
      },
      { ...base, id: 't3', name: 'forever', expiresAt: null },
    ]);
    expect(screen.getAllByText('Expired')).toHaveLength(1);
    expect(screen.getByText(/expired .*2020/)).toBeTruthy();
    expect(screen.getByText(/expires .*2999/)).toBeTruthy();
  });

  it('creates a token with the chosen expiry', async () => {
    const create = vi.spyOn(api, 'createApiToken').mockResolvedValue({
      ok: true,
      data: { ...base, id: 't9', name: 'cli', token: 'tahti_secret' },
    });
    await renderPanel([]);
    fireEvent.click(screen.getByRole('button', { name: 'New token' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'cli' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Expires/ }));
    });
    await act(async () => {
      fireEvent.click(await screen.findByRole('option', { name: '90 days' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create token' }));
    });
    expect(create).toHaveBeenCalledWith('cli', ['read'], 90);
  });

  it('sends no expiry when the token should never expire', async () => {
    const create = vi.spyOn(api, 'createApiToken').mockResolvedValue({
      ok: true,
      data: { ...base, id: 't9', name: 'cli', token: 'tahti_secret' },
    });
    await renderPanel([]);
    fireEvent.click(screen.getByRole('button', { name: 'New token' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'cli' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create token' }));
    });
    expect(create).toHaveBeenCalledWith('cli', ['read'], undefined);
  });
});
