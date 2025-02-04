import { getApiUrl, doExtrasFetch } from '../externals/sillytavern-extensions';
import type { ISttProvider } from './ISttProvider';

const DEBUG_PREFIX = '<Speech Recognition module (Vosk)> ';

export class VoskSttProvider implements ISttProvider {

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
            console.debug(DEBUG_PREFIX + 'Using default vosk STT extension settings');
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

        console.debug(DEBUG_PREFIX + 'Vosk STT settings loaded');
    }

    async processAudio(audioblob: Blob) {
        var requestData = new FormData();
        requestData.append('AudioFile', audioblob, 'record.wav');
        requestData.append('language', this.settings.language);

        const url = new URL(getApiUrl());
        url.pathname = '/api/speech-recognition/vosk/process-audio';

        const apiResult = await doExtrasFetch(url, {
            method: 'POST',
            body: requestData,
        });

        if (!apiResult.ok) {
            window.toastr.error(apiResult.statusText, 'STT Generation Failed  (Vosk)', { timeOut: 10000, extendedTimeOut: 20000, preventDuplicates: true });
            throw new Error(`HTTP ${apiResult.status}: ${await apiResult.text()}`);
        }

        const result = await apiResult.json();
        return result.transcript;
    }
}
