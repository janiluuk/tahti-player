import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ScheduleEditorDialog } from './ScheduleEditorDialog';
import type { ScheduleForm } from './useScheduleForm';

function makeForm(overrides: Partial<ScheduleForm> = {}): ScheduleForm {
  return {
    schedule: null,
    date: '',
    setDate: vi.fn(),
    time: '',
    setTime: vi.fn(),
    note: '',
    msg: null,
    busy: false,
    loading: false,
    editorOpen: true,
    setEditorOpen: vi.fn(),
    shows: [],
    scheduledShows: [],
    selectedShowId: '',
    showDescription: '',
    showCoverUrl: '',
    showMode: 'SERIES',
    showType: 'LIVE_SET',
    durationHours: 1,
    durationMinutes: 0,
    setDurationMinutes: vi.fn(),
    frequencyDays: [],
    setFrequencyDays: vi.fn(),
    venue: '',
    setVenue: vi.fn(),
    location: '',
    setLocation: vi.fn(),
    episodeArtworkUrl: '',
    setEpisodeArtworkUrl: vi.fn(),
    showTagline: '',
    setShowTagline: vi.fn(),
    showVisibility: 'PUBLIC',
    setShowVisibility: vi.fn(),
    autoPublish: true,
    setAutoPublish: vi.fn(),
    pendingCancel: null,
    setPendingCancel: vi.fn(),
    episodeNumberEnabled: true,
    setEpisodeNumberEnabled: vi.fn(),
    nextEpisodeNumber: 1,
    setNextEpisodeNumber: vi.fn(),
    selectShow: vi.fn(),
    saveRecurringSchedule: vi.fn(),
    stopRecurringSchedule: vi.fn(),
    scheduleEpisode: vi.fn(),
    cancelEpisode: vi.fn(),
    scheduledTimes: [],
    setQuickDate: vi.fn(),
    openEditor: vi.fn(),
    saveSchedule: vi.fn(),
    onBroadcastFieldsChange: vi.fn(),
    ...overrides,
  };
}

describe('ScheduleEditorDialog create-only fields', () => {
  it('are enabled when creating a new show', () => {
    render(<ScheduleEditorDialog form={makeForm({ selectedShowId: '' })} />);
    expect(screen.getByLabelText('Show tagline')).toBeEnabled();
    expect(
      screen.getByLabelText('Publish recordings automatically'),
    ).toBeEnabled();
    expect(
      screen.getByLabelText('Number episodes automatically'),
    ).toBeEnabled();
    expect(screen.getByLabelText('Start episode')).toBeEnabled();
    expect(
      screen.queryByText(/change them on its show page/),
    ).not.toBeInTheDocument();
  });

  it('are disabled once an existing show is selected, with an explanatory note', () => {
    render(
      <ScheduleEditorDialog form={makeForm({ selectedShowId: 'show-1' })} />,
    );
    expect(screen.getByLabelText('Show tagline')).toBeDisabled();
    expect(
      screen.getByLabelText('Publish recordings automatically'),
    ).toBeDisabled();
    expect(
      screen.getByLabelText('Number episodes automatically'),
    ).toBeDisabled();
    expect(screen.getByLabelText('Start episode')).toBeDisabled();
    expect(
      screen.getByText(/change them on its show page/),
    ).toBeInTheDocument();
  });
});
