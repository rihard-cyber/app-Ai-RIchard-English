import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDirs = [
    path.join(__dirname, '../node_modules/@capacitor'),
    path.join(__dirname, '../node_modules/@capacitor-community')
];

function fixProguard(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            fixProguard(fullPath);
        } else if (entry.name === 'build.gradle') {
            let content = fs.readFileSync(fullPath, 'utf8');
            // Regex mendeteksi kutip satu maupun ganda pada proguard-android.txt
            const regex = /getDefaultProguardFile\(['"]proguard-android\.txt['"]\)/g;
            if (regex.test(content)) {
                const newContent = content.replace(regex, "getDefaultProguardFile('proguard-android-optimize.txt')");
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`✅ [Auto-Fix] Diperbarui: ${fullPath.split('node_modules')[1]}`);
            }
        }
    }
}

console.log('🔍 Memeriksa kompatibilitas AGP 8.0+ pada plugin Capacitor...');
targetDirs.forEach(dir => fixProguard(dir));
console.log('🎉 Selesai! Semua file build.gradle siap digunakan.');