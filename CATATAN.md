# Catatan Pekerjaan

## 18 Juni 2026

### Diskusi: Fitur Voice Call Baru

#### Keputusan
❌ **Tidak pakai Flutter terpisah** untuk fitur call.
✅ **Bangun di project yang sama** (React + Capacitor).

#### Alasan
- Arsitektur saat ini sudah hybrid (React + Capacitor) — semua plugin native (STT, TTS, audio) sudah tersedia
- Backend + AI logic (Gemini, scoring, auth, payment) tidak perlu diduplikasi
- Flutter = start from scratch + maintenance 2x codebase
- Fitur call di sini push-to-talk voice chat, BUKAN real-time WebRTC — web + Capacitor sudah cukup

#### Rencana Lanjutan (Besok)
1. Buat komponen `CallScreen.jsx` terpisah (folder `src/call/` atau `src/modules/CallFeature/`)
2. Pisahkan logika call dari `ChatModule.jsx` yang sekarang terlalu besar (1156 baris)
3. Manfaatkan plugin Capacitor yang sudah ada:
   - `@capacitor-community/speech-recognition` → STT
   - `@capacitor-community/text-to-speech` → TTS
   - `@capacitor-community/native-audio` → BGM
4. Kalau perlu fitur native Android khusus → buat custom Capacitor plugin (Java), bukan Flutter
