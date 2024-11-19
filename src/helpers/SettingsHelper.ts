import { reactive, isReactive } from "vue";
import { extension_settings } from "@/externals/sillytavern-extensions";
import type { KeyCombo } from "./KeyboardHelper";

export interface ISpeechRecognitionSettings {
    enabled: boolean;
    currentProvider: string;
    messageMode: string;
    messageMappingText: string;
    messageMapping: Record<string, string>;
    messageMappingEnabled: boolean;
    voiceActivationEnabled: boolean;
    ptt: KeyCombo; // Push-to-talk key combo

    [sttProviderName: string]: any;
}

export class SettingsHelper {

    private static readonly DEFAULT_SETTINGS: ISpeechRecognitionSettings = {
        enabled: false,
        currentProvider: 'None',
        messageMode: 'append',
        messageMappingText: '',
        messageMapping: {},
        messageMappingEnabled: false,
        voiceActivationEnabled: false,
        ptt: null, // Push-to-talk key combo
    };

    public static get settings(): ISpeechRecognitionSettings { return extension_settings.speech_recognition }

    public static ensureSettingsContainsAllKeys() {
        if (Object.keys(SettingsHelper.settings).length === 0) {
            Object.assign(SettingsHelper.settings, SettingsHelper.DEFAULT_SETTINGS);
        }
        for (const key in SettingsHelper.DEFAULT_SETTINGS) {
            if (typeof SettingsHelper.settings[key] === 'undefined') {
                SettingsHelper.settings[key] = SettingsHelper.DEFAULT_SETTINGS[key];
            }
        }

        if (!isReactive(extension_settings.speech_recognition)) {
            extension_settings.speech_recognition = reactive(extension_settings.speech_recognition);
        }
    }
}
