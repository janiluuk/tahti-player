export {
  useEditorStore,
  computePeaks,
  clipPeakGain,
  sampleLane,
  automationTargetKey,
  snapStepSec,
  SNAP_DIVISIONS,
  ZOOM_MIN,
  ZOOM_MAX,
  TRACK_HEIGHT_MIN,
  TRACK_HEIGHT_MAX,
} from './state/editorStore';
export type {
  AudioClip,
  EditorTrack,
  AutomationLane,
  AutomationTarget,
  TimelineMarker,
  SnapDivision,
  ToolMode,
} from './state/editorStore';

export * as liveMixer from './state/liveMixer';
export {
  MultitrackEditor,
  loadBlobOntoNewTrack,
} from './components/MultitrackEditor';
export type { MultitrackEditorProps } from './components/MultitrackEditor';

export {
  initEditorAutosave,
  useAutosaveRecoveryStore,
} from './lib/editorAutosave';
export { encodeWav } from './lib/wavEncode';
