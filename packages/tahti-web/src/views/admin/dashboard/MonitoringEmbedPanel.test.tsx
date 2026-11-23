// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '../../../test/renderWithRouter';
import { MonitoringEmbedPanel } from './MonitoringEmbedPanel';

function cspViolation(blockedURI: string) {
  const event = new Event('securitypolicyviolation');
  Object.assign(event, {
    blockedURI,
    effectiveDirective: 'frame-src',
    violatedDirective: 'frame-src',
  });
  return event;
}

describe('MonitoringEmbedPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the Grafana frame while Grafana answers', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null));
    await renderWithRouter(<MonitoringEmbedPanel />, {
      paths: ['/admin/logs'],
    });
    const frame = screen.getByTitle(/vital services/i);
    await act(async () => {
      fireEvent.load(frame);
    });
    expect(frame).toHaveAttribute('data-state', 'loaded');
    expect(fetch).toHaveBeenCalledWith(
      'https://grafana.tahti.live/api/health',
      expect.objectContaining({ mode: 'no-cors' }),
    );
    expect(screen.queryByTestId('grafana-embed-fallback')).toBeNull();
  });

  it('swaps the frame for an Open Grafana panel when Grafana is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'));
    await renderWithRouter(<MonitoringEmbedPanel />, {
      paths: ['/admin/logs'],
    });
    const fallback = await screen.findByTestId('grafana-embed-fallback');
    expect(fallback.textContent).toContain('did not answer');
    expect(screen.queryByTitle(/vital services/i)).toBeNull();
    expect(
      screen.getAllByRole('link', { name: /Open Grafana/ }).length,
    ).toBeGreaterThan(1);
  });

  it('swaps the frame for an Open Grafana panel when the page CSP blocks it', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null));
    await renderWithRouter(<MonitoringEmbedPanel />, {
      paths: ['/admin/logs'],
    });
    const frame = screen.getByTitle(/vital services/i);
    await act(async () => {
      document.dispatchEvent(cspViolation('https://grafana.tahti.live/d/x'));
      fireEvent.load(frame);
    });
    const fallback = screen.getByTestId('grafana-embed-fallback');
    expect(fallback.textContent).toContain('blocked');
    expect(screen.queryByTitle(/vital services/i)).toBeNull();
  });

  it('ignores CSP reports for other hosts', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null));
    await renderWithRouter(<MonitoringEmbedPanel />, {
      paths: ['/admin/logs'],
    });
    await act(async () => {
      document.dispatchEvent(cspViolation('https://example.com/'));
    });
    expect(screen.queryByTestId('grafana-embed-fallback')).toBeNull();
  });
});
