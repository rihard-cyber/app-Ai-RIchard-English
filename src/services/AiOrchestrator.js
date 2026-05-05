import { generateChatResponse } from './ChatService.js';
import { translateText } from '../TranslationService.js';
import { speakText } from './VoiceService.js';

export const AiOrchestrator = {
    chat: generateChatResponse,
    translate: translateText,
    speak: speakText
};