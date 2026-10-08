const urls = {
  chop: new URL('./worklets/chop.worklet.js', import.meta.url).href,
  granular: new URL('./worklets/granular.worklet.js', import.meta.url).href,
  subharmonic: new URL('./worklets/subharmonic.worklet.js', import.meta.url)
    .href,
};

export function getWorkletUrl(
  name: 'chop' | 'granular' | 'subharmonic',
): string {
  return urls[name];
}

export function setWorkletUrl(
  name: 'chop' | 'granular' | 'subharmonic',
  url: string,
): void {
  urls[name] = url;
}
