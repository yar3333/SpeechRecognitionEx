import { DEBUG_PREFIX, URL_TO_EXTENSION } from "@/constants";
import { LoaderHelper } from "./LoaderHelper";
import { extension_settings } from "@/externals/sillytavern-extensions";
import { WaveHelper } from "./WaveHelper";
import { SttProvider } from "@/SttProvider";
import { TranscriptionHelper } from "./TranscriptionHelper";
import { UiHelper } from "./UiHelper";

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

        await this.loadScripts();

        const micButton = $('#microphone_button');

        let stream: MediaStream;
        try { stream = await navigator.mediaDevices.getUserMedia(this.constraints) }
        catch (e) { console.debug(DEBUG_PREFIX + 'The following error occured: ' + e) }


        const myVAD = await window.vad.MicVAD.new({
            redemptionFrames: 15,

            onSpeechStart: () => {
                if (!this.audioRecording && extension_settings.speech_recognition.voiceActivationEnabled) {
                    console.debug(DEBUG_PREFIX + 'Voice started');
                    if (micButton.is(':visible')) {
                        micButton.trigger('click');
                    }
                }
            },
            onSpeechEnd: async (audio) => {
                if (this.audioRecording && extension_settings.speech_recognition.voiceActivationEnabled) {
                    console.debug(DEBUG_PREFIX + 'Voice stopped');
                    if (micButton.is(':visible')) {
                        micButton.trigger('click');
                        await processPcmArrays(16000, [audio]);
                    }
                }
            }
        });
        myVAD.start()

        this.mediaRecorder = new MediaRecorder(stream);

        micButton.off('click').on('click', () => {
            if (!this.audioRecording) {
                if (!extension_settings.speech_recognition.voiceActivationEnabled) {
                    this.mediaRecorder.start();
                }
                console.debug(DEBUG_PREFIX + this.mediaRecorder.state);
                console.debug(DEBUG_PREFIX + 'recorder started');
                this.audioRecording = true;
                UiHelper.activateMicIcon(micButton);
            }
            else {
                if (!extension_settings.speech_recognition.voiceActivationEnabled) {
                    this.mediaRecorder.stop();
                }
                console.debug(DEBUG_PREFIX + this.mediaRecorder.state);
                console.debug(DEBUG_PREFIX + 'recorder stopped');
                this.audioRecording = false;
                UiHelper.deactivateMicIcon(micButton);
            }
        });

        this.mediaRecorder.onstop = async () => {
            const r = await WaveHelper.convertAudioChunksToPcmArray(this.audioChunks);
            await processPcmArrays(r.sampleRate, r.pcmArrays);
        };

        this.mediaRecorder.ondataavailable = (e) => {
            this.audioChunks.push(e.data);
        };

        async function processPcmArrays(sampleRate, pcmArrays) {
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
