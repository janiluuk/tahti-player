type RotationEntry = { id: string; soundId: string; title: string };

type StationNowPlaying = { title: string } | null | undefined;

type LatestPlay = { title: string; soundId?: string | null } | null | undefined;

/**
 * Finds the rotation entry that is on air. The station's now-playing carries
 * only a title, so the newest play-log row (which the API treats as the
 * current track and which names its sound) supplies the id when its title
 * agrees with the station. Without that id the match falls back to the title.
 */
export function findOnAirRotationItemId(
  items: readonly RotationEntry[],
  nowPlaying: StationNowPlaying,
  latestPlay: LatestPlay,
): string | null {
  if (!nowPlaying) {
    return null;
  }
  if (latestPlay?.soundId && latestPlay.title === nowPlaying.title) {
    return (
      items.find((item) => item.soundId === latestPlay.soundId)?.id ?? null
    );
  }
  return items.find((item) => item.title === nowPlaying.title)?.id ?? null;
}

/** The entry that plays after `currentId`; the rotation loops back to the top. */
export function nextRotationItemId(
  items: readonly { id: string }[],
  currentId: string | null,
): string | null {
  if (!currentId || items.length < 2) {
    return null;
  }
  const index = items.findIndex((item) => item.id === currentId);
  if (index < 0) {
    return null;
  }
  return items[(index + 1) % items.length]?.id ?? null;
}

/** Orders by `position` when every row has one; otherwise keeps the order
 * the API sent. */
export function sortRotationByPosition<T extends { position?: number | null }>(
  items: readonly T[],
): T[] {
  if (!items.every((item) => typeof item.position === 'number')) {
    return [...items];
  }
  return [...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}
