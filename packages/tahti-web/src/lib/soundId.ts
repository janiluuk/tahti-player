/** Extract sound item UUID from playable / queue ids like `sound:<id>`. */
export function soundIdFromPlayableId(
  id: string | null | undefined,
): string | null {
  if (!id) {
    return null;
  }
  if (id.startsWith('sound:')) {
    const rest = id.slice('sound:'.length);
    return rest || null;
  }
  // bare uuid-ish sound ids from studio tables
  if (/^[0-9a-f-]{8,}$/i.test(id) && !id.includes(':')) {
    return id;
  }
  return null;
}
