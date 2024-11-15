export const extension_settings: any;

export interface ISillyTavernContext {
    readonly chat; // Chat log
    readonly characters; // Character list
    readonly groups; // Group list

    generate(): Promie<void>;
}
export function getContext(): ISillyTavernContext;

export class ModuleWorkerWrapper {
    constructor(f: () => Promise<void>);
    update(): void;
}

export function getApiUrl(): string;

export interface ExtrasFetchRequest {
    method: string;
    headers?: { [name: string]: string };
    body?: string | FormData;
}
export function doExtrasFetch(url: URL, options: ExtrasFetchRequest): Promise<Response>;

export const modules: string[];
