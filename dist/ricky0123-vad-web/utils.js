"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioFileToArray = exports.encodeWAV = exports.arrayBufferToBase64 = exports.minFramesForTargetMS = void 0;
function minFramesForTargetMS(targetDuration, frameSamples, sr = 16000) {
    return Math.ceil((targetDuration * sr) / 1000 / frameSamples);
}
exports.minFramesForTargetMS = minFramesForTargetMS;
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    const binary = new Array(len);
    for (var i = 0; i < len; i++) {
        const byte = bytes[i];
        if (byte === undefined) {
            break;
        }
        binary[i] = String.fromCharCode(byte);
    }
    return btoa(binary.join(""));
}
exports.arrayBufferToBase64 = arrayBufferToBase64;
/*
This rest of this was mostly copied from https://github.com/linto-ai/WebVoiceSDK
*/
function encodeWAV(samples, format = 3, sampleRate = 16000, numChannels = 1, bitDepth = 32) {
    var bytesPerSample = bitDepth / 8;
    var blockAlign = numChannels * bytesPerSample;
    var buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
    var view = new DataView(buffer);
    /* RIFF identifier */
    writeString(view, 0, "RIFF");
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * bytesPerSample, true);
    /* RIFF type */
    writeString(view, 8, "WAVE");
    /* format chunk identifier */
    writeString(view, 12, "fmt ");
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, format, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * blockAlign, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, blockAlign, true);
    /* bits per sample */
    view.setUint16(34, bitDepth, true);
    /* data chunk identifier */
    writeString(view, 36, "data");
    /* data chunk length */
    view.setUint32(40, samples.length * bytesPerSample, true);
    if (format === 1) {
        // Raw PCM
        floatTo16BitPCM(view, 44, samples);
    }
    else {
        writeFloat32(view, 44, samples);
    }
    return buffer;
}
exports.encodeWAV = encodeWAV;
function interleave(inputL, inputR) {
    var length = inputL.length + inputR.length;
    var result = new Float32Array(length);
    var index = 0;
    var inputIndex = 0;
    while (index < length) {
        result[index++] = inputL[inputIndex];
        result[index++] = inputR[inputIndex];
        inputIndex++;
    }
    return result;
}
function writeFloat32(output, offset, input) {
    for (var i = 0; i < input.length; i++, offset += 4) {
        output.setFloat32(offset, input[i], true);
    }
}
function floatTo16BitPCM(output, offset, input) {
    for (var i = 0; i < input.length; i++, offset += 2) {
        var s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
}
function writeString(view, offset, string) {
    for (var i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
async function audioFileToArray(audioFileData) {
    const ctx = new OfflineAudioContext(1, 1, 44100);
    const reader = new FileReader();
    let audioBuffer = null;
    await new Promise((res) => {
        reader.addEventListener("loadend", (ev) => {
            const audioData = reader.result;
            ctx.decodeAudioData(audioData, (buffer) => {
                audioBuffer = buffer;
                ctx
                    .startRendering()
                    .then((renderedBuffer) => {
                    console.log("Rendering completed successfully");
                    res();
                })
                    .catch((err) => {
                    console.error(`Rendering failed: ${err}`);
                });
            }, (e) => {
                console.log(`Error with decoding audio data: ${e}`);
            });
        });
        reader.readAsArrayBuffer(audioFileData);
    });
    if (audioBuffer === null) {
        throw Error("some shit");
    }
    let _audioBuffer = audioBuffer;
    let out = new Float32Array(_audioBuffer.length);
    for (let i = 0; i < _audioBuffer.length; i++) {
        for (let j = 0; j < _audioBuffer.numberOfChannels; j++) {
            // @ts-ignore
            out[i] += _audioBuffer.getChannelData(j)[i];
        }
    }
    return { audio: out, sampleRate: _audioBuffer.sampleRate };
}
exports.audioFileToArray = audioFileToArray;
//# sourceMappingURL=utils.js.map