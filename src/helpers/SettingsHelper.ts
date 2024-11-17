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
        if (Object.keys(this.settings).length === 0) {
            Object.assign(this.settings, this.DEFAULT_SETTINGS);
        }
        for (const key in this.DEFAULT_SETTINGS) {
            if (typeof this.settings[key] === 'undefined') {
                this.settings[key] = this.DEFAULT_SETTINGS[key];
            }
        }
    }
}
