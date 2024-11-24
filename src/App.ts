import { Component, Vue, toNative, Ref } from 'vue-facing-decorator';
import { ModuleWorkerWrapper } from './externals/sillytavern-extensions';
import { SttProvider } from './SttProvider';
import { ModuleWorker } from './ModuleWorker';
import { DEBUG_PREFIX, STT_PROVIDERS } from './constants';
import { saveSettingsDebounced } from './externals/sillytavern-script';
import { KeyboardHelper } from './helpers/KeyboardHelper';
import { PushToTalkHelper } from './helpers/PushToTalkHelper';
import { SettingsHelper } from './helpers/SettingsHelper';
import LanguageSelector from './components/language-selector/language-selector.vue';

const UPDATE_INTERVAL = 100;

@Component({
    components: { LanguageSelector }
})
class App extends Vue {

    @Ref readonly ptt!: HTMLInputElement;

    get sttProviderNames(): string[] { return Object.keys(STT_PROVIDERS) }
    get sttProviderSettingsFormInnerHtml(): string { return SttProvider.sttProvider?.settingsHtml ?? '' }

    get sttProviderName() { return SttProvider.sttProviderName }
    set sttProviderName(v) { SttProvider.sttProviderName = v }

    get isShowPttHotkeySelector() { return SttProvider.sttProvider && SttProvider.sttProviderName != "Streaming" }
    get isShowVoiceActivationCheckbox() { return SttProvider.sttProvider && SttProvider.sttProviderName != "Streaming" }

    get voiceActivationEnabled() { return SettingsHelper.settings.voiceActivationEnabled }
    set voiceActivationEnabled(v) { SettingsHelper.settings.voiceActivationEnabled = v; saveSettingsDebounced(); }

    get isShowMessageMode() { return !!SttProvider.sttProvider }
    get messageMode() { return SettingsHelper.settings.messageMode }
    set messageMode(v: string) {
        SettingsHelper.settings.messageMode = v;
        saveSettingsDebounced();
    }

    get isShowMessageMapping() { return !!SttProvider.sttProvider }

    get messageMappingText() { return SettingsHelper.settings.messageMappingText }
    set messageMappingText(v: string) { this.onMessageMappingChange(v) }

    get isMessageMappingEnabled() { return SettingsHelper.settings.messageMappingEnabled }
    set isMessageMappingEnabled(v: boolean) {
        SettingsHelper.settings.messageMappingEnabled = v;
        saveSettingsDebounced();
    }

    messageMappingStatus = '';

    mounted() {
        $(() => {
            this.addExtensionControls(); // No init dependencies

            SettingsHelper.ensureSettingsContainsAllKeys();

            this.ptt.value = SettingsHelper.settings.ptt
                ? KeyboardHelper.formatPushToTalkKey(SettingsHelper.settings.ptt)
                : '';

            SttProvider.sttProviderName = SettingsHelper.settings.currentProvider; // No dependencies

            const wrapper = new ModuleWorkerWrapper(ModuleWorker.moduleWorker);
            setInterval(() => wrapper.update(), UPDATE_INTERVAL); // Init depends on all the things
            ModuleWorker.moduleWorker();
        });
    }

    private addExtensionControls() {
        document.body.addEventListener('keydown', PushToTalkHelper.processPushToTalkStart);
        document.body.addEventListener('keyup', PushToTalkHelper.processPushToTalkEnd);

        const button = $('<div id="microphone_button" class="fa-solid fa-microphone speech-toggle interactable" tabindex="0" title="Click to speak"></div>');
        // For versions before 1.10.10
        if ($('#send_but_sheld').length == 0) {
            $('#rightSendForm').prepend(button);
        } else {
            $('#send_but_sheld').prepend(button);
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

    private async onMessageMappingChange(s: string) {
        let array = s.split(',');
        array = array.map(x => x.trim());
        array = array.filter(x => x !== '');

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

        this.messageMappingStatus = 'Message mapping updated to: ' + JSON.stringify(SettingsHelper.settings.messageMapping);
        console.debug(DEBUG_PREFIX + 'Updated message mapping', SettingsHelper.settings.messageMapping);

        SettingsHelper.settings.messageMappingText = s;

        saveSettingsDebounced();
    }

    public onSttProviderSettingsChanged() {
        SttProvider.sttProvider.onSettingsChange();

        // Persist changes to SillyTavern stt extension settings
        SettingsHelper.settings[SttProvider.sttProviderName] = SttProvider.sttProvider.settings;
        saveSettingsDebounced();
        console.info(`Saved settings ${SttProvider.sttProviderName} ${JSON.stringify(SttProvider.sttProvider.settings)}`);
    }
}
export default toNative(App);
