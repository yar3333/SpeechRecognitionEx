import { reactive } from "vue";
import { DEBUG_PREFIX, STT_PROVIDERS } from "./constants";
import { saveSettingsDebounced } from "./externals/sillytavern-script";
import { MediaRecorderHelper } from "./helpers/MediaRecorderHelper";
import { SettingsHelper } from "./helpers/SettingsHelper";
import { TranscriptionHelper } from "./helpers/TranscriptionHelper";
import { UiHelper } from "./helpers/UiHelper";
import type { BrowserSttProvider } from "./stt-providers/BrowserSttProvider";
import type { ISttProvider } from "./stt-providers/ISttProvider";

export class SttProvider {

    private static inner = reactive({
        sttProviderName: "None",
        sttProvider: <ISttProvider>null,
    });

    public static get sttProviderName(): string { return SttProvider.inner.sttProviderName }
    public static set sttProviderName(v: string) {
        SttProvider.loadSttProvider(v)
            .then(_ => saveSettingsDebounced());
    }

    public static get sttProvider() { return SttProvider.inner.sttProvider }

    private static async loadSttProvider(provider: string) {

        // Init provider references
        SettingsHelper.settings.currentProvider = provider;
        SttProvider.inner.sttProviderName = provider;

        if (!(SttProvider.sttProviderName in SettingsHelper.settings)) {
            console.warn(`Provider ${SttProvider.sttProviderName} not in Extension Settings, initiatilizing provider in settings`);
            SettingsHelper.settings[SttProvider.sttProviderName] = {};
        }

        SttProvider.stopCurrentProvider();

        if (SttProvider.sttProviderName == 'None') {
            $('#microphone_button').hide();
            $('#speech_recognition_message_mode_div').hide();
            $('#speech_recognition_message_mapping_div').hide();
            return;
        }

        $('#speech_recognition_message_mode_div').show();
        $('#speech_recognition_message_mapping_div').show();

        SttProvider.inner.sttProvider = new (<any>STT_PROVIDERS)[SttProvider.sttProviderName];

        // Use microphone button as push to talk
        if (SttProvider.sttProviderName == 'Browser') {
            (<BrowserSttProvider><any>SttProvider.sttProvider).processTranscriptFunction = TranscriptionHelper.processTranscript;
            SttProvider.sttProvider.loadSettings(SettingsHelper.settings[SttProvider.sttProviderName]);
            $('#microphone_button').show();
        }

        const nonStreamingProviders = ['Vosk', 'Whisper (OpenAI)', 'Whisper (Extras)', 'Whisper (Local)', 'KoboldCpp'];
        if (nonStreamingProviders.includes(SttProvider.sttProviderName)) {
            SttProvider.sttProvider.loadSettings(SettingsHelper.settings[SttProvider.sttProviderName]);
            await MediaRecorderHelper.loadNavigatorAudioRecording();
            $('#microphone_button').show();
        }

        if (SttProvider.sttProviderName == 'Streaming') {
            SttProvider.sttProvider.loadSettings(SettingsHelper.settings[SttProvider.sttProviderName]);
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
        SettingsHelper.settings[SttProvider.sttProviderName].language = language;
        SttProvider.sttProvider.loadSettings(SettingsHelper.settings[SttProvider.sttProviderName]);
        saveSettingsDebounced();
    }


    static onSttProviderSettingsInput() {
        SttProvider.sttProvider.onSettingsChange();

        // Persist changes to SillyTavern stt extension settings
        SettingsHelper.settings[SttProvider.sttProviderName] = SttProvider.sttProvider.settings;
        saveSettingsDebounced();
        console.info(`Saved settings ${SttProvider.sttProviderName} ${JSON.stringify(SttProvider.sttProvider.settings)}`);
    }
}
