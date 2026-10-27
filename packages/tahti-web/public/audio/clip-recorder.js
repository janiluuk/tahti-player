class ClipRecorder extends globalThis.AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(4096);
    this.length = 0;
    this.stopped = false;
    this.port.onmessage = () => {
      if (this.length) {
        this.port.postMessage(this.buffer.slice(0, this.length));
      }
      this.stopped = true;
      this.port.postMessage('stopped');
    };
  }
  process(inputs) {
    if (this.stopped) {
      return false;
    }
    const channels = inputs[0];
    if (!channels?.length) {
      return true;
    }
    for (let i = 0; i < channels[0].length; i++) {
      let sample = 0;
      for (const channel of channels) {
        sample += channel[i] / channels.length;
      }
      this.buffer[this.length++] = sample;
      if (this.length === this.buffer.length) {
        this.port.postMessage(this.buffer, [this.buffer.buffer]);
        this.buffer = new Float32Array(4096);
        this.length = 0;
      }
    }
    return true;
  }
}
globalThis.registerProcessor('clip-recorder', ClipRecorder);
