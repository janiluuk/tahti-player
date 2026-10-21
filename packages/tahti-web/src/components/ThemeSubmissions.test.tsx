// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as themes from '../api/me-themes';
import { ThemeSubmissions } from './ThemeSubmissions';

const BASE: themes.MyTheme = {
  id: 't1',
  name: 'Revontulet',
  vars: { background: '#0b1d26' },
  dark: {},
  visibility: 'PENDING_REVIEW',
  moderationNote: null,
  prStatus: 'NONE',
  prUrl: null,
  createdAt: '2026-09-20T10:00:00.000Z',
  updatedAt: '2026-09-20T10:00:00.000Z',
};

describe('themeSubmissionStatus', () => {
  it('follows the review and registry PR states', () => {
    expect(themes.themeSubmissionStatus(BASE)).toBe('Waiting for review');
    expect(themes.themeSubmissionStatus({ ...BASE, prStatus: 'OPENED' })).toBe(
      'Approved, being added to the catalog',
    );
    expect(
      themes.themeSubmissionStatus({ ...BASE, visibility: 'REJECTED' }),
    ).toBe('Not accepted');
  });
});

describe('submitThemeToCommunity', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates the theme and then submits it for review', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async (input) =>
        new Response(
          JSON.stringify({
            ...BASE,
            visibility: String(input).endsWith('/submit-public')
              ? 'PENDING_REVIEW'
              : 'PRIVATE',
          }),
          { status: String(input).endsWith('/submit-public') ? 200 : 201 },
        ),
    );
    await expect(
      themes.submitThemeToCommunity({
        name: ' Revontulet ',
        vars: { background: '#0b1d26' },
      }),
    ).resolves.toMatchObject({
      ok: true,
      data: { visibility: 'PENDING_REVIEW' },
    });
    const [createUrl, createInit] = fetchSpy.mock.calls[0]!;
    expect(createUrl).toBe('/tahti-api/api/me/themes');
    expect(JSON.parse(String(createInit?.body))).toEqual({
      name: 'Revontulet',
      vars: { background: '#0b1d26' },
      dark: {},
    });
    expect(fetchSpy.mock.calls[1]![0]).toBe(
      '/tahti-api/api/me/themes/t1/submit-public',
    );
  });

  it('refuses a theme with no colours before sending', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(
      themes.submitThemeToCommunity({ name: 'Empty' }),
    ).resolves.toMatchObject({ ok: false });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('ThemeSubmissions', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the reviewer note and lets a rejected theme be sent again', async () => {
    const resubmit = vi
      .spyOn(themes, 'submitThemeForReview')
      .mockResolvedValue({ ok: true, data: BASE });
    const onChanged = vi.fn();
    render(
      <ThemeSubmissions
        themes={[
          BASE,
          {
            ...BASE,
            id: 't2',
            name: 'Harmaa',
            visibility: 'REJECTED',
            moderationNote: 'Text contrast is too low.',
          },
        ]}
        onChanged={onChanged}
        onError={vi.fn()}
      />,
    );
    expect(screen.getByText('Waiting for review')).toBeTruthy();
    expect(
      screen.getByText("Reviewer's note: Text contrast is too low."),
    ).toBeTruthy();
    expect(
      screen.getAllByRole('button', { name: 'Submit again' }),
    ).toHaveLength(1);
    expect(
      screen.queryByRole('button', {
        name: 'Delete the Revontulet submission',
      }),
    ).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit again' }));
    });
    expect(resubmit).toHaveBeenCalledWith('t2');
    expect(onChanged).toHaveBeenCalled();
  });
});
