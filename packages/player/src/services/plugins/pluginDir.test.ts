import '../../test/mocks/plugin-fs';

import { join } from '@tauri-apps/api/path';
import * as fs from '@tauri-apps/plugin-fs';
import { type Mock } from 'vitest';

import { PluginFsMock } from '../../test/mocks/plugin-fs';
import { getPluginsDir, removeManagedPluginInstall } from './pluginDir';

const APP_DATA_DIR = '/home/user/.local/share/com.nuclearplayer';

// installPluginToManagedDir (the real producer of registry `path` values)
// returns join(appDataDir(), getManagedPluginPath(...)) — an absolute path.
// getManagedPluginPath itself is relative to BaseDirectory.AppData, so tests
// must build the same absolute shape real callers pass in.
const absoluteManagedPath = async (id: string, version: string) =>
  join(await getPluginsDir(), id, version);

describe('removeManagedPluginInstall', () => {
  beforeEach(() => {
    PluginFsMock.reset();
    PluginFsMock.setRemove();
  });

  it('removes a path inside the managed plugins directory', async () => {
    const managedPath = await absoluteManagedPath('demo-plugin', '1.0.0');

    await removeManagedPluginInstall(managedPath);

    expect(fs.remove).toHaveBeenCalledWith('plugins/demo-plugin/1.0.0', {
      recursive: true,
      baseDir: APP_DATA_DIR,
    });
  });

  it('refuses to delete a path entirely outside the app data directory', async () => {
    await expect(removeManagedPluginInstall('/etc/passwd')).rejects.toThrow(
      'Path is not within the managed plugins directory. For safety, refusing to delete.',
    );
    expect(fs.remove).not.toHaveBeenCalled();
  });

  it('refuses to delete a path inside app data but outside the plugins directory', async () => {
    await expect(
      removeManagedPluginInstall(`${APP_DATA_DIR}/config.json`),
    ).rejects.toThrow(
      'Path is not within the managed plugins directory. For safety, refusing to delete.',
    );
    expect(fs.remove).not.toHaveBeenCalled();
  });

  it('refuses a sibling directory that only shares the plugins dir as a string prefix', async () => {
    const pluginsDir = await getPluginsDir();

    await expect(
      removeManagedPluginInstall(`${pluginsDir}-evil/whatever`),
    ).rejects.toThrow(
      'Path is not within the managed plugins directory. For safety, refusing to delete.',
    );
    expect(fs.remove).not.toHaveBeenCalled();
  });

  it('does not throw when the underlying fs.remove call fails (swallowed + reported)', async () => {
    const managedPath = await absoluteManagedPath('demo-plugin', '1.0.0');
    (fs.remove as Mock).mockRejectedValueOnce(new Error('disk error'));

    await expect(
      removeManagedPluginInstall(managedPath),
    ).resolves.toBeUndefined();
  });
});
