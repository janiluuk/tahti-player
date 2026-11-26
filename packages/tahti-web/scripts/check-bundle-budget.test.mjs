import { describe, expect, it } from 'vitest';

import { initialChunkKeys } from './check-bundle-budget.mjs';

describe('check-bundle-budget', () => {
  it('counts the entry, its boot-time dynamic imports and their static imports', () => {
    const manifest = {
      'index.html': {
        file: 'assets/index.js',
        isEntry: true,
        imports: ['_preload.js'],
        dynamicImports: ['src/TahtiApp.tsx'],
      },
      '_preload.js': { file: 'assets/preload.js' },
      'src/TahtiApp.tsx': {
        file: 'assets/TahtiApp.js',
        imports: ['_react.js'],
        dynamicImports: ['src/views/AdminView.tsx'],
      },
      '_react.js': { file: 'assets/react.js', imports: ['_preload.js'] },
      'src/views/AdminView.tsx': { file: 'assets/AdminView.js' },
    };
    expect(initialChunkKeys(manifest).sort()).toEqual([
      '_preload.js',
      '_react.js',
      'index.html',
      'src/TahtiApp.tsx',
    ]);
  });

  it('refuses a manifest without the HTML entry', () => {
    expect(() => initialChunkKeys({})).toThrow(/index.html/);
  });
});
