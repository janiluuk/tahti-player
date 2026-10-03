// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EMPTY_TRACK_ANALYSIS } from './trackAnalysisFields';
import { TrackAnalysisSection } from './TrackAnalysisSection';

describe('TrackAnalysisSection', () => {
  afterEach(cleanup);

  it('shows detected values and locks manual entry while they are used', () => {
    render(
      <TrackAnalysisSection
        item={{ bpmDetected: 128, keyDetected: 'Am' }}
        value={EMPTY_TRACK_ANALYSIS}
        onChange={() => {}}
        showMusicFields
      />,
    );
    expect(screen.getByText(/Detected: 128 BPM, Am/)).toBeTruthy();
    expect(screen.getByLabelText('BPM')).toHaveProperty('disabled', true);
    expect(screen.getByLabelText('Key')).toHaveProperty('disabled', true);
  });

  it('flags an out-of-range BPM and reports edits', () => {
    const onChange = vi.fn();
    const value = { ...EMPTY_TRACK_ANALYSIS, useDetectedBpmKey: false };
    render(
      <TrackAnalysisSection
        item={{}}
        value={{ ...value, bpm: '400' }}
        onChange={onChange}
        showMusicFields
      />,
    );
    expect(screen.getByText('BPM must be between 40 and 300.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Key'), {
      target: { value: 'F#m' },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...value,
      bpm: '400',
      musicalKey: 'F#m',
    });
  });

  it('toggles the AI label, and keeps only it for clips', () => {
    const onChange = vi.fn();
    render(
      <TrackAnalysisSection
        item={{}}
        value={EMPTY_TRACK_ANALYSIS}
        onChange={onChange}
        showMusicFields={false}
      />,
    );
    expect(screen.queryByLabelText('BPM')).toBeNull();
    fireEvent.click(
      screen.getByRole('switch', { name: 'Made with generative AI' }),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_TRACK_ANALYSIS,
      isAiGenerated: true,
    });
  });
});
