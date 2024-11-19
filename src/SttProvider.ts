import { DEBUG_PREFIX, STT_PROVIDERS } from "./constants";
import { saveSettingsDebounced } from "./externals/sillytavern-script";
import { MediaRecorderHelper } from "./helpers/MediaRecorderHelper";
import { SettingsHelper } from "./helpers/SettingsHelper";
import { TranscriptionHelper } from "./helpers/TranscriptionHelper";
import { UiHelper } from "./helpers/UiHelper";
import type { BrowserSttProvider } from "./stt-providers/BrowserSttProvider";
import type { ISttProvider } from "./stt-providers/ISttProvider";

export class SttProvider {

    private static _sttProviderName = "None";

    public static get sttProviderName() { return this._sttProviderName }
    public static set sttProviderName(v: string) {
        SttProvider.loadSttProvider(v)
            .then(_ => saveSettingsDebounced());
    }

    public static sttProvider: ISttProvider;

    private static async loadSttProvider(provider: string) {

        // Init provider references
        SettingsHelper.settings.currentProvider = provider;
        this._sttProviderName = provider;

        if (!(this.sttProviderName in SettingsHelper.settings)) {
            console.warn(`Provider ${this.sttProviderName} not in Extension Settings, initiatilizing provider in settings`);
            SettingsHelper.settings[this.sttProviderName] = {};
        }

        this.stopCurrentProvider();

        if (this.sttProviderName == 'None') {
            $('#microphone_button').hide();
            $('#speech_recognition_message_mode_div').hide();
            $('#speech_recognition_message_mapping_div').hide();
            return;
        }

        $('#speech_recognition_message_mode_div').show();
        $('#speech_recognition_message_mapping_div').show();

        this.sttProvider = new STT_PROVIDERS[this.sttProviderName];

        // Use microphone button as push to talk
        if (this.sttProviderName == 'Browser') {
            (<BrowserSttProvider><any>this.sttProvider).processTranscriptFunction = TranscriptionHelper.processTranscript;
            this.sttProvider.loadSettings(SettingsHelper.settings[this.sttProviderName]);
            $('#microphone_button').show();
        }

        const nonStreamingProviders = ['Vosk', 'Whisper (OpenAI)', 'Whisper (Extras)', 'Whisper (Local)', 'KoboldCpp'];
        if (nonStreamingProviders.includes(this.sttProviderName)) {
            this.sttProvider.loadSettings(SettingsHelper.settings[this.sttProviderName]);
            await MediaRecorderHelper.loadNavigatorAudioRecording();
            $('#microphone_button').show();
        }

        if (this.sttProviderName == 'Streaming') {
            this.sttProvider.loadSettings(SettingsHelper.settings[this.sttProviderName]);
            $('#microphone_button').off('click');
            $('#microphone_button').hide();
        }
    }

    static stopCurrentProvider() {
        console.debug(DEBUG_PREFIX + 'stop current provider');
        if (MediaRecorderHelper.mediaRecorder) {
            MediaRecorderHelper.mediaRecorder.onstop = null;
            MediaRecorderHelper.mediaRecorder.ondataavailable = null;
            MediaRecorderHelper.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            MediaRecorderHelper.mediaRecorder.stop();
            MediaRecorderHelper.mediaRecorder = null;
        }
        if (MediaRecorderHelper.audioRecording) {
            MediaRecorderHelper.audioRecording = false;
            const micButton = $('#microphone_button');
            if (micButton.is(':visible')) {
                UiHelper.deactivateMicIcon(micButton);
            }
        }
    }

    static onSttLanguageChange(language: string) {
        SettingsHelper.settings[this.sttProviderName].language = language;
        this.sttProvider.loadSettings(SettingsHelper.settings[this.sttProviderName]);
        saveSettingsDebounced();
    }


    static onSttProviderSettingsInput() {
        this.sttProvider.onSettingsChange();

        // Persist changes to SillyTavern stt extension settings
        SettingsHelper.settings[this.sttProviderName] = this.sttProvider.settings;
        saveSettingsDebounced();
        console.info(`Saved settings ${this.sttProviderName} ${JSON.stringify(this.sttProvider.settings)}`);
    }
}
