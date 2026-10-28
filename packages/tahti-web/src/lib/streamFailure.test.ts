import { describe, expect, it } from 'vitest';

import {
  failureFromHlsError,
  failureFromMediaError,
  streamFailureDescription,
  streamFailureLabel,
} from './streamFailure';

describe('failureFromHlsError', () => {
  it('reads an HTTP status from a failed playlist load', () => {
    expect(
      failureFromHlsError({
        type: 'networkError',
        details: 'levelLoadError',
        response: { code: 404 },
      }),
    ).toEqual({ reason: 'http', status: 404 });
  });

  it('treats a load without a status as unreachable (offline or CORS)', () => {
    expect(
      failureFromHlsError({
        type: 'networkError',
        details: 'manifestLoadError',
        response: { code: 0 },
      }),
    ).toEqual({ reason: 'unreachable' });
  });

  it('names timeouts and codec problems', () => {
    expect(
      failureFromHlsError({ type: 'networkError', details: 'fragLoadTimeOut' }),
    ).toEqual({ reason: 'timeout' });
    expect(
      failureFromHlsError({
        type: 'mediaError',
        details: 'manifestIncompatibleCodecsError',
      }),
    ).toEqual({ reason: 'unsupported' });
  });
});

describe('failureFromMediaError', () => {
  it('maps a decode error to an unsupported format and the rest to unreachable', () => {
    expect(failureFromMediaError(3)).toEqual({ reason: 'unsupported' });
    expect(failureFromMediaError(4)).toEqual({ reason: 'unreachable' });
    expect(failureFromMediaError(undefined)).toEqual({ reason: 'unreachable' });
  });
});

describe('streamFailureLabel', () => {
  it('gives each reason a short label', () => {
    expect(streamFailureLabel({ reason: 'http', status: 404 })).toBe(
      'Server error (HTTP 404)',
    );
    expect(streamFailureLabel({ reason: 'unsupported' })).toBe(
      'Unsupported format',
    );
    expect(streamFailureLabel({ reason: 'timeout' })).toBe('Timed out');
    expect(streamFailureLabel({ reason: 'unreachable' })).toBe('Can’t connect');
    expect(streamFailureDescription({ reason: 'timeout' })).toBe(
      'The stream didn’t start within 20 seconds.',
    );
  });
});
