import { registerPlugin } from '@capacitor/core';

// Registrasikan nama plugin yang sama persis dengan yang ada di anotasinya (@CapacitorPlugin(name="BackgroundTTS"))
const BackgroundTTS = registerPlugin('BackgroundTTS');

export default BackgroundTTS;