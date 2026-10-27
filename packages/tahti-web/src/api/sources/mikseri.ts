import { isForceMock } from '../mode';
import { requestJson } from '../request-json';

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export type MikseriTrackInput = {
  collectionId: string;
  trackUrl: string;
  title: string;
  artistName: string;
  genre?: string;
  rightsConfirmed: true;
};

export async function addMikseriTrack(
  input: MikseriTrackInput,
): Promise<Result<{ soundId: string; embedUrl: string }>> {
  if (isForceMock()) {
    return {
      ok: true,
      data: {
        soundId: `mikseri-${input.trackUrl}`,
        embedUrl: input.trackUrl,
      },
    };
  }
  try {
    const { data } = await requestJson<{
      soundId: string;
      embedUrl: string;
    }>('/api/v1/imports/mikseri/add', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Could not add the Mikseri track',
    };
  }
}
