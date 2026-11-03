import {
  clearDecodedPeaksForTests,
  getDecodedPeaks,
  setDecodedPeaks,
} from './decodedPeaksCache';

describe('decodedPeaksCache', () => {
  afterEach(() => clearDecodedPeaksForTests());

  it('keeps decoded peaks under a stable key across a reload', () => {
    const channel = Array.from({ length: 2048 }, (_, i) => (i % 10) / 10);
    setDecodedPeaks('sound:abc', { peaks: [channel], duration: 180 });

    const raw = localStorage.getItem('tahti.decodedPeaks.v1');
    expect(raw).toContain('sound:abc');

    // Simulate a reload: drop the in-memory copy, keep localStorage.
    const saved = raw!;
    clearDecodedPeaksForTests();
    localStorage.setItem('tahti.decodedPeaks.v1', saved);

    const hit = getDecodedPeaks('sound:abc');
    expect(hit?.duration).toBe(180);
    expect(hit?.peaks[0]).toHaveLength(512);
    expect(Math.max(...hit!.peaks[0]!)).toBeCloseTo(0.9);
  });

  it('misses for an unknown key', () => {
    expect(getDecodedPeaks('nope')).toBeUndefined();
  });
});
