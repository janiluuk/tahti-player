import { describe, expect, it } from 'vitest';

import type { EditList } from '../../api/studio-types';
import {
  addPluginToChain,
  chainForRender,
  removePluginFromChain,
  reorderPluginChain,
  withLegacyChain,
} from './chain';

const editList = {
  pluginChain: ['eq', 'comp'],
  eq: { enabled: false, bands: [] },
  comp: { enabled: true, thresholdDb: -18, ratio: 4 },
} as unknown as EditList;

describe('audio FX chain host operations', () => {
  it('adds a plugin once and enables it', () => {
    const next = addPluginToChain(editList, 'limiter');
    expect(next.pluginChain).toEqual(['eq', 'comp', 'limiter']);
    expect(next.limiter?.enabled).toBe(true);
  });

  it('removes a plugin and disables it', () => {
    const next = removePluginFromChain(editList, 'comp');
    expect(next.pluginChain).toEqual(['eq']);
    expect(next.comp?.enabled).toBe(false);
  });

  it('reorders the existing chain without mutating the source', () => {
    const next = reorderPluginChain(editList, 'comp', 'eq');
    expect(next.pluginChain).toEqual(['comp', 'eq']);
    expect(editList.pluginChain).toEqual(['eq', 'comp']);
  });
});

describe('withLegacyChain / chainForRender', () => {
  it('rebuilds a missing chain from enabled plugins, in the old render order', () => {
    const legacy = {
      eq: { enabled: true, bands: [] },
      comp: { enabled: false },
      limiter: { enabled: true },
      filter: { enabled: true },
    } as unknown as EditList;
    expect(withLegacyChain(legacy).pluginChain).toEqual([
      'filter',
      'eq',
      'limiter',
    ]);
    expect(withLegacyChain(editList)).toBe(editList);
  });

  it('renders only chained plugins whose add-on is installed', () => {
    expect(chainForRender(editList, ['comp']).pluginChain).toEqual(['comp']);
    expect(chainForRender(editList, []).pluginChain).toEqual([]);
  });
});
