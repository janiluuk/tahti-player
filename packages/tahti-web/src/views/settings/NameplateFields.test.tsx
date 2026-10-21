import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ProfileFields } from '../../api/studio-extras';
import { NameplateFields, nameplatePatch } from './NameplateFields';

const profile: ProfileFields = {
  id: 'u1',
  username: 'demo',
  displayName: 'Demo Artist',
  bio: null,
  tipJarUrl: null,
  pronouns: null,
  chatEnabled: true,
  freeSubscriptionsEnabled: false,
};

describe('nameplatePatch', () => {
  it('sends null for a blank nameplate so the API clears it', () => {
    expect(
      nameplatePatch({ ...profile, nameplateText: '   ', nameplateColor: '' }),
    ).toEqual({
      nameplateText: null,
      nameplateColor: null,
      showPageHero: true,
    });
  });

  it('trims the text and keeps the colour and hero choice', () => {
    expect(
      nameplatePatch({
        ...profile,
        nameplateText: ' Resident DJ ',
        nameplateColor: '#5865f2',
        showPageHero: false,
      }),
    ).toEqual({
      nameplateText: 'Resident DJ',
      nameplateColor: '#5865f2',
      showPageHero: false,
    });
  });
});

describe('NameplateFields', () => {
  it('edits the text, resets the colour and toggles the page hero', () => {
    const setProfile = vi.fn();
    render(
      <NameplateFields
        profile={{
          ...profile,
          nameplateText: 'Resident',
          nameplateColor: '#5865f2',
        }}
        setProfile={setProfile}
      />,
    );

    fireEvent.change(screen.getByLabelText('Nameplate'), {
      target: { value: 'Resident DJ' },
    });
    expect(setProfile).toHaveBeenLastCalledWith(
      expect.objectContaining({ nameplateText: 'Resident DJ' }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Use the page accent' }),
    );
    expect(setProfile).toHaveBeenLastCalledWith(
      expect.objectContaining({ nameplateColor: null }),
    );

    fireEvent.click(screen.getByLabelText('Show page hero'));
    expect(setProfile).toHaveBeenLastCalledWith(
      expect.objectContaining({ showPageHero: false }),
    );
  });
});
