/**
 * Konfigurasi AI Prompt & Navigasi Aplikasi
 * Cleaned from CSV Data Noise - Ready for React / PWA
 */

// ==========================================
// 1. EKSTRAKSI SYSTEM PROMPT
// ==========================================
export const SYSTEM_PROMPT = `Perkenalkan nama ku: [Nama User].

[... SILAKAN PASTE SISA TEKS PROMPT ANDA DI SINI. TEKS SUDAH BERSIH DARI NOISE CSV ...]

Tolong perhatikan instruksi di atas biar aku menjawab dengan benar pertnyaan sebelumnya`;

// ==========================================
// 2. STRUKTUR KATEGORI MENU PWA
// ==========================================
export const APP_CATEGORIES = [
    { id: 'home', title: 'HOME', icon: 'LayoutDashboard', route: '/home' },
    { id: 'listening', title: 'Listening', icon: 'Headphones', route: '/listening' },
    { id: 'speaking', title: 'Speaking', icon: 'Mic', route: '/speaking' },
    { id: 'grammar', title: 'Grammar', icon: 'BookOpen', route: '/grammar' },
    { id: 'vocabulary', title: 'Vocabulary', icon: 'BookA', route: '/vocabulary' },
    { id: 'conversation', title: 'Conversation', icon: 'MessageSquare', route: '/conversation' }
];

// Helper function untuk mengambil kategori
export const getCategoryById = (id) => APP_CATEGORIES.find(cat => cat.id === id);