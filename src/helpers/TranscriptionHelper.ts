import { sendMessageAsUser } from '../externals/sillytavern-script';
import { getContext, extension_settings } from '../externals/sillytavern-extensions';
import { DEBUG_PREFIX } from '../constants';

declare global {
    interface Window { vad: any; }
}

export class TranscriptionHelper {

    public static async processTranscript(transcript: string): Promise<void> {
        try {
            const transcriptOriginal = transcript;
            let transcriptFormatted = transcriptOriginal.trim();

            if (transcriptFormatted.length > 0) {
                console.debug(DEBUG_PREFIX + 'recorded transcript: "' + transcriptFormatted + '"');
                const messageMode = extension_settings.speech_recognition.messageMode;
                console.debug(DEBUG_PREFIX + 'mode: ' + messageMode);

                let transcriptLower = transcriptFormatted.toLowerCase();
                // remove punctuation
                let transcriptRaw = transcriptLower.replace(/[^\w\s\'а-я]|_/g, '').replace(/\s+/g, ' ');

                // Check message mapping
                if (extension_settings.speech_recognition.messageMappingEnabled) {
                    // also check transcriptFormatted for non ascii keys
                    for (const s of [transcriptRaw, transcriptFormatted]) {
                        console.debug(DEBUG_PREFIX + 'Start searching message mapping into:', s);
                        for (const key in extension_settings.speech_recognition.messageMapping) {
                            console.debug(DEBUG_PREFIX + 'message mapping searching: ', key, '=>', extension_settings.speech_recognition.messageMapping[key]);
                            if (s.includes(key)) {
                                var message = extension_settings.speech_recognition.messageMapping[key];
                                console.debug(DEBUG_PREFIX + 'message mapping found: ', key, '=>', extension_settings.speech_recognition.messageMapping[key]);
                                $('#send_textarea').val(message);

                                if (messageMode == 'auto_send') await getContext().generate();
                                return;
                            }
                        }
                    }
                }

                console.debug(DEBUG_PREFIX + 'no message mapping found, processing transcript as normal message');
                const textarea = $('#send_textarea');

                switch (messageMode) {
                    case 'auto_send':
                        // clear message area to avoid double message
                        textarea.val('')[0].dispatchEvent(new Event('input', { bubbles: true }));

                        await sendMessageAsUser(transcriptFormatted);
                        await getContext().generate();

                        $('#debug_output').text('<SST-module DEBUG>: message sent: "' + transcriptFormatted + '"');
                        break;

                    case 'replace':
                        console.debug(DEBUG_PREFIX + 'Replacing message');
                        textarea.val(transcriptFormatted);
                        break;

                    case 'append':
                        console.debug(DEBUG_PREFIX + 'Appending message');
                        const existingMessage = textarea.val();
                        textarea.val(existingMessage + ' ' + transcriptFormatted);
                        break;

                    default:
                        console.debug(DEBUG_PREFIX + 'Not supported stt message mode: ' + messageMode);

                }
            }
            else {
                console.debug(DEBUG_PREFIX + 'Empty transcript, do nothing');
            }
        }
        catch (error) {
            console.debug(error);
        }
    }
}
