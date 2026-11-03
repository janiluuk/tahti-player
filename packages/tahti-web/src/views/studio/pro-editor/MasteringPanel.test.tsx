// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EditList } from '../../../api/studio-types';
import { useAudioFxStore } from '../../../plugins/audio-fx';
import { MasteringPanel } from './MasteringPanel';

const EDIT_LIST = {
  version: 1,
  sourceDuration: 240,
  cuts: [],
  pluginChain: ['eq'],
  fades: [],
  gainDb: 0,
  eq: {
    enabled: true,
    bands: [{ freq: 120, gainDb: 2, q: 0.8 }],
  },
  loudnorm: { enabled: false, targetLufs: -14, targetTp: -1 },
  highPassHz: 0,
  lowPassHz: 0,
} as unknown as EditList;

describe('MasteringPanel', () => {
  afterEach(cleanup);

  it('confirms removing an audio add-on with a red button', () => {
    useAudioFxStore.setState({ enabledPluginIds: ['eq'] });
    const onChange = vi.fn();
    render(<MasteringPanel editList={EDIT_LIST} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Expand mastering' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove EQ' }));
    const dialog = within(screen.getByRole('dialog'));
    const confirm = dialog.getByRole('button', { name: 'Remove' });
    expect(confirm.className).toContain('bg-accent-red');
    fireEvent.click(confirm);
    expect(onChange).toHaveBeenCalled();
  });
});
