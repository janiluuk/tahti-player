import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDesktopMcpStore } from '../lib/mcp/desktop';
import { McpIntegrationRow } from './McpIntegrationRow';

beforeEach(() => {
  localStorage.clear();
  useDesktopMcpStore.setState({
    enabled: false,
    url: null,
    error: null,
    busy: false,
  });
});

afterEach(() => {
  globalThis.__TAHTI_NATIVE_MCP__ = undefined;
});

describe('McpIntegrationRow', () => {
  it('starts the server, shows its URL and remembers it is on', async () => {
    const start = vi.fn(async () => 8801);
    globalThis.__TAHTI_NATIVE_MCP__ = { start, stop: vi.fn(async () => {}) };
    render(<McpIntegrationRow />);
    fireEvent.click(screen.getByRole('switch', { name: 'MCP server' }));
    expect(await screen.findByText('http://127.0.0.1:8801/mcp')).toBeTruthy();
    expect(start).toHaveBeenCalledOnce();
    expect(localStorage.getItem('tahti-desktop-mcp-enabled')).toBe('1');
  });

  it('stops the server and forgets the URL', async () => {
    const stop = vi.fn(async () => {});
    globalThis.__TAHTI_NATIVE_MCP__ = { start: async () => 8800, stop };
    useDesktopMcpStore.setState({
      enabled: true,
      url: 'http://127.0.0.1:8800/mcp',
    });
    render(<McpIntegrationRow />);
    fireEvent.click(screen.getByRole('switch', { name: 'MCP server' }));
    await vi.waitFor(() => expect(stop).toHaveBeenCalledOnce());
    await vi.waitFor(() =>
      expect(screen.queryByText('http://127.0.0.1:8800/mcp')).toBeNull(),
    );
    expect(localStorage.getItem('tahti-desktop-mcp-enabled')).toBeNull();
  });

  it('says why the server could not start and stays off', async () => {
    globalThis.__TAHTI_NATIVE_MCP__ = {
      start: async () => {
        throw new Error('All ports 8800-8809 are taken');
      },
      stop: async () => {},
    };
    render(<McpIntegrationRow />);
    fireEvent.click(screen.getByRole('switch', { name: 'MCP server' }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'All ports 8800-8809 are taken',
    );
    expect(useDesktopMcpStore.getState().enabled).toBe(false);
  });
});
