import { describe, expect, it } from 'vitest';

import type { MapComment } from '../stores/mapNotesStore';
import { commentsToCsv } from './mapCommentsCsv';

describe('commentsToCsv', () => {
  it('includes status and route columns for open and resolved rows', () => {
    const comments: MapComment[] = [
      {
        id: '1',
        kind: 'feature',
        targetId: 'queue',
        title: 'Queue',
        text: 'Needs drag handles',
        submittedAt: '2026-09-23T10:00:00.000Z',
      },
      {
        id: '2',
        kind: 'page',
        targetId: '/admin',
        title: '/admin',
        text: 'Monitoring link missing',
        submittedAt: '2026-10-20T10:00:00.000Z',
        resolvedAt: '2026-10-20T11:00:00.000Z',
      },
    ];
    const csv = commentsToCsv(comments);
    expect(csv).toContain('status');
    expect(csv).toContain('route');
    expect(csv).toContain('"open"');
    expect(csv).toContain('"resolved"');
    expect(csv).toContain('Needs drag handles');
    expect(csv).toContain('Monitoring link missing');
  });
});
