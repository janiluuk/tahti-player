import { describe, expect, it } from 'vitest';

import {
  assertProductionBundleFreeOfMockMarkers,
  PRODUCTION_MOCK_MARKERS,
  validateProductionBuildEnvironment,
} from './buildPolicy';

describe('validateProductionBuildEnvironment', () => {
  it('accepts development and strict production builds', () => {
    expect(() =>
      validateProductionBuildEnvironment('serve', {
        VITE_FORCE_MOCK: '1',
      }),
    ).not.toThrow();
    expect(() =>
      validateProductionBuildEnvironment('build', {
        VITE_ALLOW_MOCK_FALLBACK: '0',
      }),
    ).not.toThrow();
  });

  it.each(['VITE_FORCE_MOCK', 'VITE_ALLOW_MOCK_FALLBACK'])(
    'rejects %s in production builds',
    (key) => {
      expect(() =>
        validateProductionBuildEnvironment('build', { [key]: '1' }),
      ).toThrow(`${key}=1`);
    },
  );

  it('keeps deploy profiles and diagnostics paired', () => {
    expect(() =>
      validateProductionBuildEnvironment('build', {
        TAHTI_WEB_DEPLOY_PROFILE: 'prod',
      }),
    ).not.toThrow();
    expect(() =>
      validateProductionBuildEnvironment('build', {
        TAHTI_WEB_DEPLOY_PROFILE: 'beta',
        VITE_ENABLE_DIAGNOSTICS: '1',
      }),
    ).not.toThrow();
    expect(() =>
      validateProductionBuildEnvironment('build', {
        TAHTI_WEB_DEPLOY_PROFILE: 'prod',
        VITE_ENABLE_DIAGNOSTICS: '1',
      }),
    ).toThrow('Production deploys cannot enable diagnostics');
    expect(() =>
      validateProductionBuildEnvironment('build', {
        TAHTI_WEB_DEPLOY_PROFILE: 'beta',
      }),
    ).toThrow('Beta deploys must enable diagnostics');
    expect(() =>
      validateProductionBuildEnvironment('build', {
        TAHTI_WEB_DEPLOY_PROFILE: 'preview',
      }),
    ).toThrow('must be prod or beta');
  });

  it('rejects known mock fixture markers in bundle text', () => {
    const sample = `export const routes = ['/party/${PRODUCTION_MOCK_MARKERS[0]}'];`;
    expect(() => assertProductionBundleFreeOfMockMarkers(sample)).toThrow(
      PRODUCTION_MOCK_MARKERS[0],
    );
    expect(() =>
      assertProductionBundleFreeOfMockMarkers('export function ok() {}'),
    ).not.toThrow();
  });
});
