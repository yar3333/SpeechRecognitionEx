import { DEBUG_PREFIX } from "@/constants";
import { MediaRecorderHelper } from "./MediaRecorderHelper";
import { KeyboardHelper } from "./KeyboardHelper";
import { SttProvider } from "@/SttProvider";
import { SettingsHelper } from "./SettingsHelper";

export class PushToTalkHelper {

    private static lastPressTime = 0;

    public static isPushToTalkEnabled(): boolean {
        return SettingsHelper.settings.ptt !== null
            && SttProvider.sttProviderName !== 'Streaming'
            && SttProvider.sttProviderName !== 'None';
    }

    public static processPushToTalkStart(event: KeyboardEvent) {
        // Push-to-talk not enabled
        if (!PushToTalkHelper.isPushToTalkEnabled()) return;


        const key = SettingsHelper.settings.ptt;

        // Key combo match - toggle recording
        if (KeyboardHelper.isKeyComboMatch(key, event) && !event.repeat) {
            console.debug(DEBUG_PREFIX + 'Push-to-talk key pressed');
            PushToTalkHelper.lastPressTime = Date.now();
            $('#microphone_button').trigger('click');
        }
    }

    public static processPushToTalkEnd(event: KeyboardEvent) {
        if (!PushToTalkHelper.isPushToTalkEnabled()) return;

        const key = SettingsHelper.settings.ptt;

        // Key combo match (without modifier keys)
        if (key.code === event.code) {
            console.debug(DEBUG_PREFIX + 'Push-to-talk key released');

            // If the key was held for more than 500ms and still recording, stop recording
            if (Date.now() - PushToTalkHelper.lastPressTime > 500 && MediaRecorderHelper.audioRecording) {
                $('#microphone_button').trigger('click');
            }
        }
    }
}
