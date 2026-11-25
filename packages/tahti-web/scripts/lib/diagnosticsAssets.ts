import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function directoryBytes(path: string): number {
  if (!existsSync(path)) {
    return 0;
  }
  return readdirSync(path, { withFileTypes: true }).reduce((total, entry) => {
    const entryPath = join(path, entry.name);
    return (
      total +
      (entry.isDirectory()
        ? directoryBytes(entryPath)
        : statSync(entryPath).size)
    );
  }, 0);
}

export function pruneDiagnosticsAssets(
  outDir: string,
  diagnostics: boolean,
): { removedBytes: number; outputBytes: number } {
  const mapDir = join(outDir, 'map');
  const removedBytes = diagnostics ? 0 : directoryBytes(mapDir);
  if (!diagnostics && existsSync(mapDir)) {
    rmSync(mapDir, { recursive: true, force: true });
  }
  return { removedBytes, outputBytes: directoryBytes(outDir) };
}
