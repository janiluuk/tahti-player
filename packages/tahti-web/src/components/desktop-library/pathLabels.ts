/** Last path segment for display, for either `/` or `\\` separators. */
export function basename(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const segments = normalized.split('/');
  return segments[segments.length - 1] || path;
}
