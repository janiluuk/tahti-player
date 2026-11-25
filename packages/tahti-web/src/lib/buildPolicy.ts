type BuildEnvironment = Record<string, string | undefined>;

/** Vite mode of the mock-data bundle the CI e2e journeys run against. */
export const E2E_MOCK_MODE = 'e2e-mock';

export function validateProductionBuildEnvironment(
  command: 'build' | 'serve',
  env: BuildEnvironment,
  mode = 'production',
): void {
  if (command !== 'build') {
    return;
  }
  if (mode === E2E_MOCK_MODE) {
    // The only build allowed to bake in mock data; it must never double as
    // a deploy build.
    if (env.TAHTI_WEB_DEPLOY_PROFILE) {
      throw new Error(
        `TAHTI_WEB_DEPLOY_PROFILE cannot be set for an ${E2E_MOCK_MODE} build`,
      );
    }
    if (env.VITE_FORCE_MOCK !== '1') {
      throw new Error(`${E2E_MOCK_MODE} builds need VITE_FORCE_MOCK=1`);
    }
    return;
  }
  const unsafeKey = ['VITE_FORCE_MOCK', 'VITE_ALLOW_MOCK_FALLBACK'].find(
    (key) => env[key] === '1',
  );
  if (unsafeKey) {
    throw new Error(`${unsafeKey}=1 is not allowed in a production build`);
  }
  const profile = env.TAHTI_WEB_DEPLOY_PROFILE;
  if (profile && profile !== 'prod' && profile !== 'beta') {
    throw new Error(
      `TAHTI_WEB_DEPLOY_PROFILE must be prod or beta (got: ${profile})`,
    );
  }
  if (profile === 'prod' && env.VITE_ENABLE_DIAGNOSTICS === '1') {
    throw new Error('Production deploys cannot enable diagnostics');
  }
  if (profile === 'beta' && env.VITE_ENABLE_DIAGNOSTICS !== '1') {
    throw new Error('Beta deploys must enable diagnostics');
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
