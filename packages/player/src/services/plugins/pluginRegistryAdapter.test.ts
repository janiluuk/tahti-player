import { describe, expect, it } from 'vitest';

import { pluginRegistryStore } from './pluginRegistryAdapter';
import type { PluginRegistryEntry } from './pluginRegistryContract';

/** Contract tests for PluginRegistryStore, run against today's default
 * (LazyStore-backed) adapter. This is the stable boundary — a future
 * remote/package-backed implementation must pass the same suite before
 * `createLazyStorePluginRegistry` is swapped out (see ../tahti-org's
 * docs/todo/plugin-registry-extraction.md §5, §6). Distinct plugin ids
 * per test (no shared reset hook) to avoid cross-test key collisions,
 * matching test/utils/seedPlugins.ts's existing convention. */

const entryFor = (
  id: string,
  overrides: Partial<PluginRegistryEntry> = {},
): PluginRegistryEntry => ({
  id,
  version: '1.0.0',
  path: `/home/user/.local/share/com.nuclearplayer/plugins/${id}/1.0.0`,
  installationMethod: 'store',
  enabled: false,
  installedAt: '2025-01-01T00:00:00.000Z',
  lastUpdatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

describe('pluginRegistryStore (contract)', () => {
  it('upsert then get round-trips the entry', async () => {
    await pluginRegistryStore.upsert(entryFor('contract-roundtrip'));
    const entry = await pluginRegistryStore.get('contract-roundtrip');
    expect(entry).toMatchObject({
      id: 'contract-roundtrip',
      version: '1.0.0',
      installationMethod: 'store',
    });
  });

  it('get returns undefined for an id that was never upserted', async () => {
    const entry = await pluginRegistryStore.get('contract-never-existed');
    expect(entry).toBeUndefined();
  });

  it('list includes every upserted entry', async () => {
    await pluginRegistryStore.upsert(entryFor('contract-list-a'));
    await pluginRegistryStore.upsert(entryFor('contract-list-b'));
    const ids = (await pluginRegistryStore.list()).map((e) => e.id);
    expect(ids).toContain('contract-list-a');
    expect(ids).toContain('contract-list-b');
  });

  it('setEnabled persists the flag on an existing entry', async () => {
    await pluginRegistryStore.upsert(
      entryFor('contract-enable', { enabled: false }),
    );
    await pluginRegistryStore.setEnabled('contract-enable', true);
    const entry = await pluginRegistryStore.get('contract-enable');
    expect(entry?.enabled).toBe(true);
  });

  it('setEnabled on a missing id is a no-op, not a throw', async () => {
    await expect(
      pluginRegistryStore.setEnabled('contract-missing-enable', true),
    ).resolves.toBeUndefined();
    expect(
      await pluginRegistryStore.get('contract-missing-enable'),
    ).toBeUndefined();
  });

  it('setWarnings persists a non-empty warnings array', async () => {
    await pluginRegistryStore.upsert(entryFor('contract-warnings'));
    await pluginRegistryStore.setWarnings('contract-warnings', [
      'unknown permission: fs',
    ]);
    const entry = await pluginRegistryStore.get('contract-warnings');
    expect(entry?.warnings).toEqual(['unknown permission: fs']);
  });

  it('setWarnings with an empty array omits the field entirely', async () => {
    await pluginRegistryStore.upsert(
      entryFor('contract-clear-warnings', { warnings: ['stale warning'] }),
    );
    await pluginRegistryStore.setWarnings('contract-clear-warnings', []);
    const entry = await pluginRegistryStore.get('contract-clear-warnings');
    expect(entry?.warnings).toBeUndefined();
  });

  it('remove deletes the entry', async () => {
    await pluginRegistryStore.upsert(entryFor('contract-remove'));
    await pluginRegistryStore.remove('contract-remove');
    expect(await pluginRegistryStore.get('contract-remove')).toBeUndefined();
  });

  it('remove on an orphan id (never upserted) does not throw', async () => {
    await expect(
      pluginRegistryStore.remove('contract-orphan-remove'),
    ).resolves.toBeUndefined();
  });

  it('preserves a dev install entry’s originalPath through the adapter', async () => {
    await pluginRegistryStore.upsert(
      entryFor('contract-dev-install', {
        installationMethod: 'dev',
        originalPath: '/home/user/dev/my-plugin',
      }),
    );
    const entry = await pluginRegistryStore.get('contract-dev-install');
    expect(entry?.installationMethod).toBe('dev');
    expect(entry?.originalPath).toBe('/home/user/dev/my-plugin');
  });
});
