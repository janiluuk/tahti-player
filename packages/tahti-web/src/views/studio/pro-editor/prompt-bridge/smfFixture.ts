const PPQ = 480;

function vlq(value: number): number[] {
  const bytes = [value & 0x7f];
  let rest = value >> 7;
  while (rest > 0) {
    bytes.unshift((rest & 0x7f) | 0x80);
    rest >>= 7;
  }
  return bytes;
}

function chunk(type: string, body: number[]): number[] {
  const len = body.length;
  return [
    ...[...type].map((c) => c.charCodeAt(0)),
    (len >>> 24) & 0xff,
    (len >>> 16) & 0xff,
    (len >>> 8) & 0xff,
    len & 0xff,
    ...body,
  ];
}

export type Fixture = {
  bpm?: number;
  timeSig?: [number, number];
  key?: { sharps: number; minor: boolean };
  channel?: number;
  pitches: number[];
};

/** Type 0 SMF with back-to-back quarter notes. */
export function smf({
  bpm,
  timeSig,
  key,
  channel = 0,
  pitches,
}: Fixture): Uint8Array {
  const events: number[] = [];
  if (bpm) {
    const us = Math.round(60_000_000 / bpm);
    events.push(
      0,
      0xff,
      0x51,
      3,
      (us >> 16) & 0xff,
      (us >> 8) & 0xff,
      us & 0xff,
    );
  }
  if (timeSig) {
    events.push(0, 0xff, 0x58, 4, timeSig[0], Math.log2(timeSig[1]), 24, 8);
  }
  if (key) {
    events.push(0, 0xff, 0x59, 2, key.sharps & 0xff, key.minor ? 1 : 0);
  }
  for (const pitch of pitches) {
    events.push(0, 0x90 | channel, pitch, 100);
    events.push(...vlq(PPQ), 0x80 | channel, pitch, 0);
  }
  events.push(0, 0xff, 0x2f, 0);
  return new Uint8Array([
    ...chunk('MThd', [0, 0, 0, 1, (PPQ >> 8) & 0xff, PPQ & 0xff]),
    ...chunk('MTrk', events),
  ]);
}
