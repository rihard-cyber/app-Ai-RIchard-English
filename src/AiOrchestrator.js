import { generateChatResponse } from './ChatService';
import { translateText } from './TranslationService';
import { speakText } from './VoiceService';

export const AiOrchestrator = {
    chat: generateChatResponse,
    translate: translateText,
    speak: speakText
};