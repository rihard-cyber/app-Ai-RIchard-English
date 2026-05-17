import React, { useState, useRef, useEffect } from 'react';
import { Bot, Volume2, VolumeX, Languages, Lightbulb, Mic, MicOff, X, Zap, Headphones, ArrowDown, Send, Share2 } from 'lucide-react';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { NativeAudio } from '@capacitor-community/native-audio';
import { AiOrchestrator } from './AiOrchestrator';
import { supabase } from './supabaseClient';
import { GlobalContext } from './App';
import { formatSafeInline } from './utils/safeHtml';

// ==========================================
// RENDER FORMATTED TEXT (Dipindah keluar agar Pure & Efisien)
// ==========================================
const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    let inTable = false;
    let tableRows = [];
    const elements = [];
    const flushTable = (keyIndex) => {
        if (tableRows.length > 0) {
            elements.push(
                <div key={`table-${keyIndex}`} className="overflow-x-auto my-4 rounded-xl border border-slate-200 shadow-sm w-full transform-gpu overscroll-x-contain scroll-smooth pb-2">
                    <table className="min-w-full text-sm text-left whitespace-nowrap md:whitespace-normal">
                        <tbody>
                            {tableRows.map((row, idx) => {
                                const cols = row.split('|').map(c => c.trim()).filter(c => c);
                                if (row.includes('---')) return null;
                                return (
                                    <tr key={idx} className={`${idx === 0 ? 'bg-indigo-50 font-bold text-indigo-900 border-b-2 border-indigo-100' : 'border-t border-slate-100 bg-white'}`}>
                                        {cols.map((col, cidx) => (
                                            <td key={cidx} className="px-4 py-3 border-r last:border-r-0 border-slate-100 align-top" dangerouslySetInnerHTML={{ __html: parseInline(col) }} />
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            );
            tableRows = [];
            inTable = false;
        }
    };

    const parseInline = (str) => formatSafeInline(str);

    lines.forEach((line, i) => {
        if (line.trim().startsWith('|')) {
            inTable = true;
            tableRows.push(line);
        } else {
            if (inTable) flushTable(i);
            if (line.trim()) {
                elements.push(<p key={i} className="mb-2 last:mb-0 leading-relaxed break-words whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: parseInline(line) }} />);
            } else {
                elements.push(<div key={i} className="h-2" />);
            }
        }
    });
    if (inTable) flushTable('end');
    return elements;
};

// ==========================================
// KOMPONEN MEMOIZED: MESSAGE BUBBLE
// ==========================================
const MessageBubble = React.memo(({
    msg,
    idx,
    isLast,
    translation,
    suggestions,
    lastScore,
    onTTS,
    onTranslate,
    onSuggest,
    onSuggestionClick
}) => {
    return (
        <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2 w-full`}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2 w-full animate-in slide-in-from-bottom-2 duration-300`}>
                {msg.role !== 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Bot size={16} />
                    </div>
                )}
                <div className={`relative max-w-[85%] px-4 py-3 rounded-2xl shadow-sm text-sm md:text-base break-words ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                    {renderFormattedText(msg.content)}

                    {msg.role === 'ai' && (
                        <div className="mt-2 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-2 shrink-0 relative z-50">
                            <button onClick={() => onTTS(msg.content)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors shrink-0 touch-manipulation shadow-sm border border-transparent hover:border-slate-200" title="Dengarkan (TTS)">
                                <Volume2 size={18} />
                            </button>
                            <button onClick={() => onTranslate(idx, msg.content)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors shrink-0 touch-manipulation shadow-sm border border-transparent hover:border-slate-200">
                                <Languages size={18} />
                            </button>
                            <button onClick={() => onSuggest(idx)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors shrink-0 touch-manipulation shadow-sm border border-transparent hover:border-slate-200">
                                <Lightbulb size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {translation && (
                <div className="ml-10 max-w-[80%] bg-emerald-50 text-emerald-800 px-4 py-2 rounded-xl text-xs md:text-sm border border-emerald-100 animate-in fade-in slide-in-from-top-1 duration-300">
                    <p className="font-medium italic leading-relaxed">{translation}</p>
                </div>
            )}

            {isLast && msg.role === 'ai' && suggestions && suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pl-10 mt-2 animate-in fade-in slide-in-from-top-2 duration-500">
                    {suggestions.map((s, si) => (
                        <button key={si} onClick={() => onSuggestionClick(s)} className="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-full text-xs md:text-sm hover:bg-blue-50 transition-all active:scale-95 shadow-sm">
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {isLast && msg.role === 'ai' && lastScore && (
                <div className="pl-10 mt-3 w-full max-w-md animate-in zoom-in duration-500">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xl shadow-blue-500/5">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">RichardMeha Feedback</h4>
                            <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-md uppercase">Result Detected</div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            <div className="text-center bg-blue-50 rounded-xl p-2">
                                <div className="text-base font-black text-blue-600">{lastScore.grammar || 0}%</div>
                                <div className="text-[8px] text-slate-500 uppercase font-bold mt-1">Grammar</div>
                            </div>
                            <div className="text-center bg-indigo-50 rounded-xl p-2">
                                <div className="text-base font-black text-indigo-600">{lastScore.vocab || 0}%</div>
                                <div className="text-[8px] text-slate-500 uppercase font-bold mt-1">Vocab</div>
                            </div>
                            <div className="text-center bg-emerald-50 rounded-xl p-2">
                                <div className="text-lg font-black text-emerald-600">{lastScore.fluency}%</div>
                                <div className="text-[8px] text-slate-500 uppercase font-bold mt-1">Fluency</div>
                            </div>
                            <div className="text-center bg-amber-50 rounded-xl p-2">
                                <div className="text-base font-black text-amber-600">{lastScore.comprehension || 0}%</div>
                                <div className="text-[8px] text-slate-500 uppercase font-bold mt-1">Comprehend</div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 italic border-l-2 border-blue-500 pl-3 py-1 mb-3">
                            "{lastScore.feedback}"
                        </p>
                        {lastScore.phonetic && (
                            <div className="mt-2 text-[10px] bg-slate-50 p-2 rounded-xl flex items-center justify-between border border-slate-100">
                                <div className="flex items-center gap-2">
                                    <Volume2 size={12} className="text-slate-400" />
                                    <span className="text-slate-400 font-bold uppercase tracking-widest">Phonetic:</span>
                                </div>
                                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{lastScore.phonetic}</span>
                            </div>
                        )}
                        <button
                            onClick={() => {
                                const text = `Saya baru saja menyelesaikan sesi belajar di RichardMeha AI dengan skor ${lastScore.score}%! (Grammar: ${lastScore.grammar}%, Vocab: ${lastScore.vocab}%, Fluency: ${lastScore.fluency}%). Yuk ikut belajar bareng!`;
                                const url = `https://play.google.com/store/apps/details?id=com.richardmeha.englishku`;
                                const waUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n\n' + url)}`;
                                window.open(waUrl, '_system');
                            }}
                            className="mt-4 w-full py-2 bg-emerald-50 text-emerald-600 font-bold rounded-xl hover:bg-emerald-100 flex items-center justify-center gap-2 transition-colors text-xs"
                        >
                            <Share2 size={14} /> Bagikan Skor ke WhatsApp
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.msg.content === nextProps.msg.content &&
        prevProps.idx === nextProps.idx &&
        prevProps.isLast === nextProps.isLast &&
        prevProps.translation === nextProps.translation &&
        prevProps.suggestions === nextProps.suggestions &&
        prevProps.lastScore === nextProps.lastScore;
});

export default function ChatModule({
    userProfile,
    setUserProfile,
    module,
    basePrompt,
    topic = '',
    startMessage = "Hello! Richard here. Are you ready to practice your English today? 😊",
    hideInputAtStart = false,
    onComplete,
    onBack,
    initialCallMode = false,
    initialSuggestions = [],
    characterName = '',
    characterGender = 'male'
}) {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [callMode, setCallMode] = useState(initialCallMode);
    const [subtitle, setSubtitle] = useState('');
    const [bgmEnabled, setBgmEnabled] = useState(true);

    const [translations, setTranslations] = useState({});
    const [suggestions, setSuggestions] = useState([]);
    const [lastScore, setLastScore] = useState(null);
    const [isTypingEffect, setIsTypingEffect] = useState(false);
    const [micStatus, setMicStatus] = useState('idle');
    const [voicePersonality, setVoicePersonality] = useState('friendly');
    const [sttLang, setSttLang] = useState('en-US');
    const idleTimerRef = useRef(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef(null);
    const manualStopRef = useRef(false);
    const hasInitialized = useRef(false);

    const lastSentTextRef = useRef('');
    const lastSentTimeRef = useRef(0);
    const currentTranscriptRef = useRef('');
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const bgmLoadedRef = useRef(false);
    const sfxLoadedRef = useRef(false);

    const { globalApiKey } = React.useContext(GlobalContext) || {};
    const sessionKey = React.useMemo(() => {
        const raw = `${module || 'chat'}:${topic || characterName || 'general'}`;
        return raw.toLowerCase().replace(/[^a-z0-9:_-]+/g, '-').slice(0, 120);
    }, [module, topic, characterName]);
    const localSessionKey = `richard_session_${userProfile?.email || userProfile?.name || 'guest'}_${sessionKey}`;

    // --- NATIVE AUDIO BGM ---
    useEffect(() => {
        const handleBGM = async () => {
            if (callMode && bgmEnabled) {
                try {
                    // Preload BGM hanya satu kali untuk efisiensi RAM
                    if (!bgmLoadedRef.current) {
                        await NativeAudio.preload({
                            assetId: "lofi-bgm",
                            assetPath: "assets/lofi-bgm.mp3",
                            audioChannelNum: 1,
                            isUrl: false,
                            volume: 0.05 // Mengatur volume dasar saat preload
                        });
                        bgmLoadedRef.current = true;
                        // Ekstra penegasan volume ke 5% dari volume sistem
                        await NativeAudio.setVolume({ assetId: "lofi-bgm", volume: 0.05 });
                    }
                    // Mengulang BGM (Loop) tanpa henti selama CallMode
                    await NativeAudio.loop({ assetId: "lofi-bgm" });
                } catch (e) { console.warn("NativeAudio BGM Error:", e); }
            } else {
                if (bgmLoadedRef.current) {
                    try { await NativeAudio.stop({ assetId: "lofi-bgm" }); } catch (e) { }
                }
            }
        };

        handleBGM();

        return () => {
            // Bersihkan / Hentikan audio saat berpindah dari ChatModule atau jika BGM dimatikan
            if (bgmLoadedRef.current) {
                NativeAudio.stop({ assetId: "lofi-bgm" }).catch(() => { });
            }
        };
    }, [callMode, bgmEnabled]);

    // --- NATIVE AUDIO SFX (DING) ---
    useEffect(() => {
        const initSFX = async () => {
            try {
                await NativeAudio.preload({
                    assetId: "ding-sfx",
                    assetPath: "assets/ding.mp3",
                    audioChannelNum: 1,
                    isUrl: false,
                    volume: 0.6 // Volume yang pas untuk notifikasi
                });
                sfxLoadedRef.current = true;
            } catch (e) {
                console.warn("Gagal memuat SFX:", e);
            }
        };
        initSFX();

        return () => {
            if (sfxLoadedRef.current) {
                NativeAudio.unload({ assetId: "ding-sfx" }).catch(() => { });
            }
        };
    }, []);

    const handleScroll = () => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const shouldShow = scrollHeight - scrollTop - clientHeight > 150;
        if (showScrollButton !== shouldShow) {
            setShowScrollButton(shouldShow);
        }
    };

    const playDing = async () => {
        // 1. Coba putar menggunakan Native Audio terlebih dahulu
        if (sfxLoadedRef.current) {
            try {
                await NativeAudio.play({ assetId: "ding-sfx" });
                return; // Berhenti di sini jika Native Audio berhasil
            } catch (e) { console.warn("Gagal memutar SFX Native", e); }
        }

        // 2. Fallback (Cadangan) ke Web Audio API Synthesizer jika Native Audio error
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            const now = audioCtx.currentTime;
            oscillator.type = 'sine';
            // Suara UI bubble message modern (nada naik sangat cepat)
            oscillator.frequency.setValueAtTime(800, now);
            oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            oscillator.start(now);
            oscillator.stop(now + 0.15);
        } catch (e) { console.warn("Web Audio API tidak didukung", e); }
    };

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            setTimeout(() => {
                chatContainerRef.current?.scrollTo({
                    top: chatContainerRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }, 150);
        });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const resetIdleTimer = () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        setSuggestions([]);
        idleTimerRef.current = setTimeout(() => {
            if (messages.length > 0 && messages[messages.length - 1].role === 'ai') {
                handleSuggest(messages.length - 1);
            }
        }, 5000);
    };

    const handleTranslate = async (index, textToTranslateOverride) => {
        if (translations[index]) {
            setTranslations(prev => {
                const next = { ...prev };
                delete next[index];
                return next;
            });
            return;
        }

        const textToTranslate = textToTranslateOverride || messages[index].content;
        setIsLoading(true);
        try {
            const translation = await AiOrchestrator.translate(textToTranslate, globalApiKey);
            setTranslations(prev => ({ ...prev, [index]: translation }));
        } catch (err) {
            console.error("Translation failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggest = async (index) => {
        const history = messages.slice(0, index + 1).map(m => `${m.role}: ${m.content}`).join('\n');
        try {
            const payload = {
                contents: [{ role: 'user', parts: [{ text: `Conversation history:\n${history}\n\nSuggest 3–4 very short, natural English response options for the user based on the last AI message. Format: Just the options separated by | character. No numbering.` }] }],
                systemInstruction: { parts: [{ text: "You are a helpful assistant providing English conversation suggestions." }] }
            };
            const data = await AiOrchestrator.chat(payload, globalApiKey);
            const rawSuggestions = data.candidates[0].content.parts[0].text;
            const suggestionsList = rawSuggestions.split('|').map(s => s.trim()).filter(s => s);
            setSuggestions(suggestionsList);
        } catch (err) {
            console.error("Suggestions failed", err);
        }
    };

    const detectLanguage = (text) => {
        const indoWords = [
            "saya", "kamu", "dia", "mereka", "kita", "kami", "apa", "kenapa", "bagaimana", "kapan", "siapa", "dimana",
            "makan", "minum", "tidur", "bingung", "ngerti", "paham", "tau", "tahu", "halo", "hai", "bisa", "iya",
            "tidak", "bukan", "gak", "nggak", "udah", "sudah", "belum", "gimana", "dong", "deh", "nih", "tuh", "sih",
            "kok", "banget", "kalau", "kalo", "buat", "biar", "lagi", "aja", "saja", "bagus", "benar", "bener",
            "salah", "coba", "ini", "itu", "dan", "tapi", "karena", "untuk", "dari", "ke", "di", "sama", "dengan",
            "kasih", "beri", "oke", "hari", "orang", "lebih", "sangat", "paling", "sekali", "kalimat", "kata",
            "bilang", "ngomong", "dengar", "denger", "lihat", "liat", "kayak", "seperti", "mantap", "keren", "yakin", "ya"
        ];
        const englishWords = [
            "i", "you", "he", "she", "they", "we", "what", "why", "how", "when", "who", "where",
            "eat", "drink", "sleep", "confused", "understand", "know", "hello", "hi", "can", "yes",
            "no", "not", "already", "yet", "please", "very", "if", "for", "let", "again", "just",
            "good", "right", "wrong", "try", "this", "that", "and", "but", "because", "from", "to", "at",
            "with", "give", "ok", "day", "people", "more", "most", "sentence", "word", "say", "speak",
            "hear", "listen", "see", "look", "like", "awesome", "cool", "sure", "is", "am", "are",
            "do", "does", "did", "was", "were", "will", "would", "could", "should", "have", "has", "had",
            "the", "a", "an", "in", "on", "of", "about", "it", "my", "your", "so", "much", "too",
            "well", "great", "perfect", "job", "nice", "work", "english", "practice", "ready", "now", "time", "today"
        ];
        const lower = text.toLowerCase();
        let indoScore = 0;
        let engScore = 0;

        const words = lower.match(/\b\w+\b/g) || [];
        words.forEach(w => {
            if (indoWords.includes(w)) indoScore++;
            if (englishWords.includes(w)) engScore++;
        });

        return engScore > indoScore ? "en" : "id";
    };

    const handleTTS = async (text) => {
        if (!text) return;
        setIsSpeaking(true);
        const cleanText = text.replace(/❌[\s\S]*?✅/g, '').replace(/[✅❌*#_\\]/g, '').replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').substring(0, 600).trim();
        const isIndo = detectLanguage(cleanText) === 'id';
        let rate = 0.9;
        let pitch = 1.0;
        if (characterName === "Gordon Ramsay") { pitch = 0.8; rate = 1.05; }
        else if (characterName === "Taylor Swift") { pitch = 1.2; rate = 0.95; }
        else if (characterName === "Elon Musk") { pitch = 0.85; rate = 0.85; }
        else if (characterName === "Barack Obama") { pitch = 0.6; rate = 0.8; }
        else if (characterName === "Sherlock Holmes") { pitch = 0.8; rate = 1.1; }
        else if (characterName === "Oprah Winfrey") { pitch = 0.9; rate = 0.9; }
        else if (characterName === "Steve Jobs") { pitch = 0.9; rate = 0.9; }
        else if (characterName === "Keanu Reeves") { pitch = 0.5; rate = 0.75; }
        else if (characterName === "Emma Watson") { pitch = 1.1; rate = 0.95; }
        else if (characterName === "Albert Einstein") { pitch = 0.7; rate = 0.85; }
        else if (characterGender === 'female' && pitch === 1.0) { pitch = 1.2; }

        try {
            await TextToSpeech.speak({
                text: cleanText,
                lang: isIndo ? 'id-ID' : 'en-US',
                rate: rate,
                pitch: pitch,
            });
            setIsSpeaking(false);
        } catch (nativeErr) {
            console.warn("Native TTS error, falling back...", nativeErr);
            try {
                if (AiOrchestrator && AiOrchestrator.speak) {
                    await AiOrchestrator.speak(cleanText, globalApiKey, { lang: isIndo ? 'id-ID' : 'en-US', pitch, rate, voiceId: characterGender === 'female' ? 'EXAVITQu4vr4xnSDxMaL' : '21m00Tcm4TlvDq8ikWAM', onEnd: () => setIsSpeaking(false) });
                } else {
                    throw new Error("No AiOrchestrator");
                }
            } catch (fallbackErr) {
                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.lang = isIndo ? 'id-ID' : 'en-US';
                utterance.rate = rate;
                utterance.pitch = pitch;
                utterance.onend = () => setIsSpeaking(false);
                utterance.onerror = () => setIsSpeaking(false);
                window.speechSynthesis.speak(utterance);
            }
        }
    };

    const extractAndParseJSON = (text) => {
        try {
            let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
            const firstBrace = cleanText.indexOf('{');
            const lastBrace = cleanText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
                let jsonString = cleanText.substring(firstBrace, lastBrace + 1);
                jsonString = jsonString.replace(/[\u0000-\u001F]+/g, "");
                return JSON.parse(jsonString);
            }
            return null;
        } catch (e) {
            console.error("Deep Sanitizer Parse Error:", e);
            return null;
        }
    };

    const toggleRecording = async () => {
        if (isRecording) {
            manualStopRef.current = true;
            setMicStatus('processing');
            setIsRecording(false);
            try {
                const checkAvail = await SpeechRecognition.available().catch(() => ({ available: false }));
                if (checkAvail.available) {
                    await SpeechRecognition.stop();
                }
                recognitionRef.current?.stop();
            } catch (e) { console.error("Stop error", e); }

            const textToSend = currentTranscriptRef.current.trim() || inputValue.trim();
            if (textToSend) {
                sendMessage(textToSend, false, true);
            } else {
                setMicStatus('idle');
            }
            currentTranscriptRef.current = '';
        } else {
            startRecording();
        }
    };

    const startRecording = async () => {
        setIsRecording(true);
        setMicStatus('listening');
        currentTranscriptRef.current = '';

        try {
            const checkAvail = await SpeechRecognition.available().catch(() => ({ available: false }));

            if (checkAvail.available) {
                const perm = await SpeechRecognition.checkPermissions();
                if (perm.speechRecognition !== 'granted') {
                    const req = await SpeechRecognition.requestPermissions();
                    if (req.speechRecognition !== 'granted') {
                        alert("Izin mikrofon ditolak. Jika Anda pernah memblokirnya secara permanen, silakan aktifkan manual di Pengaturan Aplikasi (Settings > Apps).");
                        setIsRecording(false);
                        setMicStatus('idle');
                        return;
                    }
                }

                await SpeechRecognition.removeAllListeners();

                SpeechRecognition.addListener('listeningState', (data) => {
                    if (data.status === 'stopped') {
                        setIsRecording(false);
                        setMicStatus('idle');
                        const textToSend = currentTranscriptRef.current.trim();
                        if (textToSend) {
                            sendMessage(textToSend, false, true);
                        }
                        currentTranscriptRef.current = '';
                    }
                });

                SpeechRecognition.addListener('partialResults', (data) => {
                    if (data.matches && data.matches.length > 0) {
                        const transcript = data.matches[0];
                        currentTranscriptRef.current = transcript;
                        setInputValue(transcript);
                        setMicStatus('detected');
                    }
                });

                await SpeechRecognition.start({
                    language: sttLang,
                    maxResults: 1,
                    prompt: "RichardMeha AI mendengarkan...",
                    partialResults: true,
                    popup: false,
                });
                return;
            }
            throw new Error("Native API tidak tersedia");
        } catch (error) {
            console.warn("Native Mic error, fallback to Web API", error);

            const WebSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!WebSpeechRecognition) {
                alert("Browser tidak mendukung fitur mikrofon.");
                setIsRecording(false);
                setMicStatus('idle');
                return;
            }

            if (!recognitionRef.current) {
                recognitionRef.current = new WebSpeechRecognition();
                recognitionRef.current.lang = sttLang;
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
            }

            recognitionRef.current.onresult = (event) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        const final = event.results[i][0].transcript;
                        currentTranscriptRef.current = final;
                        setInputValue(final);
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                if (interimTranscript) {
                    currentTranscriptRef.current = interimTranscript;
                    setInputValue(interimTranscript);
                    setMicStatus('detected');
                }
            };

            recognitionRef.current.onerror = (event) => {
                if (event.error === 'not-allowed') {
                    alert("Izinkan akses mikrofon di pengaturan browser Anda");
                } else {
                    console.warn("Web Speech API Error:", event.error);
                }
                setIsRecording(false); setMicStatus('idle');
            };
            recognitionRef.current.onend = () => {
                setIsRecording(false); setMicStatus('idle');
                const textToSend = currentTranscriptRef.current.trim();
                if (textToSend) {
                    sendMessage(textToSend, false, true);
                }
                currentTranscriptRef.current = '';
            };

            try { recognitionRef.current.start(); } catch (err) { setIsRecording(false); setMicStatus('idle'); }
        }
    };

    const sendMessage = async (text, isSystemInitiated = false, isVoiceInput = false) => {
        if (!text.trim()) return;

        const now = Date.now();
        if (!isSystemInitiated && text === lastSentTextRef.current && now - lastSentTimeRef.current < 2000) {
            return;
        }
        lastSentTextRef.current = text;
        lastSentTimeRef.current = now;

        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        setSuggestions([]);
        setLastScore(null);

        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
            setMicStatus('processing');
        }

        const lang = detectLanguage(text);
        const modeInstruction = lang === 'id'
            ? "\n[SYSTEM: User is speaking Indonesian. You MUST reply in Indonesian. Be a professional and friendly English teacher. Explain clearly, correct their English if they made mistakes, and provide natural English equivalents.]"
            : "\n[SYSTEM: User is speaking English. You MUST reply fully in English. Act as a professional native English teacher. If there are mistakes, correct them gently using ❌/✅ format.]";

        const newUserMsg = { role: 'user', content: text, isHidden: isSystemInitiated && hideInputAtStart };
        const updatedMessages = [...messages, newUserMsg];

        setMessages(updatedMessages);
        setInputValue('');
        setIsLoading(true);

        const confusionKeywords = ["don't know", "bingung", "help", "susah", "gak ngerti", "sulit", "hard", "kurang paham", "gak tau", "pusing", "ga dong", "confused", "stuck", "lost"];
        const confidenceKeywords = ["yes!", "got it", "paham", "mengerti", "okay!", "ngerti", "i see", "great", "oke"];
        const lowerText = text.toLowerCase();
        const isConfused = confusionKeywords.some(kw => lowerText.includes(kw));
        const isConfident = confidenceKeywords.some(kw => lowerText.includes(kw));
        const emotionState = isConfused
            ? 'CONFUSED — ACTIVATE EMOTIONAL AI: Start with empathy ("Heyy, tenang dulu ya..."), simplify your explanation drastically, ask a much easier question to help them win.'
            : isConfident
                ? 'CONFIDENT — CELEBRATE their win loudly! Then raise difficulty slightly.'
                : 'NORMAL';

        const personalityMap = {
            strict: 'STRICT MODE: Alex becomes very firm about grammar. Rina provides detailed explanations of linguistic rules. No slang. High standards.',
            buddy: 'BUDDY MODE: Rina and Alex use slang (Indo slang for Rina, English slang for Alex). Very casual, high energy, lots of emojis.',
            friendly: 'FRIENDLY MODE: Rina and Alex are warm, patient, and balanced. The default conversational experience.'
        };
        const personalityInstruction = personalityMap[voicePersonality] || personalityMap.friendly;

        const contents = updatedMessages.filter(msg => msg.role !== 'system').map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        const payload = {
            contents: contents,
            systemInstruction: {
                parts: [{
                    text: `${basePrompt}\n\n[CURRENT STATUS: ${emotionState}]\n[VIBE: ${personalityInstruction}]\n${modeInstruction}`
                }]
            },
            generationConfig: {
                temperature: 0.9,
                topP: 0.95,
                maxOutputTokens: 512
            }
        };

        try {
            const data = await AiOrchestrator.chat(payload, globalApiKey);
            let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!aiText) {
                throw new Error("Invalid response format from Gemini");
            }

            if (aiText.includes('---')) {
                const parts = aiText.split('---');
                const potentialJsonStr = parts[parts.length - 1];

                const processScore = (scoreObj) => {
                    const confidence = scoreObj.confidence !== undefined ? scoreObj.confidence : 0.8;
                    const consistencyFactor = 0.9;

                    const baseGrammar = scoreObj.grammar_score ?? scoreObj.grammar ?? 80;
                    const baseVocab = scoreObj.vocab_score ?? scoreObj.vocab ?? 80;
                    const baseFluency = scoreObj.fluency_score ?? scoreObj.fluency ?? 80;
                    const baseComprehension = scoreObj.comprehension_score ?? 80;

                    const finalGrammar = Math.round(baseGrammar * confidence * consistencyFactor);
                    const finalVocab = Math.round(baseVocab * confidence * consistencyFactor);
                    const finalFluency = Math.round(baseFluency * confidence * consistencyFactor);
                    const finalComprehension = Math.round(baseComprehension * confidence * consistencyFactor);
                    const overallScore = Math.round((finalGrammar + finalVocab + finalFluency + finalComprehension) / 4);

                    const finalScoreObj = {
                        ...scoreObj,
                        grammar: finalGrammar,
                        vocab: finalVocab,
                        fluency: finalFluency,
                        comprehension: finalComprehension,
                        score: overallScore
                    };

                    setLastScore(finalScoreObj);

                    const difficultyMultiplier = 20;
                    const performanceMultiplier = overallScore / 100;
                    const earnedXP = Math.max(1, Math.round(difficultyMultiplier * performanceMultiplier * consistencyFactor));

                    updateXP(earnedXP);
                    if (onComplete) onComplete(overallScore);
                };

                let scoreObj = extractAndParseJSON(potentialJsonStr);
                if (scoreObj) {
                    processScore(scoreObj);
                    aiText = parts.slice(0, -1).join('---').trim();
                } else {
                    scoreObj = extractAndParseJSON(aiText);
                    if (scoreObj) {
                        processScore(scoreObj);
                        aiText = aiText.replace(/---[\s\S]*/, '').replace(/\{[\s\S]*\}/, '').trim();
                    }
                }
            } else {
                const scoreObj = extractAndParseJSON(aiText);
                if (scoreObj) {
                    processScore(scoreObj);
                    aiText = aiText.replace(/\{[\s\S]*\}/, '').trim();
                }
            }

            if (isVoiceInput || callMode) {
                handleTTS(aiText);
            }

            if (callMode) {
                setIsTypingEffect(true);
                let currentText = "";
                const words = aiText.split(" ");
                for (let i = 0; i < words.length; i++) {
                    currentText += words[i] + " ";
                    setSubtitle(currentText);
                    await new Promise(r => setTimeout(r, 30));
                }
                setIsTypingEffect(false);
            }

            setMessages(prev => {
                const newMsgs = [...prev, { role: 'ai', content: aiText }];
                setTimeout(() => handleSuggest(newMsgs.length - 1), 100);
                return newMsgs;
            });

            playDing();
        } catch (err) {
            console.error("Gemini API Error:", err);
            let errorMsg = `⚠️ Yah, koneksi internetmu terputus atau AI sedang sibuk nih. Coba periksa koneksimu dan kirim ulang ya! 😊 (Info: ${err.message})`;
            const errStr = err.message ? err.message.toLowerCase() : '';
            if (errStr.includes('quota') || errStr.includes('429') || errStr.includes('rate-limit')) {
                errorMsg = "Yah, AI sedang ramai digunakan atau kuota habis nih beb. Tunggu sebentar ya, atau admin akan segera mengganti jalurnya!";
            }
            setMessages(prev => [...prev, { role: 'system', content: errorMsg }]);
        } finally {
            setIsLoading(false);
            setMicStatus('idle');
        }
    };

    const updateXP = async (amount) => {
        if (amount > 0 && navigator.vibrate) {
            try {
                navigator.vibrate(50);
            } catch (e) { }
        }
        const newXP = (userProfile.xp || 0) + amount;
        setUserProfile(prev => ({ ...prev, xp: newXP }));
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.rpc('increment_xp', { user_id: user.id, amount });
        }
    };

    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const initializeSession = async () => {
            if (initialSuggestions.length > 0) {
                setSuggestions(initialSuggestions);
            }

            try {
                const localSaved = localStorage.getItem(localSessionKey);
                if (localSaved) {
                    const parsed = JSON.parse(localSaved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setMessages(parsed);
                        return;
                    }
                }
            } catch (error) {
                localStorage.removeItem(localSessionKey);
            }

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase
                        .from('lesson_sessions')
                        .select('messages')
                        .eq('user_id', user.id)
                        .eq('session_key', sessionKey)
                        .maybeSingle();

                    if (Array.isArray(data?.messages) && data.messages.length > 0) {
                        setMessages(data.messages);
                        localStorage.setItem(localSessionKey, JSON.stringify(data.messages));
                        return;
                    }
                }
            } catch (error) {
                console.warn("Gagal memuat sesi belajar tersimpan:", error);
            }

            if (hideInputAtStart) {
                sendMessage(startMessage, true);
            } else if (topic) {
                sendMessage(`TODAY'S TOPIC: ${topic}. Let's start our learning session about "${topic}" now!`, true);
            }
        };

        initializeSession();
    }, []);

    useEffect(() => {
        if (!hasInitialized.current || messages.length === 0) return;

        const visibleMessages = messages.filter(msg => !msg.isHidden);
        if (visibleMessages.length === 0) return;

        localStorage.setItem(localSessionKey, JSON.stringify(messages.slice(-40)));

        const saveTimer = setTimeout(async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                await supabase.from('lesson_sessions').upsert({
                    user_id: user.id,
                    session_key: sessionKey,
                    module: module || 'Chat',
                    topic: topic || characterName || 'General',
                    messages: messages.slice(-40),
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id,session_key' });
            } catch (error) {
                console.warn("Gagal menyimpan sesi belajar:", error);
            }
        }, 1200);

        return () => clearTimeout(saveTimer);
    }, [messages, localSessionKey, sessionKey, module, topic, characterName]);

    useEffect(() => {
        resetIdleTimer();
        return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
    }, [messages]);

    // OPTIMASI: Cegah re-render array messages yang berat saat state UI lain berubah (seperti inputValue atau subtitle mengetik)
    const renderedMessages = React.useMemo(() => {
        return messages.map((msg, idx) => (
            !msg.isHidden && (
                <MessageBubble
                    key={idx}
                    msg={msg}
                    idx={idx}
                    isLast={idx === messages.length - 1}
                    translation={translations[idx]}
                    suggestions={suggestions}
                    lastScore={lastScore}
                    onTTS={handleTTS}
                    onTranslate={handleTranslate}
                    onSuggest={handleSuggest}
                    onSuggestionClick={(s) => { setInputValue(s); sendMessage(s, false, false); }}
                />
            )
        ));
    }, [messages, translations, suggestions, lastScore]);

    return (
        <div className="absolute inset-0 flex flex-col bg-slate-50/50 z-20">
            {callMode && (
                <div className="absolute inset-0 bg-[#0f172a] z-50 flex flex-col h-screen h-[100dvh] animate-in fade-in duration-300 transform-gpu">
                    <div className="absolute top-6 left-6 flex items-center gap-2 z-50">
                        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                            {['friendly', 'strict', 'buddy'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setVoicePersonality(p)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${voicePersonality === p ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
                        <button onClick={() => setBgmEnabled(!bgmEnabled)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all shadow-md backdrop-blur-sm" title={bgmEnabled ? "Matikan BGM" : "Nyalakan BGM"}>
                            {bgmEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </button>
                        <button onClick={() => setCallMode(false)} className="p-3 bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 hover:text-rose-100 rounded-full transition-all shadow-md backdrop-blur-sm" title="Tutup Call">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content Area - Scrollable */}
                    <div className="flex-1 overflow-y-auto w-full flex flex-col items-center pt-24 pb-24 px-6 text-center custom-scrollbar">
                        <div className="relative mb-12">
                            {/* Visual Sound Wave (Ripples) */}
                            {isSpeaking && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                    <div className="absolute w-32 h-32 rounded-full border-2 border-blue-400 animate-ping" style={{ animationDuration: '1.5s' }}></div>
                                    <div className="absolute w-32 h-32 rounded-full border-2 border-indigo-400 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '400ms' }}></div>
                                    <div className="absolute w-32 h-32 rounded-full border-2 border-purple-400 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '800ms' }}></div>
                                </div>
                            )}

                            <div className={`w-40 h-40 rounded-full border-4 border-blue-500/30 flex items-center justify-center ${micStatus === 'listening' ? 'animate-pulse' : ''}`}>
                                <div className={`w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 ${isSpeaking ? 'scale-110' : ''} transition-all duration-300 relative z-10`}>
                                    <Bot size={64} className="text-white" />
                                </div>
                            </div>
                            {(isSpeaking || isTypingEffect) && <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-bounce z-20">AI is speaking...</div>}
                        </div>

                        <h2 className="text-2xl font-black text-white mb-2">RichardMeha <span className="text-blue-500">Call</span></h2>

                        <div className="max-w-md w-full mb-8">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                                <p className="text-slate-200 font-medium italic mb-2">"{subtitle || "Silakan bicara, saya mendengarkan..."}"</p>

                                {/* Translation Feature in Call Mode */}
                                {messages.length > 0 && messages[messages.length - 1].role === 'ai' && (
                                    <button
                                        onClick={() => handleTranslate(messages.length - 1)}
                                        className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        <Languages size={14} /> {translations[messages.length - 1] ? "Sembunyikan Terjemahan" : "Klik untuk Terjemahan Indonesia"}
                                    </button>
                                )}

                                {translations[messages.length - 1] && (
                                    <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in slide-in-from-top-1">
                                        <p className="text-xs text-emerald-400 font-medium leading-relaxed">{translations[messages.length - 1]}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dynamic Suggestions for Answering in Call Mode */}
                        {suggestions.length > 0 && !isSpeaking && (
                            <div className="flex flex-wrap justify-center gap-2 max-w-md mb-8 animate-in fade-in slide-in-from-bottom-4">
                                <p className="w-full text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Alternative Answers:</p>
                                {suggestions.map((s, si) => (
                                    <button
                                        key={si}
                                        onClick={() => { setInputValue(s); sendMessage(s, false, false); }}
                                        className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-full text-xs hover:bg-blue-600/40 transition-all active:scale-95"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Transkripsi Live User di Call Mode */}
                        <div className={`w-full max-w-md mb-4 transition-all duration-500 ${isRecording || inputValue ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 text-left">Pesan Anda:</p>
                            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 min-h-[60px] flex items-center justify-center backdrop-blur-md shadow-inner">
                                <p className="text-white text-sm text-center italic">
                                    {inputValue || "Mendengarkan suara Anda..."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar Area - Shrink-0 */}
                    <div className="shrink-0 w-full flex justify-center items-center gap-6 py-3 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] bg-slate-900/80 backdrop-blur-md border-t border-slate-800">
                        <button
                            onClick={toggleRecording}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-90 ${isRecording ? 'bg-rose-500 animate-pulse shadow-rose-500/50' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'}`}
                        >
                            {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500">
                        <X size={20} />
                    </button>
                    <div>
                        <h2 className="font-bold text-slate-800 leading-none">{module || "RichardMeha AI"}</h2>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex bg-slate-50 rounded-lg p-1 border border-slate-100 mr-2">
                        {['friendly', 'strict', 'buddy'].map(p => (
                            <button
                                key={p}
                                onClick={() => setVoicePersonality(p)}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${voicePersonality === p ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                    <div className="px-3 py-1.5 bg-blue-50 rounded-full flex items-center gap-2 border border-blue-100 shadow-sm">
                        <Zap size={14} className="text-blue-600 fill-blue-600" />
                        <span className="text-xs font-black text-blue-700">{userProfile.xp || 0} XP</span>
                    </div>
                    <button
                        onClick={() => setCallMode(true)}
                        className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                    >
                        <Headphones size={20} />
                    </button>
                </div>
            </div>

            {/* Chat Messages */}
            <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-6 transform-gpu overscroll-none scroll-smooth w-full" style={{ paddingBottom: '120px' }}>
                {renderedMessages}
                {isLoading && (
                    <div className="flex items-end gap-2 w-full animate-in fade-in duration-300">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm text-sm flex items-center gap-3 w-fit">
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">AI sedang menganalisa</span>
                            <div className="flex space-x-1.5 items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Floating Scroll to Bottom Button */}
            {showScrollButton && (
                <div className="absolute bottom-[90px] md:bottom-[100px] right-6 z-40 animate-in fade-in zoom-in duration-300">
                    <button
                        onClick={scrollToBottom}
                        className="p-3 md:p-3.5 bg-slate-800/80 backdrop-blur-md text-white rounded-full shadow-xl shadow-slate-900/20 hover:bg-blue-600 hover:border-blue-500 transition-all hover:scale-110 active:scale-95 flex items-center justify-center border border-white/10"
                        title="Scroll ke bawah"
                    >
                        <ArrowDown size={20} />
                    </button>
                </div>
            )}

            {/* Input Form */}
            <div className="relative z-[50] bg-white border-t border-slate-200 w-full py-2 px-3 md:p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] shrink-0" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(inputValue, false, false); }} className="max-w-4xl mx-auto w-full flex items-center gap-2 md:gap-3">
                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={isRecording ? "Mendengarkan..." : "Ketik pesan atau tanya Richard..."}
                        className="flex-1 min-w-0 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-blue-500 focus:bg-white transition-all text-sm md:text-base shadow-inner"
                    />
                    <button
                        type="button"
                        onClick={toggleRecording}
                        className={`p-2.5 rounded-xl transition-all active:scale-90 flex items-center justify-center shadow-md shrink-0 ${isRecording ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/30' : 'bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200'}`}
                    >
                        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>

                    <button
                        type="button"
                        onClick={() => setSttLang(prev => prev === 'en-US' ? 'id-ID' : 'en-US')}
                        className="p-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 w-10 md:w-12 shadow-md shrink-0"
                        title="Ubah Bahasa STT (Mic)"
                    >
                        {sttLang === 'en-US' ? 'EN' : 'ID'}
                    </button>

                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className={`p-2.5 rounded-xl shadow-xl transition-all active:scale-90 flex items-center justify-center shrink-0 ${!inputValue.trim() || isLoading ? 'bg-slate-100 text-slate-300 shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'}`}
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}
