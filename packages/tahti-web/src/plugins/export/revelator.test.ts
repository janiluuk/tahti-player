import { describe, expect, it } from 'vitest';

import { revelatorExportProvider } from './revelator';

describe('revelatorExportProvider', () => {
  it('exposes a behavioral Revelator adapter', () => {
    expect(revelatorExportProvider.id).toBe('revelator');
    expect(revelatorExportProvider.behavioral).toBe(true);
  });

  it('returns a submit result without throwing', async () => {
    const result = await revelatorExportProvider.submit('rel-1');
    expect(result).toHaveProperty('ok');
    if (result.ok) {
      expect(result.status).toBeTruthy();
    } else {
      expect(result.error).toBeTruthy();
    }
  });
});
