import { describe, expect, it } from 'vitest';

import { parseRadioSearch, radioTabFromSearch } from './radioTabs';

describe('radio search', () => {
  it('keeps the known Radio tabs in the URL and drops the default or unknown ones', () => {
    expect(parseRadioSearch({ tab: 'shows' })).toEqual({ tab: 'shows' });
    expect(parseRadioSearch({ tab: 'just-played' })).toEqual({
      tab: 'just-played',
    });
    expect(parseRadioSearch({ tab: 'featured' })).toEqual({ tab: 'featured' });
    expect(parseRadioSearch({ tab: 'up-next' })).toEqual({ tab: undefined });
    expect(parseRadioSearch({ tab: 'calendar' })).toEqual({ tab: undefined });
    expect(parseRadioSearch({})).toEqual({ tab: undefined });
  });

  it('maps search onto the active Radio tab', () => {
    expect(radioTabFromSearch('shows')).toBe('shows');
    expect(radioTabFromSearch(undefined)).toBe('up-next');
    expect(radioTabFromSearch(42)).toBe('up-next');
  });
});
