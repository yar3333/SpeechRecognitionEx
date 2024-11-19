export interface ISttProvider {

    readonly settings: any;
    readonly settingsHtml: string;

    loadSettings(data: any): void;
    onSettingsChange(): void;
    processAudio(wavBlob: Blob): Promise<string>;
}
