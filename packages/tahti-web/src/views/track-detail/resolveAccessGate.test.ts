import { describe, expect, it } from 'vitest';

import type { PublicTrackDetail } from '../../api/types';
import { resolveTrackAccessGate } from './resolveAccessGate';

const detail = (overrides: Partial<PublicTrackDetail>) =>
  ({
    audioUrl: 'https://example.test/a.mp3',
    accessMode: 'FREE',
    ...overrides,
  }) as PublicTrackDetail;

const viewer = { isOwner: false, purchaseEntitled: false };

describe('resolveTrackAccessGate', () => {
  it('trusts the API gate when present', () => {
    expect(
      resolveTrackAccessGate(
        detail({
          accessMode: 'SUBSCRIBERS_ONLY',
          audioUrl: null,
          gate: { reason: 'SUBSCRIBERS_ONLY' },
        }),
        viewer,
      ),
    ).toEqual({ reason: 'SUBSCRIBERS_ONLY' });
    expect(
      resolveTrackAccessGate(
        detail({ accessMode: 'SUBSCRIBERS_ONLY', gate: null }),
        viewer,
      ),
    ).toBeNull();
  });

  it('never gates the owner or a missing detail', () => {
    expect(
      resolveTrackAccessGate(detail({ gate: { reason: 'SUBSCRIBERS_ONLY' } }), {
        ...viewer,
        isOwner: true,
      }),
    ).toBeNull();
    expect(resolveTrackAccessGate(null, viewer)).toBeNull();
  });

  it('infers the gate from the access mode without an API gate', () => {
    expect(
      resolveTrackAccessGate(
        detail({ accessMode: 'SUBSCRIBERS_ONLY', audioUrl: null }),
        viewer,
      ),
    ).toEqual({ reason: 'SUBSCRIBERS_ONLY' });
    expect(
      resolveTrackAccessGate(
        detail({ accessMode: 'PURCHASE', purchaseTierId: 'tier' }),
        viewer,
      ),
    ).toEqual({ reason: 'PURCHASE', tierId: 'tier' });
    expect(
      resolveTrackAccessGate(
        detail({ accessMode: 'PURCHASE', purchaseTierId: 'tier' }),
        { ...viewer, purchaseEntitled: true },
      ),
    ).toBeNull();
    expect(resolveTrackAccessGate(detail({}), viewer)).toBeNull();
  });
});
