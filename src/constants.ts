import { BrowserSttProvider } from "./stt-providers/BrowserSttProvider";
import { KoboldCppSttProvider } from "./stt-providers/KoboldCppSttProvider";
import { StreamingSttProvider } from "./stt-providers/StreamingSttProvider";
import { VoskSttProvider } from "./stt-providers/VoskSttProvider";
import { WhisperExtrasSttProvider } from "./stt-providers/WhisperExtrasSttProvider";
import { WhisperLocalSttProvider } from "./stt-providers/WhisperLocalSttProvider";
import { WhisperOpenAISttProvider } from "./stt-providers/WhisperOpenAISttProvider";

export const MODULE_NAME = 'Speech Recognition Ex';
export const DEBUG_PREFIX = '<Speech Recognition Ex module> ';
export const URL_TO_EXTENSION = '/scripts/extensions/third-party/SpeechRecognitionEx';

export const STT_PROVIDERS = {
    None: null,
    Browser: BrowserSttProvider,
    'KoboldCpp': KoboldCppSttProvider,
    'Whisper (Extras)': WhisperExtrasSttProvider,
    'Whisper (OpenAI)': WhisperOpenAISttProvider,
    'Whisper (Local)': WhisperLocalSttProvider,
    Vosk: VoskSttProvider,
    Streaming: StreamingSttProvider,
};
