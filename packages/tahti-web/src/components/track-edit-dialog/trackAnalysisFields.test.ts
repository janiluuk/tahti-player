import { describe, expect, it } from 'vitest';

import {
  analysisFormFromSound,
  analysisPatchFromForm,
  bpmError,
  detectedSummary,
  EMPTY_TRACK_ANALYSIS,
  musicalKeyError,
} from './trackAnalysisFields';

describe('trackAnalysisFields', () => {
  it('accepts blank and in-range whole-number BPM only', () => {
    expect(bpmError('')).toBeNull();
    expect(bpmError(' 128 ')).toBeNull();
    expect(bpmError('40')).toBeNull();
    expect(bpmError('300')).toBeNull();
    expect(bpmError('39')).toMatch(/between 40 and 300/);
    expect(bpmError('301')).toMatch(/between 40 and 300/);
    expect(bpmError('120.5')).toMatch(/whole number/);
    expect(bpmError('fast')).toMatch(/whole number/);
  });

  it('caps the key at the API length limit', () => {
    expect(musicalKeyError('F#m')).toBeNull();
    expect(musicalKeyError('C sharp minor')).toMatch(/at most 12/);
  });

  it('builds the PATCH fields, clearing blanks to null', () => {
    expect(
      analysisPatchFromForm({
        bpm: ' 124 ',
        musicalKey: ' Am ',
        mixVersion: '',
        useDetectedBpmKey: false,
        isAiGenerated: true,
      }),
    ).toEqual({
      ok: true,
      patch: {
        bpm: 124,
        musicalKey: 'Am',
        mixVersion: null,
        useDetectedBpmKey: false,
        isAiGenerated: true,
      },
    });
    expect(analysisPatchFromForm(EMPTY_TRACK_ANALYSIS)).toEqual({
      ok: true,
      patch: {
        bpm: null,
        musicalKey: null,
        mixVersion: null,
        useDetectedBpmKey: true,
        isAiGenerated: false,
      },
    });
  });

  it('refuses to build a PATCH with an invalid BPM', () => {
    const result = analysisPatchFromForm({ ...EMPTY_TRACK_ANALYSIS, bpm: '9' });
    expect(result.ok).toBe(false);
  });

  it('reads the form from the API row, defaulting like the database', () => {
    expect(
      analysisFormFromSound({
        id: 's1',
        title: 'T',
        status: 'READY',
        bpm: 126,
        musicalKey: '8A',
        mixVersion: 'Extended Mix',
        useDetectedBpmKey: false,
        isAiGenerated: true,
      }),
    ).toEqual({
      bpm: '126',
      musicalKey: '8A',
      mixVersion: 'Extended Mix',
      useDetectedBpmKey: false,
      isAiGenerated: true,
    });
    expect(
      analysisFormFromSound({ id: 's1', title: 'T', status: 'READY' }),
    ).toEqual(EMPTY_TRACK_ANALYSIS);
  });

  it('summarizes detected values only when present', () => {
    expect(detectedSummary({ bpmDetected: 128, keyDetected: 'Am' })).toBe(
      '128 BPM, Am',
    );
    expect(detectedSummary({ bpmDetected: null, keyDetected: 'Am' })).toBe(
      'Am',
    );
    expect(detectedSummary({})).toBeNull();
  });
});
