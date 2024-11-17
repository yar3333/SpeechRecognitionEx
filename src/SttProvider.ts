import { DEBUG_PREFIX, STT_PROVIDERS } from "./constants";
import { extension_settings } from "./externals/sillytavern-extensions";
import { saveSettingsDebounced } from "./externals/sillytavern-script";
import { MediaRecorderHelper } from "./helpers/MediaRecorderHelper";
import { TranscriptionHelper } from "./helpers/TranscriptionHelper";
import { UiHelper } from "./helpers/UiHelper";

export class SttProvider {

    public static sttProviderName = "none";
    public static sttProvider: any;

    public static async loadSttProvider(provider: string) {
        //Clear the current config and add new config
        $('#speech_recognition_provider_settings').html('');

        // Init provider references
        extension_settings.speech_recognition.currentProvider = provider;
        this.sttProviderName = provider;

        if (!(this.sttProviderName in extension_settings.speech_recognition)) {
            console.warn(`Provider ${this.sttProviderName} not in Extension Settings, initiatilizing provider in settings`);
            extension_settings.speech_recognition[this.sttProviderName] = {};
        }

        $('#speech_recognition_provider').val(this.sttProviderName);

        this.stopCurrentProvider();

        if (this.sttProviderName == 'None') {
            $('#microphone_button').hide();
            $('#speech_recognition_message_mode_div').hide();
            $('#speech_recognition_message_mapping_div').hide();
            $('#speech_recognition_language_div').hide();
            $('#speech_recognition_ptt_div').hide();
            $('#speech_recognition_voice_activation_enabled_div').hide();
            return;
        }

        $('#speech_recognition_message_mode_div').show();
        $('#speech_recognition_message_mapping_div').show();
        $('#speech_recognition_language_div').show();

        this.sttProvider = new STT_PROVIDERS[this.sttProviderName];

        // Init provider settings
        $('#speech_recognition_provider_settings').append(this.sttProvider.settingsHtml);

        // Use microphone button as push to talk
        if (this.sttProviderName == 'Browser') {
            $('#speech_recognition_language_div').hide();
            this.sttProvider.processTranscriptFunction = TranscriptionHelper.processTranscript;
            this.sttProvider.loadSettings(extension_settings.speech_recognition[this.sttProviderName]);
            $('#microphone_button').show();
        }

        const nonStreamingProviders = ['Vosk', 'Whisper (OpenAI)', 'Whisper (Extras)', 'Whisper (Local)', 'KoboldCpp'];
        if (nonStreamingProviders.includes(this.sttProviderName)) {
            this.sttProvider.loadSettings(extension_settings.speech_recognition[this.sttProviderName]);
            await MediaRecorderHelper.loadNavigatorAudioRecording();
            $('#microphone_button').show();
        }

        if (this.sttProviderName == 'Streaming') {
            this.sttProvider.loadSettings(extension_settings.speech_recognition[this.sttProviderName]);
            $('#microphone_button').off('click');
            $('#microphone_button').hide();
        }

        $('#speech_recognition_ptt_div').toggle(this.sttProviderName != 'Streaming');
        $('#speech_recognition_voice_activation_enabled_div').toggle(this.sttProviderName != 'Streaming');
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

    static onSttLanguageChange() {
        extension_settings.speech_recognition[this.sttProviderName].language = String($('#speech_recognition_language').val());
        this.sttProvider.loadSettings(extension_settings.speech_recognition[this.sttProviderName]);
        saveSettingsDebounced();
    }

    static async onSttProviderChange() {
        const sttProviderSelection = <string>$('#speech_recognition_provider').val();
        await this.loadSttProvider(sttProviderSelection);
        saveSettingsDebounced();
    }

    static onSttProviderSettingsInput() {
        this.sttProvider.onSettingsChange();

        // Persist changes to SillyTavern stt extension settings
        extension_settings.speech_recognition[this.sttProviderName] = this.sttProvider.settings;
        saveSettingsDebounced();
        console.info(`Saved settings ${this.sttProviderName} ${JSON.stringify(this.sttProvider.settings)}`);
    }
}
