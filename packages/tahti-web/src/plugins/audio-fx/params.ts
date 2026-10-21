/** Sets an AudioParam. With a context it glides there over a few ms
 * (`setTargetAtTime`), so dragging a slider during playback doesn't click;
 * without one (first build, test fakes) it jumps. */
export function setParam(
  param: AudioParam,
  value: number,
  ctx?: BaseAudioContext,
) {
  if (ctx && typeof param.setTargetAtTime === 'function') {
    param.setTargetAtTime(value, ctx.currentTime, 0.015);
  } else {
    param.value = value;
  }
}
