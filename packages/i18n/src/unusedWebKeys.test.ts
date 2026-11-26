import { describe, expect, it } from 'vitest';

import {
  collectKeys,
  findDynamicPrefixes,
  findUnusedWebKeys,
} from '../scripts/unusedWebKeys.mjs';

describe('findUnusedWebKeys', () => {
  it('flags keys no source mentions', () => {
    const source = `t('nav.listen'); i18n.t('web:seo.title');`;
    expect(
      findUnusedWebKeys({
        keys: ['nav.listen', 'seo.title', 'nav.gone'],
        source,
        allowlist: [],
      }),
    ).toEqual(['nav.gone']);
  });

  it('treats plural variants as used when the base key is', () => {
    expect(
      findUnusedWebKeys({
        keys: ['library.plays_one', 'library.plays_other'],
        source: `t('library.plays', { count })`,
        allowlist: [],
      }),
    ).toEqual([]);
  });

  it('does not match a key that is only a prefix of a used key', () => {
    expect(
      findUnusedWebKeys({
        keys: ['studio.title', 'studio.titleLong'],
        source: `t('studio.titleLong')`,
        allowlist: [],
      }),
    ).toEqual(['studio.title']);
  });

  it('keeps keys built from template literals and allowlisted prefixes', () => {
    const source = 't(`sortSounds.mode.${mode}`); t(`library.tab${name}`);';
    expect(
      findUnusedWebKeys({
        keys: [
          'sortSounds.mode.newest',
          'library.tabSounds',
          'adminPages.users',
          'other.key',
        ],
        source,
        allowlist: ['adminPages.'],
      }),
    ).toEqual(['other.key']);
  });

  it('reads template-literal prefixes, with or without the web: namespace', () => {
    expect(findDynamicPrefixes('t(`a.b.${x}`); i18n.t(`web:c.d${y}`)')).toEqual(
      ['a.b.', 'c.d'],
    );
  });

  it('flattens nested catalogs to dotted keys', () => {
    expect(collectKeys({ a: { b: 'x', c: { d: 'y' } } })).toEqual([
      'a.b',
      'a.c.d',
    ]);
  });
});
