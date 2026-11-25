# Keputusan Implementasi

## Konteks
- Proyek mobile baru; folder kerja awal hanya berisi PRD dan plan, tanpa aplikasi maupun Git repository.
- Dashboard bersifat read-only dan skema telah dibaca dari `BACKEND_SCHEMA.md`.

## Keputusan
1. Ledger menggunakan `expo-sqlite` dan nominal integer rupiah, sesuai rekomendasi PRD; perubahan mudah dibalik sebelum rilis pertama.
2. Android package memakai `com.bintangfauzandyan.arusdana`, sebagaimana telah didaftarkan Founder.
3. Review Bulanan masuk sebagai layar ringan MVP (ringkasan masuk/keluar dan kategori), tanpa mengirim data ke backend.
4. Backup lokal berupa JSON berversi; pemulihan divalidasi dan atomik.
5. Transaksi dapat diedit; login awal wajib dan sesi harus mendukung penggunaan offline setelah login pertama.
6. `EXPO_PUBLIC_DEV_SKIP_LOGIN` default mati dan hanya diperbolehkan saat `__DEV__`; tidak pernah menjadi mekanisme auth produksi.
7. Firebase config tidak ditemukan di project mobile dan tidak akan direka. Integrasi memakai env `EXPO_PUBLIC_*` yang harus diisi Founder.
8. `google-services.json` tidak tersedia di root. Dibutuhkan hanya untuk native analytics/EAS sebagaimana plan.
9. Skema dashboard yang tersedia mendefinisikan koleksi `users`, `access`, `feedback`, `accessCampaigns`, dan `config`, tetapi menyatakan callable personalisasi notifikasi sebagai target; jangan mengasumsikan callable itu sudah terdeploy.
10. Provider AI mengikuti BYOK: Gemini, OpenRouter, atau custom; rahasia hanya disimpan di SecureStore dan dikirim langsung ke provider.
11. Karena Expo Go tidak memuat Firebase Analytics native, analytics dibuat no-op aman dalam Expo Go.
