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
  AutomationPoint,
  AutomationTarget,
  TimelineMarker,
  SnapDivision,
  ToolMode,
} from './state/editorStore';

export * as liveMixer from './state/liveMixer';
export {
  MultitrackEditor,
  loadBlobOntoNewTrack,
  loadStemFilesOntoMultitrack,
  colorForStemLabel,
} from './components/MultitrackEditor';
export type { MultitrackEditorProps } from './components/MultitrackEditor';

export {
  initEditorAutosave,
  useAutosaveRecoveryStore,
} from './lib/editorAutosave';
export { encodeWav } from './lib/wavEncode';
export { TrackAutomationLane } from './components/TrackAutomationLane';
export type { TrackAutomationLaneProps } from './components/TrackAutomationLane';
export {
  serializeAutomation,
  parseAutomation,
  laneParamEvents,
  trackFxAutomationParam,
  AUTOMATION_SYNC_MAX_BYTES,
} from './lib/automation';
export type {
  SerializedAutomation,
  SerializedAutomationLane,
} from './lib/automation';
export { PianoRoll } from './midi/PianoRoll';
export type { PianoRollProps } from './midi/PianoRoll';
export { MidiClipPanel } from './midi/MidiClipPanel';
export {
  addNote,
  deleteNote,
  moveNote,
  quantizeNotes,
  resizeNote,
} from './midi/noteEditing';
export type { PianoNote } from './midi/noteEditing';
export {
  createMidiClip,
  isMidiClip,
  sanitizePianoNotes,
} from './midi/midiClip';
export { bounceMidiClipToAudio } from './midi/midiClipActions';
