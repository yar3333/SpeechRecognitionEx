import { DEBUG_PREFIX, URL_TO_EXTENSION } from "@/constants";
import { LoaderHelper } from "./LoaderHelper";
import { WaveHelper } from "./WaveHelper";
import { SttProvider } from "@/SttProvider";
import { TranscriptionHelper } from "./TranscriptionHelper";
import { UiHelper } from "./UiHelper";
import { SettingsHelper } from "./SettingsHelper";

export class MediaRecorderHelper {

    private static readonly constraints = {
        audio: {
            sampleSize: 16,
            channelCount: 1,
            sampleRate: 16000
        }
    };

    public static audioRecording = false;
    private static audioChunks: Blob[] = [];

    public static mediaRecorder: MediaRecorder = null;

    public static async loadNavigatorAudioRecording() {
        if (!navigator.mediaDevices.getUserMedia) {
            console.debug(DEBUG_PREFIX + 'getUserMedia not supported on your browser!');
            window.toastr.error('getUserMedia not supported', DEBUG_PREFIX + 'not supported for your browser.', { timeOut: 10000, extendedTimeOut: 20000, preventDuplicates: true });
        }
        console.debug(DEBUG_PREFIX + ' getUserMedia supported by browser.');

        await MediaRecorderHelper.loadScripts();

        const micButton = $('#microphone_button');

        let stream: MediaStream;
        try { stream = await navigator.mediaDevices.getUserMedia(MediaRecorderHelper.constraints) }
        catch (e) { console.debug(DEBUG_PREFIX + 'The following error occured: ' + e) }


        const myVAD = await window.vad.MicVAD.new({
            redemptionFrames: 15,

            onSpeechStart: () => {
                if (!MediaRecorderHelper.audioRecording && SettingsHelper.settings.voiceActivationEnabled) {
                    console.debug(DEBUG_PREFIX + 'Voice started');
                    if (micButton.is(':visible')) {
                        micButton.trigger('click');
                    }
                }
            },
            onSpeechEnd: async (audio: Float32Array) => {
                if (MediaRecorderHelper.audioRecording && SettingsHelper.settings.voiceActivationEnabled) {
                    console.debug(DEBUG_PREFIX + 'Voice stopped');
                    if (micButton.is(':visible')) {
                        micButton.trigger('click');
                        await processPcmArrays(16000, [audio]);
                    }
                }
            }
        });
        myVAD.start()

        MediaRecorderHelper.mediaRecorder = new MediaRecorder(stream);

        micButton.off('click').on('click', () => {
            if (!MediaRecorderHelper.audioRecording) {
                if (!SettingsHelper.settings.voiceActivationEnabled) {
                    MediaRecorderHelper.mediaRecorder.start();
                }
                console.debug(DEBUG_PREFIX + MediaRecorderHelper.mediaRecorder.state);
                console.debug(DEBUG_PREFIX + 'recorder started');
                MediaRecorderHelper.audioRecording = true;
                UiHelper.activateMicIcon(micButton);
            }
            else {
                if (!SettingsHelper.settings.voiceActivationEnabled) {
                    MediaRecorderHelper.mediaRecorder.stop();
                }
                console.debug(DEBUG_PREFIX + MediaRecorderHelper.mediaRecorder.state);
                console.debug(DEBUG_PREFIX + 'recorder stopped');
                MediaRecorderHelper.audioRecording = false;
                UiHelper.deactivateMicIcon(micButton);
            }
        });

        MediaRecorderHelper.mediaRecorder.onstop = async () => {
            const r = await WaveHelper.convertAudioChunksToPcmArray(MediaRecorderHelper.audioChunks);
            await processPcmArrays(r.sampleRate, r.pcmArrays);
        };

        MediaRecorderHelper.mediaRecorder.ondataavailable = (e) => {
            MediaRecorderHelper.audioChunks.push(e.data);
        };

        async function processPcmArrays(sampleRate: number, pcmArrays: Float32Array[]) {
            const wavBlob = await WaveHelper.convertPcmArraysToWavBlob(sampleRate, pcmArrays);
            const transcript = await SttProvider.sttProvider.processAudio(wavBlob);
            // TODO: lock and release recording while processing?
            console.debug(DEBUG_PREFIX + 'received transcript:', transcript);
            TranscriptionHelper.processTranscript(transcript);
        }

    }

    private static async loadScripts() {
        //await loadScript("https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/ort.js");
        //await loadScript("https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.19/dist/bundle.min.js");
        await LoaderHelper.loadScript(URL_TO_EXTENSION + "/vad/onnxruntime-web/ort.js");
        await LoaderHelper.loadScript(URL_TO_EXTENSION + "/vad/ricky0123-vad-web/bundle.min.js");

        return new Promise((resolve) => {
            setTimeout(() => resolve(null), 1);
        });
    }
}
