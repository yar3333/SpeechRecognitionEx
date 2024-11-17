import { Component, Vue, toNative } from 'vue-facing-decorator';
import { extension_settings, ModuleWorkerWrapper } from './externals/sillytavern-extensions';
import { SttProvider } from './SttProvider';
import { ModuleWorker } from './ModuleWorker';
import { DEBUG_PREFIX, STT_PROVIDERS } from './constants';
import { saveSettingsDebounced } from './externals/sillytavern-script';
import { KeyboardHelper } from './helpers/KeyboardHelper';
import { PushToTalkHelper } from './helpers/PushToTalkHelper';
import { SettingsHelper } from './helpers/SettingsHelper';

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
        SttProvider.loadSttProvider(SettingsHelper.settings.currentProvider); // No dependencies
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
                        SettingsHelper.settings.ptt = null;
                        saveSettingsDebounced();
                        return this.blur();
                    }

                    const keyCombo = KeyboardHelper.keyboardEventToKeyCombo(<KeyboardEvent><any>e);
                    SettingsHelper.settings.ptt = keyCombo;
                    saveSettingsDebounced();
                    return this.blur();
                });
            }
        });
        $('#speech_recognition_ptt').on('blur', function () {
            if (this instanceof HTMLInputElement) {
                $(this).off('keydown');
                if (SettingsHelper.settings.ptt) {
                    this.value = KeyboardHelper.formatPushToTalkKey(SettingsHelper.settings.ptt);
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
        SettingsHelper.ensureSettingsContainsAllKeys();

        $('#speech_recognition_enabled').prop('checked', SettingsHelper.settings.enabled);
        $('#speech_recognition_message_mode').val(SettingsHelper.settings.messageMode);

        if (SettingsHelper.settings.messageMappingText.length > 0) {
            $('#speech_recognition_message_mapping').val(SettingsHelper.settings.messageMappingText);
        }

        $('#speech_recognition_message_mapping_enabled').prop('checked', SettingsHelper.settings.messageMappingEnabled);
        $('#speech_recognition_ptt').val(SettingsHelper.settings.ptt
            ? KeyboardHelper.formatPushToTalkKey(SettingsHelper.settings.ptt)
            : '');
        $('#speech_recognition_voice_activation_enabled').prop('checked', SettingsHelper.settings.voiceActivationEnabled);
    }

    async onMessageModeChange() {
        SettingsHelper.settings.messageMode = <string>$('#speech_recognition_message_mode').val();

        if (SttProvider.sttProviderName != 'Browser' && SettingsHelper.settings.messageMode == 'auto_send') {
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
        SettingsHelper.settings.messageMapping = {};
        for (const text of array) {
            if (text.includes('=')) {
                const pair = text.toLowerCase().split('=');
                SettingsHelper.settings.messageMapping[pair[0].trim()] = pair[1].trim();
                console.debug(DEBUG_PREFIX + 'Added mapping', pair[0], '=>', SettingsHelper.settings.messageMapping[pair[0]]);
            }
            else {
                console.debug(DEBUG_PREFIX + 'Wrong syntax for message mapping, no \'=\' found in:', text);
            }
        }

        $('#speech_recognition_message_mapping_status').text('Message mapping updated to: ' + JSON.stringify(SettingsHelper.settings.messageMapping));
        console.debug(DEBUG_PREFIX + 'Updated message mapping', SettingsHelper.settings.messageMapping);
        SettingsHelper.settings.messageMappingText = <string>$('#speech_recognition_message_mapping').val();
        saveSettingsDebounced();
    }

    private async onMessageMappingEnabledClick() {
        SettingsHelper.settings.messageMappingEnabled = $('#speech_recognition_message_mapping_enabled').is(':checked');
        saveSettingsDebounced();
    }

    private onVoiceActivationEnabledChange() {
        SettingsHelper.settings.voiceActivationEnabled = !!$('#speech_recognition_voice_activation_enabled').prop('checked');
        saveSettingsDebounced();
    }
}
export default toNative(App);
