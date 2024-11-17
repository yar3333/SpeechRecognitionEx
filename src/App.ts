import { Component, Vue, toNative } from 'vue-facing-decorator';
import { extension_settings, ModuleWorkerWrapper } from './externals/sillytavern-extensions';
import { SttProvider } from './SttProvider';
import { ModuleWorker } from './ModuleWorker';
import { DEBUG_PREFIX, DEFAULT_SETTINGS, STT_PROVIDERS } from './constants';
import { saveSettingsDebounced } from './externals/sillytavern-script';
import { KeyboardHelper } from './helpers/KeyboardHelper';
import { PushToTalkHelper } from './helpers/PushToTalkHelper';

const UPDATE_INTERVAL = 100;

@Component
class App extends Vue {

    mounted() {
        $(() => {
            this.setup();
        });
    }

    setup() {
        this.addExtensionControls(); // No init dependencies
        this.loadSettings(); // Depends on Extension Controls and loadTtsProvider
        SttProvider.loadSttProvider(extension_settings.speech_recognition.currentProvider); // No dependencies
        const wrapper = new ModuleWorkerWrapper(ModuleWorker.moduleWorker);
        setInterval(wrapper.update.bind(wrapper), UPDATE_INTERVAL); // Init depends on all the things
        ModuleWorker.moduleWorker();
    }

    private addExtensionControls() {
        $('#speech_recognition_provider_settings').on('input', SttProvider.onSttProviderSettingsInput);
        for (const provider in STT_PROVIDERS) {
            $('#speech_recognition_provider').append($('<option />').val(provider).text(provider));
            console.debug(DEBUG_PREFIX + 'added option ' + provider);
        }
        $('#speech_recognition_provider').on('change', SttProvider.onSttProviderChange);
        $('#speech_recognition_message_mode').on('change', () => this.onMessageModeChange());
        $('#speech_recognition_message_mapping').on('change', () => this.onMessageMappingChange());
        $('#speech_recognition_language').on('change', SttProvider.onSttLanguageChange);
        $('#speech_recognition_message_mapping_enabled').on('click', () => this.onMessageMappingEnabledClick());
        $('#speech_recognition_voice_activation_enabled').on('change', () => this.onVoiceActivationEnabledChange());
        $('#speech_recognition_ptt').on('focus', function () {
            if (this instanceof HTMLInputElement) {
                this.value = 'Enter a key combo. "Escape" to clear';
                $(this).off('keydown').on('keydown', function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    if (e.key === 'Meta' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Control') {
                        return;
                    }

                    if (e.key === 'Escape') {
                        extension_settings.speech_recognition.ptt = null;
                        saveSettingsDebounced();
                        return this.blur();
                    }

                    const keyCombo = KeyboardHelper.keyboardEventToKeyCombo(<KeyboardEvent><any>e);
                    extension_settings.speech_recognition.ptt = keyCombo;
                    saveSettingsDebounced();
                    return this.blur();
                });
            }
        });
        $('#speech_recognition_ptt').on('blur', function () {
            if (this instanceof HTMLInputElement) {
                $(this).off('keydown');
                if (extension_settings.speech_recognition.ptt) {
                    this.value = KeyboardHelper.formatPushToTalkKey(extension_settings.speech_recognition.ptt);
                } else {
                    this.value = '';
                }
            }
        });

        document.body.addEventListener('keydown', PushToTalkHelper.processPushToTalkStart);
        document.body.addEventListener('keyup', PushToTalkHelper.processPushToTalkEnd);

        const $button = $('<div id="microphone_button" class="fa-solid fa-microphone speech-toggle interactable" tabindex="0" title="Click to speak"></div>');
        // For versions before 1.10.10
        if ($('#send_but_sheld').length == 0) {
            $('#rightSendForm').prepend($button);
        } else {
            $('#send_but_sheld').prepend($button);
        }
    }

    private loadSettings() {
        if (Object.keys(extension_settings.speech_recognition).length === 0) {
            Object.assign(extension_settings.speech_recognition, DEFAULT_SETTINGS);
        }
        for (const key in DEFAULT_SETTINGS) {
            if (extension_settings.speech_recognition[key] === undefined) {
                extension_settings.speech_recognition[key] = DEFAULT_SETTINGS[key];
            }
        }
        $('#speech_recognition_enabled').prop('checked', extension_settings.speech_recognition.enabled);
        $('#speech_recognition_message_mode').val(extension_settings.speech_recognition.messageMode);

        if (extension_settings.speech_recognition.messageMappingText.length > 0) {
            $('#speech_recognition_message_mapping').val(extension_settings.speech_recognition.messageMappingText);
        }

        $('#speech_recognition_message_mapping_enabled').prop('checked', extension_settings.speech_recognition.messageMappingEnabled);
        $('#speech_recognition_ptt').val(extension_settings.speech_recognition.ptt
            ? KeyboardHelper.formatPushToTalkKey(extension_settings.speech_recognition.ptt)
            : '');
        $('#speech_recognition_voice_activation_enabled').prop('checked', extension_settings.speech_recognition.voiceActivationEnabled);
    }

    async onMessageModeChange() {
        extension_settings.speech_recognition.messageMode = $('#speech_recognition_message_mode').val();

        if (SttProvider.sttProviderName != 'Browser' && extension_settings.speech_recognition.messageMode == 'auto_send') {
            $('#speech_recognition_wait_response_div').show();
        }
        else {
            $('#speech_recognition_wait_response_div').hide();
        }

        saveSettingsDebounced();
    }

    private async onMessageMappingChange() {
        let array = String($('#speech_recognition_message_mapping').val()).split(',');
        array = array.map(element => { return element.trim(); });
        array = array.filter((str) => str !== '');
        extension_settings.speech_recognition.messageMapping = {};
        for (const text of array) {
            if (text.includes('=')) {
                const pair = text.toLowerCase().split('=');
                extension_settings.speech_recognition.messageMapping[pair[0].trim()] = pair[1].trim();
                console.debug(DEBUG_PREFIX + 'Added mapping', pair[0], '=>', extension_settings.speech_recognition.messageMapping[pair[0]]);
            }
            else {
                console.debug(DEBUG_PREFIX + 'Wrong syntax for message mapping, no \'=\' found in:', text);
            }
        }

        $('#speech_recognition_message_mapping_status').text('Message mapping updated to: ' + JSON.stringify(extension_settings.speech_recognition.messageMapping));
        console.debug(DEBUG_PREFIX + 'Updated message mapping', extension_settings.speech_recognition.messageMapping);
        extension_settings.speech_recognition.messageMappingText = $('#speech_recognition_message_mapping').val();
        saveSettingsDebounced();
    }

    private async onMessageMappingEnabledClick() {
        extension_settings.speech_recognition.messageMappingEnabled = $('#speech_recognition_message_mapping_enabled').is(':checked');
        saveSettingsDebounced();
    }

    private onVoiceActivationEnabledChange() {
        extension_settings.speech_recognition.voiceActivationEnabled = !!$('#speech_recognition_voice_activation_enabled').prop('checked');
        saveSettingsDebounced();
    }
}
export default toNative(App);
