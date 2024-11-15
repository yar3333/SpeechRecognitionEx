var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
self.onmessage = (e) => {
  const wavPCM = new WavePCM(e["data"]["config"]);
  wavPCM.record(e["data"]["pcmArrays"]);
  wavPCM.requestData();
};
class WavePCM {
  constructor(config) {
    __publicField(this, "sampleRate");
    __publicField(this, "bitDepth");
    __publicField(this, "recordedBuffers");
    __publicField(this, "bytesPerSample");
    __publicField(this, "numberOfChannels");
    this.sampleRate = config.sampleRate || 48e3;
    this.bitDepth = config.bitDepth || 16;
    this.recordedBuffers = [];
    this.bytesPerSample = this.bitDepth / 8;
  }
  record(buffers) {
    this.numberOfChannels = this.numberOfChannels || buffers.length;
    const bufferLength = buffers[0].length;
    const reducedData = new Uint8Array(bufferLength * this.numberOfChannels * this.bytesPerSample);
    for (let i = 0; i < bufferLength; i++) {
      for (let channel = 0; channel < this.numberOfChannels; channel++) {
        const outputIndex = (i * this.numberOfChannels + channel) * this.bytesPerSample;
        let sample = buffers[channel][i];
        if (sample > 1) {
          sample = 1;
        } else if (sample < -1) {
          sample = -1;
        }
        switch (this.bytesPerSample) {
          case 4:
            sample = sample * 2147483648;
            reducedData[outputIndex] = sample;
            reducedData[outputIndex + 1] = sample >> 8;
            reducedData[outputIndex + 2] = sample >> 16;
            reducedData[outputIndex + 3] = sample >> 24;
            break;
          case 3:
            sample = sample * 8388608;
            reducedData[outputIndex] = sample;
            reducedData[outputIndex + 1] = sample >> 8;
            reducedData[outputIndex + 2] = sample >> 16;
            break;
          case 2:
            sample = sample * 32768;
            reducedData[outputIndex] = sample;
            reducedData[outputIndex + 1] = sample >> 8;
            break;
          case 1:
            reducedData[outputIndex] = (sample + 1) * 128;
            break;
          default:
            throw "Only 8, 16, 24 and 32 bits per sample are supported";
        }
      }
    }
    this.recordedBuffers.push(reducedData);
  }
  requestData() {
    const bufferLength = this.recordedBuffers[0].length;
    const dataLength = this.recordedBuffers.length * bufferLength;
    const headerLength = 44;
    const wav = new Uint8Array(headerLength + dataLength);
    const view = new DataView(wav.buffer);
    view.setUint32(0, 1380533830, false);
    view.setUint32(4, 36 + dataLength, true);
    view.setUint32(8, 1463899717, false);
    view.setUint32(12, 1718449184, false);
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, this.numberOfChannels, true);
    view.setUint32(24, this.sampleRate, true);
    view.setUint32(28, this.sampleRate * this.bytesPerSample * this.numberOfChannels, true);
    view.setUint16(32, this.bytesPerSample * this.numberOfChannels, true);
    view.setUint16(34, this.bitDepth, true);
    view.setUint32(36, 1684108385, false);
    view.setUint32(40, dataLength, true);
    for (let i = 0; i < this.recordedBuffers.length; i++) {
      wav.set(this.recordedBuffers[i], i * bufferLength + headerLength);
    }
    self.postMessage(wav, [wav.buffer]);
    self.close();
  }
}
