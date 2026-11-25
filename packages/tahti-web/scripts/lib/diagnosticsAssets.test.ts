// @vitest-environment jsdom
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { directoryBytes, pruneDiagnosticsAssets } from './diagnosticsAssets';

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'tahti-production-assets-'));
  roots.push(root);
  mkdirSync(join(root, 'map', 'nested'), { recursive: true });
  mkdirSync(join(root, 'assets'));
  writeFileSync(join(root, 'map', 'screen.webp'), 'atlas');
  writeFileSync(join(root, 'map', 'nested', 'step.webp'), 'steps');
  writeFileSync(join(root, 'assets', 'app.js'), 'application');
  writeFileSync(join(root, 'index.html'), 'index');
  return root;
}

describe('pruneDiagnosticsAssets', () => {
  it('removes only the diagnostics atlas from production output', () => {
    const root = fixture();
    const result = pruneDiagnosticsAssets(root, false);
    expect(result.removedBytes).toBe(10);
    expect(directoryBytes(join(root, 'map'))).toBe(0);
    expect(directoryBytes(join(root, 'assets'))).toBe(11);
    expect(result.outputBytes).toBe(16);
  });

  it('keeps the complete atlas in diagnostics output', () => {
    const root = fixture();
    const before = directoryBytes(root);
    const result = pruneDiagnosticsAssets(root, true);
    expect(result.removedBytes).toBe(0);
    expect(directoryBytes(join(root, 'map'))).toBe(10);
    expect(result.outputBytes).toBe(before);
  });

  it('accepts output that has no atlas', () => {
    const root = mkdtempSync(join(tmpdir(), 'tahti-production-assets-'));
    roots.push(root);
    writeFileSync(join(root, 'index.html'), 'index');
    expect(pruneDiagnosticsAssets(root, false)).toEqual({
      removedBytes: 0,
      outputBytes: 5,
    });
  });
});
