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
