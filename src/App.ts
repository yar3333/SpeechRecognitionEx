import { Component, Vue, toNative, Ref } from 'vue-facing-decorator';
import { ModuleWorkerWrapper } from './externals/sillytavern-extensions';
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

    @Ref readonly sttProviderSettingsForm!: HTMLFormElement;
    @Ref readonly ptt!: HTMLInputElement;

    get sttProviderNames(): string[] { return Object.keys(STT_PROVIDERS) }
    get sttProviderSettingsFormInnerHtml(): string { return SttProvider.sttProvider?.settingsHtml ?? '' }

    get sttProviderName() { return SttProvider.sttProviderName }
    set sttProviderName(v) { SttProvider.sttProviderName = v }

    get language() { return SttProvider.sttProvider?.settings?.language }
    set language(v) { SttProvider.onSttLanguageChange(v) }

    get isShowPttHotkeySelector() { return SttProvider.sttProvider && SttProvider.sttProviderName != "Streaming" }
    get isShowVoiceActivationCheckbox() { return SttProvider.sttProvider && SttProvider.sttProviderName != "Streaming" }

    get voiceActivationEnabled() { return SettingsHelper.settings.voiceActivationEnabled }
    set voiceActivationEnabled(v) { SettingsHelper.settings.voiceActivationEnabled = v; saveSettingsDebounced(); }

    mounted() {
        $(() => {
            this.setup();
        });
    }

    private setup() {
        this.addExtensionControls(); // No init dependencies
        this.loadSettings(); // Depends on Extension Controls and loadTtsProvider
        SttProvider.sttProviderName = SettingsHelper.settings.currentProvider; // No dependencies
        const wrapper = new ModuleWorkerWrapper(ModuleWorker.moduleWorker);
        setInterval(wrapper.update.bind(wrapper), UPDATE_INTERVAL); // Init depends on all the things
        ModuleWorker.moduleWorker();
    }

    private addExtensionControls() {
        $(this.sttProviderSettingsForm).on('input', SttProvider.onSttProviderSettingsInput);

        $('#speech_recognition_message_mode').on('change', () => this.onMessageModeChange());
        $('#speech_recognition_message_mapping').on('change', () => this.onMessageMappingChange());
        $('#speech_recognition_message_mapping_enabled').on('click', () => this.onMessageMappingEnabledClick());

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

    public onPttFocus() {
        this.ptt.value = 'Enter a key combo. "Escape" to clear';
        $(this.ptt).off('keydown').on('keydown', e => {
            e.preventDefault();
            e.stopPropagation();

            if (e.key === 'Meta' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Control') {
                return;
            }

            if (e.key === 'Escape') {
                SettingsHelper.settings.ptt = null;
                saveSettingsDebounced();
                return this.ptt.blur();
            }

            const keyCombo = KeyboardHelper.keyboardEventToKeyCombo(<KeyboardEvent><any>e);
            SettingsHelper.settings.ptt = keyCombo;
            saveSettingsDebounced();
            return this.ptt.blur();
        });
    }

    public onPttBlur() {
        $(this.ptt).off('keydown');
        if (SettingsHelper.settings.ptt) {
            this.ptt.value = KeyboardHelper.formatPushToTalkKey(SettingsHelper.settings.ptt);
        } else {
            this.ptt.value = '';
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
        this.ptt.value = SettingsHelper.settings.ptt
            ? KeyboardHelper.formatPushToTalkKey(SettingsHelper.settings.ptt)
            : '';
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
}
export default toNative(App);
