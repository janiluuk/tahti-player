import { useEffect, useState } from 'react';

const SAMPLE_SIZE = 24;

/** Average RGB of an image via a small offscreen canvas. Returns null
 * while loading, on a missing url, or if the canvas is CORS-tainted. */
export function useDominantColor(
  url: string | null | undefined,
): [number, number, number] | null {
  const [color, setColor] = useState<[number, number, number] | null>(null);

  useEffect(() => {
    if (!url) {
      setColor(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) {
        return;
      }
      try {
        const canvas = document.createElement('canvas');
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return;
        }
        ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]!;
          g += data[i + 1]!;
          b += data[i + 2]!;
          n++;
        }
        if (n > 0 && !cancelled) {
          setColor([Math.round(r / n), Math.round(g / n), Math.round(b / n)]);
        }
      } catch {
        if (!cancelled) {
          setColor(null);
        }
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setColor(null);
      }
    };
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url]);

  return color;
}

export function luminance(rgb: [number, number, number]): number {
  return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
}

/** Bright covers get a light frosted label (dark text); dark covers get
 * a dark frosted label (light text) so titles stay readable on glass. */
export function labelTone(
  rgb: [number, number, number] | null,
): 'light' | 'dark' {
  if (!rgb) {
    return 'dark';
  }
  return luminance(rgb) > 0.62 ? 'light' : 'dark';
}
