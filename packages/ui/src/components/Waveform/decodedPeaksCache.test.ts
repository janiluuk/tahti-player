import {
  audioVersionFromUrl,
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

describe('decodedPeaksCache audio checks', () => {
  afterEach(() => clearDecodedPeaksForTests());

  const channel = Array.from({ length: 600 }, (_, i) => (i % 7) / 7);

  it('keeps peaks while the audio is the same', () => {
    setDecodedPeaks('t1', {
      peaks: [channel],
      duration: 180,
      version: 'https://cdn.example/a.mp3',
    });
    expect(
      getDecodedPeaks('t1', {
        durationSec: 180.4,
        version: 'https://cdn.example/a.mp3',
      }),
    ).toBeDefined();
  });

  it('drops peaks when the duration changed', () => {
    setDecodedPeaks('t1', { peaks: [channel], duration: 180 });
    expect(getDecodedPeaks('t1', { durationSec: 240 })).toBeUndefined();
    expect(localStorage.getItem('tahti.decodedPeaks.v1')).not.toContain('t1');
  });

  it('drops peaks when the audio file changed', () => {
    setDecodedPeaks('t1', {
      peaks: [channel],
      duration: 180,
      version: 'https://cdn.example/a.mp3',
    });
    expect(
      getDecodedPeaks('t1', { version: 'https://cdn.example/b.mp3' }),
    ).toBeUndefined();
  });

  it('ignores the signed query when naming the audio file', () => {
    expect(
      audioVersionFromUrl('https://cdn.example/a.mp3?X-Amz-Signature=1'),
    ).toBe(audioVersionFromUrl('https://cdn.example/a.mp3?X-Amz-Signature=2'));
    expect(audioVersionFromUrl('/media/a.mp3?t=1')).toBe('/media/a.mp3');
  });
});
