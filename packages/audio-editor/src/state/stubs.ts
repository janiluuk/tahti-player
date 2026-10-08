export type PianoNote = {
  id: string;
  pitch: number;
  start: number;
  duration: number;
  velocity: number;
};

export type MeterSegment = {
  startBeat: number;
  numerator: number;
  denominator: number;
};

export type PolyLane = {
  id: string;
  notes: PianoNote[];
};

export type LaneBend = {
  time: number;
  value: number;
};
