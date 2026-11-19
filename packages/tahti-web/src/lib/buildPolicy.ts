type BuildEnvironment = Record<string, string | undefined>;

export function validateProductionBuildEnvironment(
  command: 'build' | 'serve',
  env: BuildEnvironment,
): void {
  if (command !== 'build') {
    return;
  }
  const unsafeKey = ['VITE_FORCE_MOCK', 'VITE_ALLOW_MOCK_FALLBACK'].find(
    (key) => env[key] === '1',
  );
  if (unsafeKey) {
    throw new Error(`${unsafeKey}=1 is not allowed in a production build`);
  }
}

export const diagnosticsEnabled =
  Boolean(import.meta.env?.DEV) ||
  import.meta.env?.VITE_ENABLE_DIAGNOSTICS === '1';

/** Strings that must not ship in a production JS bundle (mock-only fixtures). */
export const PRODUCTION_MOCK_MARKERS = [
  'lp-mock-scheduled',
  'AURORA42',
  'reason: VITE_FORCE_MOCK',
] as const;

export function assertProductionBundleFreeOfMockMarkers(bundleText: string) {
  for (const marker of PRODUCTION_MOCK_MARKERS) {
    if (bundleText.includes(marker)) {
      throw new Error(`Production bundle contains mock marker: ${marker}`);
    }
  }
}
