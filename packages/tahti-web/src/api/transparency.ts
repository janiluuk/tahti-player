import { i18n } from '@tahti-player/i18n';

import { errorOr, getJson } from './client-request';
import {
  mockTransparencyGrants,
  mockTransparencyLedger,
  mockTransparencyResolutions,
  mockTransparencyYtd,
} from './mock';
import {
  allowMockFallback,
  isForceMock,
  mockFallbackMeta,
  withMockFallback,
  type FetchMeta,
} from './mode';
import type {
  BoardResolution,
  TransparencyGrantReport,
  TransparencyLedgerEntry,
  TransparencyYtd,
} from './types';

export async function fetchTransparencyYtd(): Promise<{
  data: TransparencyYtd;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockTransparencyYtd(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<TransparencyYtd>('/api/v1/transparency/ytd');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockTransparencyYtd(), meta: mockFallbackMeta(err) };
    }
    throw errorOr(err, i18n.t('web:batch56.transparencyYtdFailed'));
  }
}

export async function fetchTransparencyGrants(year?: number): Promise<{
  data: TransparencyGrantReport;
  meta: FetchMeta;
}> {
  const y = year ?? new Date().getFullYear();
  if (isForceMock()) {
    return {
      data: mockTransparencyGrants(y),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<TransparencyGrantReport>(
      `/api/v1/transparency/grants/${y}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockTransparencyGrants(y), meta: mockFallbackMeta(err) };
    }
    throw errorOr(err, i18n.t('web:batch56.transparencyGrantsFailed'));
  }
}

export async function fetchTransparencyLedger(): Promise<{
  data: TransparencyLedgerEntry[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockTransparencyLedger(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<TransparencyLedgerEntry[]>(
      '/api/v1/transparency/ledger/latest',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(
      err,
      allowMockFallback() ? mockTransparencyLedger : null,
      () => [],
    );
  }
}

export async function fetchTransparencyResolutions(year?: number): Promise<{
  data: BoardResolution[];
  meta: FetchMeta;
}> {
  const y = year ?? new Date().getFullYear();
  if (isForceMock()) {
    return {
      data: mockTransparencyResolutions(y),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<BoardResolution[]>(
      `/api/v1/transparency/resolutions?year=${y}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(
      err,
      allowMockFallback() ? () => mockTransparencyResolutions(y) : null,
      () => [],
    );
  }
}
