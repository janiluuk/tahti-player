import { describe, expect, it } from 'vitest';

import {
  completedGoLiveSteps,
  defaultGoLiveStep,
  goLiveStepFromSearch,
  goLiveStepStatus,
  missingRequiredSteps,
  nextGoLiveStep,
  type GoLiveProgress,
} from './goLiveSteps';

const progress = (overrides: Partial<GoLiveProgress> = {}): GoLiveProgress => ({
  showNameSaved: false,
  settingsLoaded: true,
  settingsFailed: false,
  signalOk: false,
  reconnecting: false,
  ...overrides,
});

describe('goLiveStepFromSearch', () => {
  it('maps every old ?tab= value to its step', () => {
    expect(goLiveStepFromSearch({ tab: 'prep' })).toBe('show-info');
    expect(goLiveStepFromSearch({ tab: 'credentials' })).toBe('credentials');
    expect(goLiveStepFromSearch({ tab: 'recording' })).toBe('recording');
    expect(goLiveStepFromSearch({ tab: 'destinations' })).toBe('destinations');
    expect(goLiveStepFromSearch({ tab: 'green-room' })).toBe('green-room');
  });

  it('prefers ?step= and ignores unknown values', () => {
    expect(goLiveStepFromSearch({ step: 'encoder', tab: 'prep' })).toBe(
      'encoder',
    );
    expect(goLiveStepFromSearch({ step: 'nope' })).toBeUndefined();
    expect(goLiveStepFromSearch({ tab: 'nope' })).toBeUndefined();
    expect(goLiveStepFromSearch({})).toBeUndefined();
  });
});

describe('step completion', () => {
  it('completes credentials once settings load, and the required steps on their own signals', () => {
    expect([...completedGoLiveSteps(progress())]).toEqual(['credentials']);
    expect([
      ...completedGoLiveSteps(
        progress({ showNameSaved: true, signalOk: true }),
      ),
    ]).toEqual(['show-info', 'credentials', 'encoder']);
  });

  it('gates Start broadcast on show name and encoder only', () => {
    expect(missingRequiredSteps(progress())).toEqual(['show-info', 'encoder']);
    expect(
      missingRequiredSteps(progress({ showNameSaved: true, signalOk: true })),
    ).toEqual([]);
    expect(
      missingRequiredSteps(
        progress({
          showNameSaved: true,
          signalOk: true,
          settingsLoaded: false,
        }),
      ),
    ).toEqual([]);
  });

  it('treats a reconnecting encoder as not done and flags it as an error', () => {
    const p = progress({
      showNameSaved: true,
      signalOk: true,
      reconnecting: true,
    });
    expect(missingRequiredSteps(p)).toEqual(['encoder']);
    expect(goLiveStepStatus('encoder', 'encoder', p)).toBe('error');
  });

  it('opens the first required step still to do', () => {
    expect(defaultGoLiveStep(progress())).toBe('show-info');
    expect(defaultGoLiveStep(progress({ showNameSaved: true }))).toBe(
      'encoder',
    );
    expect(
      defaultGoLiveStep(progress({ showNameSaved: true, signalOk: true })),
    ).toBe('show-info');
  });

  it('marks the selected step current and the rest complete or upcoming', () => {
    const p = progress({ showNameSaved: true });
    expect(goLiveStepStatus('show-info', 'recording', p)).toBe('complete');
    expect(goLiveStepStatus('recording', 'recording', p)).toBe('current');
    expect(goLiveStepStatus('encoder', 'recording', p)).toBe('upcoming');
    expect(
      goLiveStepStatus(
        'credentials',
        'show-info',
        progress({ settingsFailed: true }),
      ),
    ).toBe('error');
  });

  it('walks the steps in order', () => {
    expect(nextGoLiveStep('show-info')).toBe('credentials');
    expect(nextGoLiveStep('destinations')).toBe('green-room');
    expect(nextGoLiveStep('green-room')).toBeNull();
  });
});
