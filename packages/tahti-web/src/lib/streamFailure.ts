export type StreamFailureReason =
  'http' | 'unsupported' | 'unreachable' | 'timeout';

export type StreamFailure = {
  reason: StreamFailureReason;
  /** HTTP status, when the server answered with an error. */
  status?: number;
};

export const STREAM_START_TIMEOUT_MS = 20_000;

const MEDIA_ERR_DECODE = 3;
export const MEDIA_ERR_SRC_NOT_SUPPORTED = 4;
const HTTP_ERROR_MIN = 400;

/** Short category, e.g. for a badge or a card subtitle. */
export function streamFailureLabel(failure: StreamFailure): string {
  switch (failure.reason) {
    case 'http':
      return failure.status
        ? `Server error (HTTP ${failure.status})`
        : 'Server error';
    case 'unsupported':
      return 'Unsupported format';
    case 'timeout':
      return 'Timed out';
    case 'unreachable':
      return 'Can’t connect';
  }
}

/** One sentence for the listener on what went wrong. */
export function streamFailureDescription(failure: StreamFailure): string {
  switch (failure.reason) {
    case 'http':
      return failure.status
        ? `The station’s server answered with HTTP ${failure.status}.`
        : 'The station’s server answered with an error.';
    case 'unsupported':
      return 'This browser can’t play the station’s stream format.';
    case 'timeout':
      return `The stream didn’t start within ${STREAM_START_TIMEOUT_MS / 1000} seconds.`;
    case 'unreachable':
      return 'Couldn’t reach the stream. It may be offline, or its server may not allow web players.';
  }
}

/** The subset of hls.js `ErrorData` the classification reads. */
export type HlsErrorLike = {
  type: string;
  details: string;
  response?: { code?: number };
};

export function failureFromHlsError(data: HlsErrorLike): StreamFailure {
  if (/TimeOut$/.test(data.details)) {
    return { reason: 'timeout' };
  }
  const code = data.response?.code ?? 0;
  if (data.type === 'networkError' && code >= HTTP_ERROR_MIN) {
    return { reason: 'http', status: code };
  }
  if (
    data.type === 'mediaError' ||
    data.details === 'manifestIncompatibleCodecsError' ||
    data.details === 'manifestParsingError'
  ) {
    return { reason: 'unsupported' };
  }
  return { reason: 'unreachable' };
}

/** `MEDIA_ERR_SRC_NOT_SUPPORTED` is ambiguous (bad format, HTTP error or a
 * blocked load all report it), so it maps to `unreachable` until a probe of
 * the URL says more. */
export function failureFromMediaError(code: number | undefined): StreamFailure {
  return code === MEDIA_ERR_DECODE
    ? { reason: 'unsupported' }
    : { reason: 'unreachable' };
}
