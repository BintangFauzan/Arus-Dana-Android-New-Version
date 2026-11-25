# Arus Dana Mobile

Aplikasi Expo/React Native Android dengan JavaScript. Uji pengembangan memakai Expo Go; EAS cloud build oleh Founder.

## Jalankan
1. `npm install`
2. Salin `.env.example` ke `.env` dan isi konfigurasi client Firebase dari project yang sudah ada.
3. `npx expo start` lalu scan QR dengan Expo Go.
4. `npm test` menjalankan unit test; `npm run doctor` memeriksa konfigurasi Expo.

Login Google memerlukan konfigurasi OAuth/Firebase yang benar. Jika kosong, jalur produksi tetap tertutup; tidak ada autentikasi palsu. Fitur inti menggunakan SQLite lokal per UID. Tidak ada ledger yang dikirim ke Firestore atau Analytics.

## Struktur
- `App.js`: navigasi sederhana dan layar utama.
- `App.js`: alur dan komponen layar; saat ini layar dirender dari satu komponen dengan state navigasi.
- `src/screens`: direktori disiapkan; komponen layar belum dipecah menjadi file satu-layar.
- `src/components`: direktori disiapkan untuk komponen bersama; sebagian komponen saat ini helper lokal App.js.
- `src/db`: SQLite dan perhitungan ledger.
- `src/services`: Firebase, akses, analytics, export/backup.
- `src/utils`: utilitas lintas fitur.
- `docs`: audit dan pemetaan backend.

Layar login menggunakan OAuth browser; uji redirect di Expo Go dan build EAS perlu dilakukan Founder. Expo Go tidak mendukung Analytics native, EAS Update penuh, dan allowBackup.
