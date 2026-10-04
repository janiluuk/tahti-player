// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../../api/admin/admin-content-reports';
import type { AdminContentReportRow } from '../../../../api/admin/admin-content-reports';
import * as comments from '../../../../api/comments';
import { ContentReportsTab } from './ContentReportsTab';

function report(
  overrides: Partial<AdminContentReportRow>,
): AdminContentReportRow {
  return {
    id: 'r1',
    targetType: 'COMMENT',
    targetId: 'c1',
    reason: 'HARASSMENT',
    details: null,
    status: 'OPEN',
    resolvedByDisplayName: null,
    resolutionNote: null,
    createdAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  };
}

async function renderTab(rows: AdminContentReportRow[]) {
  vi.spyOn(api, 'fetchAdminContentReports').mockResolvedValue({
    data: rows,
    meta: { source: 'api' },
  });
  await act(async () => {
    render(<ContentReportsTab />);
  });
}

describe('ContentReportsTab', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('links to the reported page and quotes a reported comment', async () => {
    await renderTab([
      report({
        targetLabel: 'Comment by @fan',
        targetUrl: '/t/s1',
        targetExcerpt: 'a rude comment',
      }),
    ]);
    const link = screen.getByRole('link', { name: 'Comment by @fan' });
    expect(link.getAttribute('href')).toBe('/t/s1');
    expect(screen.getByText('a rude comment')).toBeTruthy();
  });

  it('says when the reported item is gone', async () => {
    await renderTab([
      report({ targetLabel: null, targetUrl: null, targetExcerpt: null }),
    ]);
    expect(
      screen.getByText('The reported item has been removed.'),
    ).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('shows no target line when the API sends none', async () => {
    await renderTab([report({})]);
    expect(
      screen.queryByText('The reported item has been removed.'),
    ).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('deletes a reported comment after a confirm and closes the report', async () => {
    const remove = vi
      .spyOn(comments, 'deleteComment')
      .mockResolvedValue({ ok: true });
    const resolve = vi
      .spyOn(api, 'resolveContentReport')
      .mockResolvedValue({ ok: true } as never);
    await renderTab([
      report({
        targetLabel: 'Comment by @fan',
        targetUrl: '/t/s1',
        targetExcerpt: 'a rude comment',
      }),
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Delete comment' }));
    expect(remove).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
    });
    expect(remove).toHaveBeenCalledWith('c1');
    expect(resolve).toHaveBeenCalledWith('r1', 'ACTIONED', 'Comment deleted');
  });

  it('offers no delete for other targets or a comment that is gone', async () => {
    await renderTab([
      report({
        id: 'r2',
        targetType: 'SOUND_ITEM',
        targetLabel: 'Night Drive',
        targetUrl: '/t/s1',
      }),
      report({
        id: 'r3',
        targetLabel: null,
        targetUrl: null,
        targetExcerpt: null,
      }),
    ]);
    expect(screen.queryByRole('button', { name: 'Delete comment' })).toBeNull();
  });
});
