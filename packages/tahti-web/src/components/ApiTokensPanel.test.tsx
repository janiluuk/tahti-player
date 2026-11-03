// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-03T00:00:00.000Z'));
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('says the tokens failed to load instead of "No API tokens yet"', async () => {
    const fetch = vi.spyOn(api, 'fetchApiTokens').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    } as never);
    await act(async () => {
      render(<ApiTokensPanel />);
    });
    expect(screen.getByText('Could not load your API tokens')).toBeTruthy();
    expect(screen.queryByText('No API tokens yet')).toBeNull();

    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } } as never);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });
    expect(screen.getByText('No API tokens yet')).toBeTruthy();
  });

  it('shows the MCP server URL an AI tool uses with a token', async () => {
    await renderPanel([]);
    expect(
      screen.getByTestId('api-tokens-mcp').querySelector('code')?.textContent,
    ).toBe(`${window.location.origin}/tahti-api/api/v1/mcp`);
    expect(
      screen.getByRole('button', { name: 'Copy MCP server URL' }),
    ).toBeTruthy();
  });

  it('says a new token is emailed', async () => {
    await renderPanel([]);
    expect(
      screen.getByText(/we email you whenever a new one is made/),
    ).toBeTruthy();
  });

  it('confirms a revoke with a red button', async () => {
    await renderPanel([{ ...base, id: 't1', name: 'cli', expiresAt: null }]);
    fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    const buttons = screen.getAllByRole('button', { name: 'Revoke' });
    expect(buttons[buttons.length - 1].className).toContain('bg-accent-red');
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
    expect(screen.getByText('· expired')).toBeTruthy();
    expect(screen.getByText('1.1.2020').tagName).toBe('TIME');
    expect(screen.getByText('· expires')).toBeTruthy();
    expect(screen.getByText('1.1.2999').getAttribute('datetime')).toBe(
      '2999-01-01T00:00:00.000Z',
    );
    expect(screen.getAllByText('never')).toHaveLength(3);
    expect(screen.getAllByText('2 days ago')[0]!.tagName).toBe('TIME');
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

  it('undoes a new token by revoking it', async () => {
    vi.spyOn(api, 'createApiToken').mockResolvedValue({
      ok: true,
      data: { ...base, id: 't9', name: 'cli', token: 'tahti_secret' },
    });
    const revoke = vi
      .spyOn(api, 'revokeApiToken')
      .mockResolvedValue({ ok: true });
    await renderPanel([]);
    fireEvent.click(screen.getByRole('button', { name: 'New token' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'cli' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create token' }));
    });
    const options = vi
      .mocked(toast.success)
      .mock.calls.find(
        ([message]) => message === 'API token created.',
      )?.[1] as {
      action: { label: string; onClick: () => void };
    };
    expect(options.action.label).toBe('Undo');
    await act(async () => {
      options.action.onClick();
    });
    expect(revoke).toHaveBeenCalledWith('t9');
    expect(screen.queryByDisplayValue('tahti_secret')).toBeNull();
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
