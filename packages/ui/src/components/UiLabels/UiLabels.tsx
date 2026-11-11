import { createContext, useContext } from 'react';

/** Built-in labels of shared chrome (dialogs, buttons, rows, tables, transport). */
export type UiLabels = {
  close: string;
  copy: string;
  copied: string;
  copiedToClipboard: string;
  copyFailed: string;
  edit: string;
  doneEditing: string;
  back: string;
  forward: string;
  previous: string;
  next: string;
  previousNamed: (name: string) => string;
  nextNamed: (name: string) => string;
  play: string;
  pause: string;
  shuffleOn: string;
  shuffleOff: string;
  repeatOff: string;
  repeatOne: string;
  repeatAll: string;
  clearFilter: string;
  scrollLeft: string;
  scrollRight: string;
  settings: string;
  backToSettingsSections: string;
  filterOptions: string;
  selectableOptions: string;
  loading: string;
  clear: string;
  tableSettings: string;
  rows: string;
  selectAllLoaded: string;
  allSelected: (total: number) => string;
  countSelected: (count: number) => string;
  selectAllCount: (total: number) => string;
  loadedOf: (loaded: number, total: number) => string;
  resizeColumn: (name: string) => string;
  selectRow: (name: string) => string;
  deselectRow: (name: string) => string;
  selectAllRows: string;
  deselectAllRows: string;
  editTrack: string;
  openTrack: string;
};

const formatCount = (value: number) => value.toLocaleString('en-US');

export const defaultUiLabels: UiLabels = {
  close: 'Close',
  copy: 'Copy',
  copied: 'Copied',
  copiedToClipboard: 'Copied to clipboard',
  copyFailed: 'Could not copy to clipboard',
  edit: 'Edit',
  doneEditing: 'Done editing',
  back: 'Back',
  forward: 'Forward',
  previous: 'Previous',
  next: 'Next',
  previousNamed: (name) => `Previous: ${name}`,
  nextNamed: (name) => `Next: ${name}`,
  play: 'Play',
  pause: 'Pause',
  shuffleOn: 'Shuffle on',
  shuffleOff: 'Shuffle off',
  repeatOff: 'Repeat off',
  repeatOne: 'Repeat one',
  repeatAll: 'Repeat all',
  clearFilter: 'Clear filter',
  scrollLeft: 'Scroll left',
  scrollRight: 'Scroll right',
  settings: 'Settings',
  backToSettingsSections: 'Back to settings sections',
  filterOptions: 'Filter options',
  selectableOptions: 'Selectable options',
  loading: 'Loading',
  clear: 'Clear',
  tableSettings: 'Table settings',
  rows: 'Rows',
  selectAllLoaded: 'Select all loaded tracks',
  allSelected: (total) => `All ${formatCount(total)} selected`,
  countSelected: (count) => `${formatCount(count)} selected`,
  selectAllCount: (total) => `Select all ${formatCount(total)}`,
  loadedOf: (loaded, total) =>
    `${formatCount(loaded)} of ${formatCount(total)} loaded`,
  resizeColumn: (name) => `Resize ${name}`,
  selectRow: (name) => `Select ${name}`,
  deselectRow: (name) => `Deselect ${name}`,
  selectAllRows: 'Select all rows',
  deselectAllRows: 'Deselect all rows',
  editTrack: 'Edit track',
  openTrack: 'Open track',
};

const UiLabelsContext = createContext<UiLabels>(defaultUiLabels);

/** Apps that localize their chrome pass translated labels here; without it the labels stay English. */
export const UiLabelsProvider = UiLabelsContext.Provider;

export const useUiLabels = (): UiLabels => useContext(UiLabelsContext);
