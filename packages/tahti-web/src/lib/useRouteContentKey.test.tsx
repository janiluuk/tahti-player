// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { useEffect, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ImageSlotDeleteBadge } from '../components/imageSlot/ImageSlotDeleteBadge';
import { useLanguageStore } from '../stores/languageStore';
import { usePlayerStore } from '../stores/playerStore';
import { applyLocale } from './locale';
import { useRouteContentKey } from './useRouteContentKey';

vi.mock('../api/studio-extras/profile', () => ({
  patchMeProfile: vi.fn().mockResolvedValue({ ok: true, data: {} }),
}));

const chromeMounts = vi.fn();

function PersistentChrome() {
  useEffect(() => {
    chromeMounts();
  }, []);
  return <div data-testid="chrome" />;
}

function Page() {
  return <ImageSlotDeleteBadge label="Avatar" onClick={() => {}} />;
}

function Shell({ keyed, children }: { keyed: boolean; children: ReactNode }) {
  const key = useRouteContentKey('u1');
  return (
    <>
      <PersistentChrome />
      <div key={keyed ? key : 'static'}>{children}</div>
    </>
  );
}

const switchToFinnish = () =>
  act(async () => {
    await useLanguageStore.getState().setChoice('fi_FI');
  });

describe('useRouteContentKey', () => {
  afterEach(async () => {
    cleanup();
    chromeMounts.mockClear();
    await applyLocale('en_US');
    await useLanguageStore.getState().setChoice('en_US');
  });

  it('leaves webT() labels in the old language without the key', async () => {
    render(
      <Shell keyed={false}>
        <Page />
      </Shell>,
    );
    expect(screen.getByRole('button', { name: 'Remove avatar' })).toBeTruthy();
    await switchToFinnish();
    expect(screen.getByRole('button', { name: 'Remove avatar' })).toBeTruthy();
  });

  it('re-renders the page in the new language and keeps the chrome mounted', async () => {
    const playerBefore = usePlayerStore.getState();
    render(
      <Shell keyed>
        <Page />
      </Shell>,
    );
    expect(screen.getByRole('button', { name: 'Remove avatar' })).toBeTruthy();
    expect(chromeMounts).toHaveBeenCalledTimes(1);
    await switchToFinnish();
    expect(screen.getByRole('button', { name: 'Poista: avatar' })).toBeTruthy();
    expect(chromeMounts).toHaveBeenCalledTimes(1);
    expect(usePlayerStore.getState()).toBe(playerBefore);
  });
});
