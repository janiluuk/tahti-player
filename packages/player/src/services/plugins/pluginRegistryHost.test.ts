import '../../test/mocks/plugin-fs';

import { mockIPC } from '@tauri-apps/api/mocks';

import { usePluginStore } from '../../stores/pluginStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { MarketplacePluginBuilder } from '../../test/builders/MarketplacePluginBuilder';
import { PluginStateBuilder } from '../../test/builders/PluginStateBuilder';
import { TahtiPluginBuilder } from '../../test/builders/TahtiPluginBuilder';
import { FetchMock } from '../../test/mocks/fetch';
import { PluginFsMock } from '../../test/mocks/plugin-fs';
import { resetInMemoryTauriStore } from '../../test/utils/inMemoryTauriStore';
import { seedPlugin, seedRegistryEntry } from '../../test/utils/seedPlugins';
import { createPluginFolder } from '../../test/utils/testPluginFolder';
import { providersHost } from '../providersHost';
import { getRegistryEntry } from './pluginRegistry';
import type { MarketplacePluginRelease } from './pluginRegistryContract';
import { pluginRegistryHost } from './pluginRegistryHost';

/** Contract tests for PluginRegistryHost, run against today's default
 * façade (composes pluginBootstrap/pluginStore/pluginAutoUpdate without
 * changing their behavior). This is the stable boundary callers migrate to
 * in §5.4 — a future implementation must pass the same suite before
 * swapping in, mirroring pluginRegistryAdapter.test.ts's role for
 * PluginRegistryStore. Distinct plugin ids per test, same convention.
 * See ../tahti-org's docs/todo/plugin-registry-extraction.md §6. */

const DOWNLOAD_BASE =
  '/home/user/.local/share/com.nuclearplayer/plugins/.downloads';

const release = (
  overrides: Partial<MarketplacePluginRelease> = {},
): MarketplacePluginRelease => ({
  id: 'host-marketplace',
  version: '1.0.0',
  downloadUrl: 'https://example.com/host-marketplace.zip',
  ...overrides,
});

describe('pluginRegistryHost (contract)', () => {
  beforeEach(() => {
    resetInMemoryTauriStore();
    PluginFsMock.reset();
    FetchMock.init();
    usePluginStore.setState({ plugins: {} });
    mockIPC((cmd) => {
      if (cmd === 'copy_dir_recursive') {
        return true;
      }
    });
  });

  describe('installFromMarketplace', () => {
    it('downloads, registers, loads, and enables the plugin', async () => {
      createPluginFolder(`${DOWNLOAD_BASE}/host-marketplace`, {
        id: 'host-marketplace',
        version: '1.0.0',
      });

      await pluginRegistryHost.installFromMarketplace(release());

      const plugin = usePluginStore.getState().getPlugin('host-marketplace');
      expect(plugin?.enabled).toBe(true);
      expect(plugin?.installationMethod).toBe('store');
    });

    it('locks the final registry entry shape after the load-triggered re-upsert', async () => {
      createPluginFolder(`${DOWNLOAD_BASE}/host-shape`, {
        id: 'host-shape',
        version: '2.0.0',
      });

      await pluginRegistryHost.installFromMarketplace(
        release({
          id: 'host-shape',
          version: '2.0.0',
          downloadUrl: 'https://example.com/host-shape.zip',
        }),
      );

      const entry = await getRegistryEntry('host-shape');
      expect(entry?.installationMethod).toBe('store');
      expect(entry?.enabled).toBe(true);
      expect(entry?.path).toContain('host-shape/2.0.0');
    });

    it('cleans up the download even when the post-extract load/enable step fails', async () => {
      // Deliberately no createPluginFolder for the extracted path: metadata
      // load inside loadPluginFromPath fails and is swallowed there (matches
      // pluginStore.tsx's own try/catch), so the plugin is never added to
      // the store — the subsequent enable() then throws "not found", inside
      // the same try block downloadAndExtractPlugin sits outside of (matches
      // useInstallPlugin.ts's real scoping: a download failure has nothing
      // to clean up yet, but a failure after extraction must still clean up).
      const removeMock = PluginFsMock.setRemove();

      await expect(
        pluginRegistryHost.installFromMarketplace(
          release({
            id: 'host-fails',
            downloadUrl: 'https://example.com/host-fails.zip',
          }),
        ),
      ).rejects.toThrow('not found');

      expect(removeMock).toHaveBeenCalled();
    });
  });

  describe('installFromPath', () => {
    it('installs a dev plugin', async () => {
      createPluginFolder('/plugins/host-dev', { id: 'host-dev' });

      await pluginRegistryHost.installFromPath('/plugins/host-dev');

      const plugin = usePluginStore.getState().getPlugin('host-dev');
      expect(plugin?.installationMethod).toBe('dev');
      expect(plugin?.originalPath).toBe('/plugins/host-dev');
    });
  });

  describe('enable / disable', () => {
    it('enable calls onEnable and persists to the registry', async () => {
      const onEnable = vi.fn();
      await seedPlugin({ id: 'host-enable' });
      usePluginStore.setState((state) => ({
        plugins: {
          ...state.plugins,
          'host-enable': new PluginStateBuilder()
            .withId('host-enable')
            .withInstance(
              new TahtiPluginBuilder().withOnEnable(onEnable).build(),
            )
            .build(),
        },
      }));

      await pluginRegistryHost.enable('host-enable');

      expect(onEnable).toHaveBeenCalled();
      expect((await getRegistryEntry('host-enable'))?.enabled).toBe(true);
    });

    it('disable calls onDisable and persists to the registry', async () => {
      const onDisable = vi.fn();
      await seedPlugin({ id: 'host-disable', enabled: true });
      usePluginStore.setState((state) => ({
        plugins: {
          ...state.plugins,
          'host-disable': new PluginStateBuilder()
            .withId('host-disable')
            .withEnabled(true)
            .withInstance(
              new TahtiPluginBuilder().withOnDisable(onDisable).build(),
            )
            .build(),
        },
      }));

      await pluginRegistryHost.disable('host-disable');

      expect(onDisable).toHaveBeenCalled();
      expect((await getRegistryEntry('host-disable'))?.enabled).toBe(false);
    });
  });

  describe('reloadDev', () => {
    it('reloads a dev plugin and restores its enabled state', async () => {
      createPluginFolder('/plugins/host-reload', {
        id: 'host-reload',
        version: '1.0.0',
      });
      await pluginRegistryHost.installFromPath('/plugins/host-reload');
      await pluginRegistryHost.enable('host-reload');

      createPluginFolder('/plugins/host-reload', {
        id: 'host-reload',
        version: '1.1.0',
      });
      await pluginRegistryHost.reloadDev('host-reload');

      const plugin = usePluginStore.getState().getPlugin('host-reload');
      expect(plugin?.metadata.version).toBe('1.1.0');
      expect(plugin?.enabled).toBe(true);
    });

    it('rejects reloading a store plugin', async () => {
      usePluginStore.setState({
        plugins: {
          'host-store-reload': new PluginStateBuilder()
            .withId('host-store-reload')
            .withInstallationMethod('store')
            .withOriginalPath(undefined)
            .withInstance(new TahtiPluginBuilder().build())
            .build(),
        },
      });

      await expect(
        pluginRegistryHost.reloadDev('host-store-reload'),
      ).rejects.toThrow('cannot be reloaded');
    });
  });

  describe('remove', () => {
    it('removes plugin files and the registry entry', async () => {
      createPluginFolder('/plugins/host-remove', { id: 'host-remove' });
      await pluginRegistryHost.installFromPath('/plugins/host-remove');

      await pluginRegistryHost.remove('host-remove');

      expect(
        usePluginStore.getState().getPlugin('host-remove'),
      ).toBeUndefined();
      expect(await getRegistryEntry('host-remove')).toBeUndefined();
    });

    it('removes an orphan registry entry with no in-memory plugin', async () => {
      await seedRegistryEntry({ id: 'host-orphan' });

      await pluginRegistryHost.remove('host-orphan');

      expect(await getRegistryEntry('host-orphan')).toBeUndefined();
    });
  });

  describe('checkAndUpdateStorePlugins', () => {
    it('updates an outdated store plugin against the marketplace catalog', async () => {
      useSettingsStore.getState().setValue('core.plugins.autoUpdate', true);
      await seedPlugin({ id: 'host-update' });

      FetchMock.get('plugins.json', {
        version: 1,
        plugins: [
          new MarketplacePluginBuilder()
            .withId('host-update')
            .withVersion('2.0.0')
            .withDownloadUrl('https://example.com/host-update.zip')
            .build(),
        ],
      });
      createPluginFolder(`${DOWNLOAD_BASE}/host-update`, {
        id: 'host-update',
        version: '2.0.0',
      });

      await pluginRegistryHost.checkAndUpdateStorePlugins();

      expect(
        usePluginStore.getState().getPlugin('host-update')?.metadata.version,
      ).toBe('2.0.0');
    });
  });

  describe('hydrateFromRegistry', () => {
    it('loads registry entries and resolves active providers afterward', async () => {
      // hydrateFromRegistry fires off checkAndUpdatePlugins in the
      // background (not awaited); disable it so this test isn't racing an
      // unmocked marketplace fetch it doesn't care about.
      useSettingsStore.getState().setValue('core.plugins.autoUpdate', false);
      createPluginFolder(
        '/home/user/.local/share/com.nuclearplayer/plugins/host-hydrate/1.0.0',
        { id: 'host-hydrate', version: '1.0.0' },
      );
      await seedRegistryEntry({ id: 'host-hydrate', enabled: true });

      const resolveSpy = vi.spyOn(providersHost, 'resolveActiveOnBootstrap');

      await pluginRegistryHost.hydrateFromRegistry();

      expect(usePluginStore.getState().getPlugin('host-hydrate')?.enabled).toBe(
        true,
      );
      expect(resolveSpy).toHaveBeenCalledTimes(1);

      resolveSpy.mockRestore();
    });
  });
});
