import { createContext, useContext } from 'react';

/** Built-in labels of shared chrome (dialog close, copy and edit buttons). */
export type UiLabels = {
  close: string;
  copy: string;
  copied: string;
  copiedToClipboard: string;
  copyFailed: string;
  edit: string;
  doneEditing: string;
};

export const defaultUiLabels: UiLabels = {
  close: 'Close',
  copy: 'Copy',
  copied: 'Copied',
  copiedToClipboard: 'Copied to clipboard',
  copyFailed: 'Could not copy to clipboard',
  edit: 'Edit',
  doneEditing: 'Done editing',
};

const UiLabelsContext = createContext<UiLabels>(defaultUiLabels);

/** Apps that localize their chrome pass translated labels here; without it the labels stay English. */
export const UiLabelsProvider = UiLabelsContext.Provider;

export const useUiLabels = (): UiLabels => useContext(UiLabelsContext);
