import { getRequestHeaders } from '../externals/sillytavern-script';
import type { ISttProvider } from './ISttProvider';

const DEBUG_PREFIX = '<Speech Recognition module (Whisper OpenAI)> ';

export class WhisperOpenAISttProvider implements ISttProvider {

    settings: { language: string } = null;

    defaultSettings = {
        language: '',
    };

    get settingsHtml() {
        let html = '';
        return html;
    }

    onSettingsChange() {
        // Used when provider settings are updated from UI
    }

    loadSettings(settings: any) {
        // Populate Provider UI given input settings
        if (Object.keys(settings).length == 0) {
            console.debug(DEBUG_PREFIX + 'Using default Whisper (OpenAI) STT extension settings');
        }

        // Only accept keys defined in defaultSettings
        this.settings = this.defaultSettings;

        for (const key in settings) {
            if (key in this.settings) {
                (<any>this.settings)[key] = settings[key];
            } else {
                throw `Invalid setting passed to STT extension: ${key}`;
            }
        }

        console.debug(DEBUG_PREFIX + 'Whisper (OpenAI) STT settings loaded');
    }

    async processAudio(audioBlob: Blob) {
        const requestData = new FormData();
        requestData.append('avatar', audioBlob, 'record.wav');

        // TODO: Add model selection to settings when more models are available
        requestData.append('model', 'whisper-1');

        if (this.settings.language) {
            requestData.append('language', this.settings.language);
        }

        // It's not a JSON, let fetch set the content type
        const headers = getRequestHeaders();
        delete (<any>headers)['Content-Type'];

        const apiResult = await fetch('/api/openai/transcribe-audio', {
            method: 'POST',
            headers: headers,
            body: requestData,
        });

        if (!apiResult.ok) {
            window.toastr.error(apiResult.statusText, 'STT Generation Failed (Whisper OpenAI)', { timeOut: 10000, extendedTimeOut: 20000, preventDuplicates: true });
            throw new Error(`HTTP ${apiResult.status}: ${await apiResult.text()}`);
        }

        const result = await apiResult.json();
        return result.text;
    }

}
