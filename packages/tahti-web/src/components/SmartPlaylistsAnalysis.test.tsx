import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type {
  NativeAnalysisDetail,
  NativeSmartDefinition,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { SmartPlaylistDialog } from './SmartPlaylistDialog';
import {
  describeRules,
  newRule,
  opsFor,
  withField,
} from './smartPlaylistRules';
import { analysisRows, TrackAnalysisSection } from './TrackAnalysisSection';

const detail = (
  patch: Partial<NativeAnalysisDetail> = {},
): NativeAnalysisDetail => ({
  analyzed: true,
  stale: false,
  peaks: [10, 200, 90],
  loudnessLufs: -9.84,
  truePeakDbtp: -0.42,
  tagBpm: null,
  tagKey: null,
  bpmEstimate: 127.6,
  bpmConfidence: 0.71,
  keyEstimate: 'Am',
  keyConfidence: 0.4,
  userBpm: null,
  userKey: null,
  bpm: 127.6,
  key: 'Am',
  analyzedAt: '2026-09-21 10:00:00',
  ...patch,
});

describe('analysisRows', () => {
  it('labels an estimate as an estimate, with its confidence', () => {
    const rows = Object.fromEntries(
      analysisRows(detail()).map((r) => [r.label, r.value]),
    );
    expect(rows.BPM).toBe('127.6 (estimate (71% sure))');
    expect(rows.Key).toBe('Am (estimate (40% sure))');
    expect(rows.Loudness).toBe('-9.8 LUFS');
    expect(rows['True peak']).toBe('-0.4 dBTP');
  });

  it('shows the origin of the winning value: correction, then tag, then estimate', () => {
    const tag = Object.fromEntries(
      analysisRows(detail({ tagBpm: 126, tagKey: '8A' })).map((r) => [
        r.label,
        r.value,
      ]),
    );
    expect(tag.BPM).toBe("126 (from the file's tag)");
    const user = Object.fromEntries(
      analysisRows(detail({ tagBpm: 126, userBpm: 128, userKey: 'Cm' })).map(
        (r) => [r.label, r.value],
      ),
    );
    expect(user.BPM).toBe('128 (your correction)');
    expect(user.Key).toBe('Cm (your correction)');
  });

  it('hides loudness until the track has been analyzed', () => {
    const labels = analysisRows(detail({ analyzed: false })).map(
      (r) => r.label,
    );
    expect(labels).toEqual(['BPM', 'Key']);
  });
});

describe('smart playlist rules', () => {
  it('offers only operators that make sense for a field', () => {
    expect(opsFor('bpm').map((o) => o.id)).toContain('between');
    expect(opsFor('genre').map((o) => o.id)).not.toContain('between');
    expect(opsFor('lastPlayed').map((o) => o.id)).toContain('notInLastDays');
    expect(opsFor('analyzed').map((o) => o.label)).toEqual([
      'has been analyzed',
      'has not been analyzed',
    ]);
  });

  it('keeps a rule valid when its field changes', () => {
    const rule = { ...newRule('bpm'), op: 'between' as const };
    expect(withField(rule, 'genre').op).toBe('is');
    expect(withField({ ...rule, op: 'isSet' }, 'genre').op).toBe('isSet');
  });

  it('describes a rule set in words', () => {
    const definition: NativeSmartDefinition = {
      name: 'x',
      matchAll: true,
      rules: [
        { field: 'genre', op: 'is', value: 'house', value2: '' },
        { field: 'bpm', op: 'between', value: '120', value2: '128' },
        { field: 'lastPlayed', op: 'notInLastDays', value: '30', value2: '' },
      ],
      sort: 'title',
      descending: false,
      limit: null,
    };
    expect(describeRules(definition)).toBe(
      'Genre is house and BPM is between 120 and 128 and Last played is not within the last 30 days',
    );
    expect(describeRules({ ...definition, rules: [] })).toBe('Every track');
  });
});

describe('SmartPlaylistDialog', () => {
  it('shows a live count for the draft and saves it', async () => {
    const evaluate = vi.fn().mockResolvedValue({ tracks: [], total: 12 });
    const save = vi.fn().mockResolvedValue({ name: 'Fast' });
    const library = {
      analysis: { smart: { evaluate, save } },
    } as unknown as TahtiNativeLibrary;
    const onSaved = vi.fn();
    render(
      <SmartPlaylistDialog
        library={library}
        editing={{
          id: null,
          definition: {
            name: 'Fast',
            matchAll: true,
            rules: [],
            sort: 'bpm',
            descending: true,
            limit: null,
          },
        }}
        onClose={() => undefined}
        onSaved={onSaved}
      />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('smart-preview').textContent).toBe(
        '12 tracks match right now',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ name: 'Fast' }),
      ),
    );
    expect(onSaved).toHaveBeenCalled();
  });

  it('blocks saving while a rule is invalid', async () => {
    const evaluate = vi.fn().mockRejectedValue(new Error('Not a number: fast'));
    const library = {
      analysis: { smart: { evaluate, save: vi.fn() } },
    } as unknown as TahtiNativeLibrary;
    render(
      <SmartPlaylistDialog
        library={library}
        editing={{
          id: null,
          definition: {
            name: 'Bad',
            matchAll: true,
            rules: [{ field: 'bpm', op: 'atLeast', value: 'fast', value2: '' }],
            sort: 'title',
            descending: false,
            limit: null,
          },
        }}
        onClose={() => undefined}
        onSaved={() => undefined}
      />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('smart-preview').textContent).toBe(
        'Not a number: fast',
      ),
    );
    expect(
      (screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});

describe('TrackAnalysisSection', () => {
  it('saves a correction and offers undo', async () => {
    const load = vi.fn().mockResolvedValue(detail());
    const setCorrections = vi
      .fn()
      .mockResolvedValue([{ id: 't1', bpm: null, key: null }]);
    const library = {
      analysis: {
        detail: load,
        setCorrections,
        restoreCorrections: vi.fn(),
        analyze: vi.fn(),
      },
    } as unknown as TahtiNativeLibrary;
    render(
      <TrackAnalysisSection
        library={library}
        track={{ id: 't1', available: true } as never}
      />,
    );
    await screen.findByTestId('waveform');
    fireEvent.change(screen.getByLabelText('Your BPM'), {
      target: { value: '64' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save correction/ }));
    await waitFor(() =>
      expect(setCorrections).toHaveBeenCalledWith(['t1'], 64, ''),
    );
  });
});
