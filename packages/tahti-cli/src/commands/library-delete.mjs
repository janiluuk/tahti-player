import { apiSendNoContent, CliError } from '../api-client.mjs';
import { fetchLibrarySound } from './library-show.mjs';

export async function runLibraryDelete(config, id, { yes = false } = {}) {
  if (!id) {
    throw new CliError(
      'Missing sound id.\nRun `tahti library delete --help` for usage.',
    );
  }
  const sound = await fetchLibrarySound(config, id);
  if (!yes) {
    throw new CliError(
      `This deletes "${sound.title}" (${sound.id}) with all its versions, and cannot be undone.\nRun it again with --yes to delete it.`,
    );
  }
  await apiSendNoContent(
    'DELETE',
    `/api/me/sound/${encodeURIComponent(id)}`,
    config,
  );
  return `Deleted "${sound.title}" (${sound.id}).`;
}
