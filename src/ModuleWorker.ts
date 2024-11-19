import { DEBUG_PREFIX } from "./constants";
import { TranscriptionHelper } from "./helpers/TranscriptionHelper";
import type { StreamingSttProvider } from "./stt-providers/StreamingSttProvider";
import { SttProvider } from "./SttProvider";

export class ModuleWorker {

    public static inApiCall: boolean;

    public static async moduleWorker() {
        if (SttProvider.sttProviderName != 'Streaming') return;
        if (ModuleWorker.inApiCall) return;

        try {
            ModuleWorker.inApiCall = true;

            const userMessageOriginal = await (<StreamingSttProvider><any>SttProvider.sttProvider).getUserMessage();
            let userMessageFormatted = userMessageOriginal.trim();

            if (userMessageFormatted.length > 0) {
                console.debug(DEBUG_PREFIX + 'recorded transcript: "' + userMessageFormatted + '"');

                let userMessageLower = userMessageFormatted.toLowerCase();
                // remove punctuation
                let userMessageRaw = userMessageLower.replace(/[^\p{L}\p{M}\s']/gu, '').replace(/\s+/g, ' ');

                console.debug(DEBUG_PREFIX + 'raw transcript:', userMessageRaw);

                // Detect trigger words
                let messageStart = -1;

                const streamingSettings = (<StreamingSttProvider><any>SttProvider.sttProvider).settings;

                if (streamingSettings.triggerWordsEnabled) {

                    for (const triggerWord of streamingSettings.triggerWords) {
                        const triggerPos = userMessageRaw.indexOf(triggerWord.toLowerCase());

                        // Trigger word not found or not starting message and just a substring
                        if (triggerPos == -1) { // | (triggerPos > 0 & userMessageFormatted[triggerPos-1] != " ")) {
                            console.debug(DEBUG_PREFIX + 'trigger word not found: ', triggerWord);
                        }
                        else {
                            console.debug(DEBUG_PREFIX + 'Found trigger word: ', triggerWord, ' at index ', triggerPos);
                            if (triggerPos < messageStart || messageStart == -1) { // & (triggerPos + triggerWord.length) < userMessageFormatted.length)) {
                                messageStart = triggerPos; // + triggerWord.length + 1;

                                if (!streamingSettings.triggerWordsIncluded)
                                    messageStart = triggerPos + triggerWord.length + 1;
                            }
                        }
                    }
                } else {
                    messageStart = 0;
                }

                if (messageStart == -1) {
                    console.debug(DEBUG_PREFIX + 'message ignored, no trigger word preceding a message. Voice transcript: "' + userMessageOriginal + '"');
                    if (streamingSettings.debug) {
                        window.toastr.info(
                            'No trigger word preceding a message. Voice transcript: "' + userMessageOriginal + '"',
                            DEBUG_PREFIX + 'message ignored.',
                            { timeOut: 10000, extendedTimeOut: 20000, preventDuplicates: true },
                        );
                    }
                }
                else {
                    userMessageFormatted = userMessageFormatted.substring(messageStart);
                    // Trim non alphanumeric character from the start
                    messageStart = 0;
                    for (const i of userMessageFormatted) {
                        if (/^[\p{L}\p{M}]$/iu.test(i)) {
                            break;
                        }
                        messageStart += 1;
                    }
                    userMessageFormatted = userMessageFormatted.substring(messageStart);
                    userMessageFormatted = userMessageFormatted.charAt(0).toUpperCase() + userMessageFormatted.substring(1);
                    TranscriptionHelper.processTranscript(userMessageFormatted);
                }
            }
            else {
                console.debug(DEBUG_PREFIX + 'Received empty transcript, ignored');
            }
        }
        catch (error) {
            console.debug(error);
        }
        finally {
            ModuleWorker.inApiCall = false;
        }
    }
}
