import { describe, expect, it } from 'vitest';

import {
  bytesToMb,
  formatBytes,
  formatFileDate,
  formatQuota,
  groupFileRowsByUser,
  usagePercent,
} from './storageFormat';

describe('formatBytes', () => {
  it.each([
    [0, '0 B'],
    [512, '512 B'],
    [1024, '1 KB'],
    [1024 * 1024, '1 MB'],
    [1024 * 1024 * 1024, '1.0 GB'],
    [1.5 * 1024 * 1024 * 1024, '1.5 GB'],
  ])('formats %s bytes as %s', (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected);
  });

  it('renders an em dash for null/undefined/negative/NaN', () => {
    expect(formatBytes(null)).toBe('—');
    expect(formatBytes(undefined)).toBe('—');
    expect(formatBytes(-5)).toBe('—');
    expect(formatBytes(Number.NaN)).toBe('—');
  });
});

describe('bytesToMb', () => {
  it('rounds to the nearest whole MB', () => {
    expect(bytesToMb(1024 * 1024)).toBe(1);
    expect(bytesToMb(1.5 * 1024 * 1024)).toBe(2);
  });
});

describe('formatQuota', () => {
  it('reports Unlimited regardless of the numeric quota when the flag is set', () => {
    expect(formatQuota(500 * 1024 * 1024, true)).toBe('Unlimited');
    expect(formatQuota(null, true)).toBe('Unlimited');
  });

  it('falls back to formatBytes when not unlimited', () => {
    expect(formatQuota(1024 * 1024, false)).toBe('1 MB');
    expect(formatQuota(null, false)).toBe('—');
  });
});

describe('usagePercent', () => {
  it('returns null for unlimited accounts', () => {
    expect(usagePercent(999, 500, true)).toBeNull();
  });

  it('returns null when quota is missing or non-positive', () => {
    expect(usagePercent(100, null, false)).toBeNull();
    expect(usagePercent(100, 0, false)).toBeNull();
  });

  it('computes the percentage otherwise, including over-quota', () => {
    expect(usagePercent(50, 200, false)).toBe(25);
    expect(usagePercent(300, 200, false)).toBe(150);
  });
});

describe('formatFileDate', () => {
  it('formats a valid ISO date', () => {
    expect(formatFileDate('2026-08-10T12:00:00.000Z')).toMatch(/2026/);
  });

  it('renders an em dash for an invalid date string', () => {
    expect(formatFileDate('not-a-date')).toBe('—');
  });
});

describe('groupFileRowsByUser', () => {
  const files = [
    {
      userId: 'u-1',
      username: 'dj-moonlight',
      displayName: 'DJ Moonlight',
      sizeBytes: 100,
    },
    {
      userId: 'u-2',
      username: 'kaiku-collective',
      displayName: 'Kaiku Collective',
      sizeBytes: 500,
    },
    {
      userId: 'u-1',
      username: 'dj-moonlight',
      displayName: 'DJ Moonlight',
      sizeBytes: 50,
    },
  ];

  it("keeps each user's own rows, in the order they were passed in", () => {
    const groups = groupFileRowsByUser(files);
    expect(groups.map((g) => g.userId)).toEqual(['u-2', 'u-1']);
    const dj = groups.find((g) => g.userId === 'u-1')!;
    expect(dj.files).toEqual([files[0], files[2]]);
    expect(dj).toMatchObject({ totalBytes: 150, fileCount: 2 });
  });

  it('treats a null sizeBytes as 0 rather than dropping the file', () => {
    const groups = groupFileRowsByUser([
      {
        userId: 'u-3',
        username: 'no-size',
        displayName: 'No Size',
        sizeBytes: null,
      },
    ]);
    expect(groups[0]).toMatchObject({ totalBytes: 0, fileCount: 1 });
  });

  it('returns an empty array for an empty input', () => {
    expect(groupFileRowsByUser([])).toEqual([]);
  });
});
