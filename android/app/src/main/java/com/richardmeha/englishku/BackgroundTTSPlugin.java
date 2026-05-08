package com.richardmeha.englishku;

import android.media.AudioManager;
import android.media.ToneGenerator;
import android.speech.tts.TextToSpeech;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;

@CapacitorPlugin(name = "BackgroundTTS")
public class BackgroundTTSPlugin extends Plugin implements TextToSpeech.OnInitListener {
    private TextToSpeech tts;
    private boolean isReady = false;

    @Override
    public void load() {
        super.load();
        // Inisialisasi Android Native TTS Engine
        tts = new TextToSpeech(getContext(), this);
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            isReady = true;
            // Set bahasa ke Indonesia sebagai default
            tts.setLanguage(new Locale("id", "ID"));
        }
    }

    @PluginMethod
    public void speakInBackground(PluginCall call) {
        String text = call.getString("text");

        if (!isReady) {
            call.reject("TTS Engine belum siap!");
            return;
        }

        if (text == null || text.isEmpty()) {
            call.reject("Teks tidak boleh kosong!");
            return;
        }

        // QUEUE_FLUSH = Menghentikan suara sebelumnya jika ada, lalu memutar yang baru
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "BgTTS");

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void playBeep(PluginCall call) {
        // Menggunakan ToneGenerator untuk menghasilkan suara efek native tanpa butuh
        // file MP3
        ToneGenerator toneGen = new ToneGenerator(AudioManager.STREAM_MUSIC, 100);
        // Memutar nada pendek (150 milidetik)
        toneGen.startTone(ToneGenerator.TONE_PROP_BEEP, 150);

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
}