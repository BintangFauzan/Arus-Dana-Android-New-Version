# Persiapan Founder

Beberapa langkah ini memerlukan akun/konsol Founder dan tidak dijalankan oleh agent.

## Firebase client config
1. Ambil konfigurasi aplikasi Web dari Firebase Console untuk project yang sama dengan dashboard.
2. Salin nilai publik ke `.env` (jangan memasukkan service-account key):

```dotenv
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
```

`google-services.json` belum tersedia. Jika diperlukan analytics native di EAS, unduh untuk aplikasi Android yang sudah terdaftar `com.bintangfauzandyan.arusdana` dan letakkan di root project.

## EAS / rilis Android
1. Jalankan `npx eas-cli login`, lalu `npx eas-cli init`; simpan project ID hasil init pada konfigurasi aplikasi.
2. Siapkan signing credentials melalui EAS (`npx eas-cli credentials -p android`) dan gunakan SHA-1 yang dihasilkan.
3. Tambahkan SHA-1 di Firebase Console → Project settings → aplikasi Android; aktifkan Google Sign-In di Authentication.
4. Isi `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` dengan Web client ID OAuth dari Google/Firebase.
5. Tinjau `firebase/rules.proposed` jika file tersedia. Perubahan rules berdampak ke dashboard; uji dan deploy sendiri. Jangan deploy tanpa pemeriksaan.
6. Jalankan build APK uji: `npx eas-cli build --platform android --profile preview`. Uji login Google, analytics, EAS Update, `allowBackup=false`, restore backup, serta seluruh alur offline di perangkat fisik.
7. Setelah uji lulus: `npx eas-cli build --platform android --profile production`.

## Daftar uji di build EAS
- Google OAuth dengan SHA-1 signing yang benar.
- Analytics native; Expo Go hanya memakai no-op.
- Update EAS pada channel yang sesuai.
- Kebijakan backup Android (`allowBackup=false`).
- Pastikan `EXPO_PUBLIC_DEV_SKIP_LOGIN` tidak aktif pada artifact EAS.
