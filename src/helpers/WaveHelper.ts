import { DEBUG_PREFIX, URL_TO_EXTENSION } from "@/constants";

export class WaveHelper {

    public static async convertAudioChunksToPcmArray(audioChunks: Blob[]): Promise<{ sampleRate: number, pcmArrays: number[][] }> {
        console.debug(DEBUG_PREFIX + 'data available after MediaRecorder.stop() called: ', audioChunks.length, ' chunks');
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
        const arrayBuffer = await audioBlob.arrayBuffer();

        // Use AudioContext to decode our array buffer into an audio buffer
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioChunks = [];

        const pcmArrays = [];
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
            pcmArrays.push(audioBuffer.getChannelData(i));
        }

        return {
            sampleRate: audioBuffer.sampleRate,
            pcmArrays
        };
    }

    public static convertPcmArraysToWavBlob(sampleRate: number, pcmArrays: number[][]): Promise<Blob> {
        return new Promise((resolve) => {
            var worker = new Worker(URL_TO_EXTENSION + '/dist/wave-worker.js');

            worker.onmessage = (e) => {
                var blob = new Blob([e.data.buffer], { type: 'audio/wav' });
                resolve(blob);
            };

            worker.postMessage({
                pcmArrays,
                config: { sampleRate: sampleRate },
            });
        });
    }
}
