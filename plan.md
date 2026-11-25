Plan Eksekusi Otonom: Arus Dana Mobile App
Untuk agent (Copilot). Berlaku untuk PRD Arus Dana Mobile App v1.2. Dokumen ini menggantikan gerbang konfirmasi PRD 7.1: agent tidak perlu meminta izin membuat project atau bertanya sebelum mulai.
0. Prompt pembuka (tempel ke agent bersama PRD)
Baca PRD Arus Dana Mobile App v1.2 dan dokumen plan ini sampai selesai. Plan ini menggantikan PRD 7.1: kamu langsung bekerja dari Fase 0 sampai Fase 10 tanpa berhenti dan tanpa meminta konfirmasi. Jangan bertanya kepadaku kecuali (a) aplikasi sudah 100% selesai (Fase 10), atau (b) ada blocker absolut yang tidak bisa diatasi dengan placeholder atau asumsi. Setiap asumsi dicatat di DECISIONS.md. Semua larangan PRD tetap berlaku. Kode wajib JavaScript penuh, tanpa TypeScript. Pengembangan dan pengujian dijalankan di Expo Go (tidak ada development build lokal); build APK dilakukan Founder lewat EAS. Hanya pakai library yang berjalan di Expo Go, sesuai bagian Aturan Expo Go.
1. Konteks yang sudah pasti (jawaban Founder)
Hal
Nilai
Lokasi Web Dashboard dan Cloud Functions
D:\Belajar\React Native\Arus Dana Versi baru\Web Dashboard\Arus Dana Web Dashboard\arus-dana-web-dashboard (hanya dibaca, jangan diubah)
Package Android final
com.bintangfauzandyan.arusdana (sudah didaftarkan di Firebase; jangan diganti)
Alur OCR dan AI
Foto struk dikompres, lalu dikirim langsung ke model vision provider BYOK (Gemini, OpenRouter, atau custom). Tidak ada modul OCR native tambahan.
Firebase project
Sudah ada dan aktif, dipakai bersama Web Dashboard. Jangan buat project baru.
Midtrans
Ditunda. Jangan dikerjakan.
Akses default
unlimited. Trial dan kampanye tidak boleh diaktifkan.
Cara menjalankan dan build
Pengembangan dan pengujian memakai Expo Go (tidak ada development build lokal karena ruang disk terbatas). Build APK dilakukan Founder lewat EAS di cloud. Agent tidak menjalankan build.
Jika google-services.json ada di root project Mobile, pakai. Jika tidak ada, gunakan placeholder dan catat di FOUNDER_SETUP.md. Jangan mengarang nilai konfigurasi.
Aturan Expo Go (revisi)
Seluruh kode harus berjalan di Expo Go. Tidak ada development build lokal, Android Studio, atau emulator. Aturan ini mengesampingkan bagian lain yang menyebut development build atau modul native.
• Versi SDK: pakai Expo SDK yang didukung Expo Go terbaru di Play Store. Jangan memilih SDK yang belum didukung Expo Go.
• Library: hanya library yang kompatibel Expo Go pada SDK tersebut (cek dokumentasi). Jangan memakai @react-native-google-signin/google-signin atau @react-native-firebase/* di jalur utama. Satu-satunya pengecualian adalah analytics (lihat di bawah).
• Firebase: pakai paket JavaScript firebase (Auth dengan persistence AsyncStorage, dan Firestore). Config client Firebase (apiKey, projectId, dan sebagainya; nilainya publik) diambil dari project dashboard yang sudah ada dan disimpan di env EXPO_PUBLIC_*. Jangan mengarang nilai.
• Login Google: expo-auth-session (provider Google) dan expo-web-browser, lalu signInWithCredential ke Firebase Auth. Cek dokumentasi Expo terbaru untuk redirect yang didukung di Expo Go. Jangan membuat autentikasi palsu di jalur produksi.
• Jalur uji tanpa login (hanya bila login Google terbukti gagal di Expo Go): flag EXPO_PUBLIC_DEV_SKIP_LOGIN. Aktif hanya bila __DEV__ bernilai true dan flag bernilai true; memakai UID lokal dev-local; default mati; harus diabaikan di build EAS (diaudit di Fase 9). Catat di DECISIONS.md dan laporan akhir.
• Analytics: Firebase Analytics tidak tersedia di Expo Go. Bungkus dalam services/analytics.js yang no-op (cukup console.log saat __DEV__) bila modul native tidak ada. Untuk build EAS pakai @react-native-firebase/app dan @react-native-firebase/analytics dengan config plugin, dimuat lewat try/require supaya Expo Go tidak crash. Catat di DECISIONS.md.
• expo-updates dan allowBackup: dikonfigurasi di app.config.js untuk build EAS dan tidak aktif di Expo Go. Semua kode update dibungkus pengecekan Updates.isEnabled dan tidak boleh error di Expo Go.
• Tidak bisa diuji di Expo Go: login Google (bila gagal), analytics, EAS Update, allowBackup. Agent menulis kode sesuai dokumentasi, membuat unit test untuk logikanya, dan mencantumkan semuanya sebagai "Daftar uji di build EAS" di FOUNDER_SETUP.md.
• google-services.json: hanya diperlukan untuk build EAS (analytics native), bukan untuk Expo Go.
2. Kontrak eksekusi otonom
Agent bekerja tanpa berhenti dari Fase 0 sampai Fase 10. Menghubungi Founder hanya dalam dua kasus:
1.  Aplikasi sudah 100% selesai (laporan akhir Fase 10).
2.  Blocker absolut, misalnya folder dashboard tidak bisa dibaca sama sekali.
Larangan yang tetap berlaku (dari PRD):
• Tanpa TypeScript: tidak ada .ts, .tsx, tsconfig.json, typescript, @types/*, anotasi tipe, interface, type, enum.
• Tanpa Midtrans: jangan pasang midtrans-client, jangan minta credential, jangan buat UI pembayaran.
• Ledger keuangan tidak boleh masuk Firebase (Firestore maupun Analytics).
• Jangan mengubah Web Dashboard, Cloud Functions yang berjalan, Security Rules yang aktif, atau file .figcraft dan export PNG.
• Jangan mengaktifkan trial, kampanye tanggal, atau mengunci AI.
• Jangan mengunci fitur inti budgeting (amplop, transaksi, saldo, riwayat, export CSV) dalam kondisi apa pun.
• Jangan menambah package atau layanan di luar PRD tanpa alasan tertulis di DECISIONS.md.
• Jangan menulis ulang atau mengonversi kode dashboard walau memakai TypeScript.
Hal yang membutuhkan konsol Firebase, EAS, atau deploy ke backend yang berjalan: agent tidak mengeksekusinya. Agent menyiapkannya sebagai file atau langkah siap pakai di FOUNDER_SETUP.md.
Aturan menghadapi ketidakpastian: pilih opsi paling aman dan paling mudah dibalik, kerjakan, catat di DECISIONS.md (keputusan, alasan, dampak). Jangan berhenti untuk bertanya.
3. Keputusan default (PRD Bagian 9)
#
Keputusan
Default
1
Database ledger
expo-sqlite. Uang disimpan sebagai integer rupiah, tanpa float.
2
Package Android
com.bintangfauzandyan.arusdana
3
Review Bulanan (layar 13)
Masuk MVP versi ringan: total masuk/keluar bulan ini dan perbandingan kategori vs bulan lalu
4
Backup/Restore lokal
Masuk MVP. JSON berversi skema, divalidasi saat restore, tanpa enkripsi dulu
5
Edit transaksi
Masuk: nominal, kategori, amplop, keterangan, tanggal
6
Login dan offline
Sesi tersimpan. Fitur inti berjalan offline setelah login pertama. Data lokal dipisah per UID
7
Tombol "Jangan tampilkan lagi" di pop-up feedback
Ditambahkan, disimpan per UID
8
Provider AI dan OCR
Sesuai bagian 1 di atas
9
Pencarian UID di dashboard
Bukan tugas agent. Catat sebagai temuan di laporan akhir
10
Export layar Login
Tugas Founder. Agent membuat layar Login dari token desain dan deskripsi PRD
4. Fase kerja
Setiap fase punya kriteria selesai. Pindah ke fase berikutnya hanya setelah kriteria terpenuhi.
Fase 0: Pemahaman dan pemetaan backend
• Baca PRD secara menyeluruh.
• Baca dari folder dashboard: skema Firestore (koleksi, field, tipe), Firestore Security Rules, Cloud Functions, format kampanye, pemberitahuan, feedback, dan prompt settings.
• Hasilkan docs/schema-mapping.md: setiap kebutuhan di PRD 3.2 dipetakan ke koleksi, field, atau endpoint yang sudah ada.
• Jika ada kebutuhan yang belum tercakup, tulis usulan di docs/schema-gaps.md. Jangan ubah dashboard. Untuk gap, aplikasi memakai perilaku aman (misalnya anggap unlimited) dan gap dicatat.
• Selesai bila: semua kebutuhan PRD 3.2 punya pemetaan atau tercatat sebagai gap.
Fase 1: Fondasi dan semua dependency native (sekali saja)
Tujuan: APK pertama tidak perlu diganti karena lupa modul native.
• Buat project Expo dengan template blank JavaScript. Periksa hasilnya: bila ada TypeScript, hapus dan ganti, lalu catat.
• Pasang semua dependency sekarang (semuanya kompatibel Expo Go, kecuali yang disebut di Aturan Expo Go):
    ◦ expo-sqlite, expo-secure-store, AsyncStorage
    ◦ expo-updates
    ◦ kamera dan galeri, kompres gambar
    ◦ file system, sharing, document picker
    ◦ expo-auth-session, expo-web-browser, expo-crypto (login Google)
    ◦ paket firebase versi JavaScript (Auth dan Firestore); Analytics lewat pembungkus (lihat Aturan Expo Go)
• Aplikasi dijalankan di Expo Go (npx expo start), tanpa development build lokal.
• app.config.js: android.package = com.bintangfauzandyan.arusdana, allowBackup=false, konfigurasi updates, runtimeVersion, permission yang dibutuhkan (kamera, penyimpanan) sekarang.
• eas.json: channel production dan preview.
• Nilai konfigurasi (google-services.json, EAS project ID, web client ID) dibaca dari env atau file placeholder.
• Struktur folder sederhana: screens, components, db, services, utils. Tulis README singkat yang menjelaskan strukturnya.
• Pasang design token PRD 4.1 sebagai satu file tema.
• Selesai bila: project terbuka di Expo Go dengan placeholder, lint bersih, tidak ada file TypeScript.
Fase 2: Lapisan data lokal
• Migrasi SQLite berversi skema. File database dipisah per UID.
• Repository untuk amplop, transaksi, dan transfer antar-amplop.
• Unit test (Jest) untuk perhitungan saldo, delta bulanan, dan transfer.
• Selesai bila: test lolos dan tidak ada float untuk uang.
Fase 3: Auth dan sesi
• Login Google lewat expo-auth-session dan Firebase JS SDK (lihat Aturan Expo Go), sesi persisten (AsyncStorage), logout tanpa menghapus ledger.
• Pesan jelas bila login pertama dilakukan saat offline.
• Ganti akun membuka data lokal akun tersebut.
• Layar 1 (Splash), 2-4 (Onboarding), 5 (Login).
• Peringatan risiko kehilangan data di onboarding dan Settings (uninstall atau ganti HP menghapus ledger; arahkan ke Export CSV dan Backup).
• Selesai bila: alur splash, onboarding, login, setup berjalan lengkap, dan aplikasi tetap terbuka offline setelah login.
Fase 4: Ledger UI
• Layar 6 (Setup Amplop), 8 (Home), 9 (Envelope), 10 (Transaksi Manual), 12 (Riwayat).
• Edit dan hapus transaksi. State Empty, Loading, Error. Tab bar 4 tab.
• Selesai bila: pencatatan transaksi bisa dilakukan kurang dari 10 detik dan semua state tampil benar.
Fase 5: Akses, pop-up, feedback, analitik, update
• Logika status akses sebagai fungsi murni dengan komentar bahasa Indonesia, mengikuti hasil otoritatif backend:
    ◦ waktu server dan zona Asia/Jakarta
    ◦ tanggal akhir inklusif, end_at_exclusive pukul 00.00 WIB hari berikutnya
    ◦ prioritas: active > override UID > kampanye global > default unlimited
    ◦ setelah kampanye berakhir, terapkan post_expiry_status; jangan kembali ke unlimited otomatis
• Unit test: batas tanggal, tanggal tidak valid (misal 31 November), override UID, kampanye tumpang tindih, active tidak dicabut.
• Cache akses hanya untuk tampilan. Tidak boleh memperpanjang akses. Jam perangkat tidak dipercaya.
• Pop-up akses (aktif, akan berakhir bila diaktifkan, berakhir): hanya untuk target yang sesuai, ditandai sudah dibaca, tampil setelah status terbaru berhasil diambil. Ini modal in-app, bukan push notification.
• Pop-up feedback: delay awal 2 hari, interval 2 hari, cooldown setelah kirim/lewati/tutup, hanya di momen aman (tidak saat input transaksi atau proses AI), tombol "Jangan tampilkan lagi". Pengaturan mengikuti backend.
• Menu Feedback di Settings, tersedia kapan saja. Feedback dikirim hanya dengan tindakan sadar pengguna.
• Layar 14 (Akses AI): hanya kondisi Unlimited, Date-limited Free, Trial, Locked. Tanpa UI pembayaran. Tampilkan tanggal akhir dengan zona waktu jelas.
• Analitik lewat pembungkus services/analytics.js (no-op di Expo Go): buat daftar event tertulis di docs/analytics-events.md. Tidak ada nominal, saldo, deskripsi, kategori, foto struk, atau isi transaksi.
• EAS Update (aktif hanya di build EAS; di Expo Go kode update dibungkus pengecekan Updates.isEnabled dan tidak boleh error): cek saat startup di waktu aman, unduh di latar belakang, notifikasi update siap, "Perbarui sekarang", "Periksa pembaruan" di Settings, tampilkan versi dan status update.
• Selesai bila: test logika lolos dan tidak ada event analitik yang membawa data keuangan.
Fase 6: AI (BYOK)
• Layar 7 (Setup AI Key, SecureStore dengan dropdown provider), 11 (AI Capture).
• Alur Capture: kompres foto, kirim ke provider pilihan, parse, konfirmasi kategori dan amplop, simpan ke ledger lokal.
• AI Chat: data saldo dan transaksi 30 hari terakhir, dikirim hanya ke provider pilihan pengguna, tidak lewat backend Arus Dana.
• Gerbang akses AI: saat status inactive, tampilkan layar terkunci. Fitur inti tetap berjalan.
• Penanganan error: key salah, offline, respons tidak valid, timeout. Validasi respons AI secara eksplisit di runtime (tanpa library validasi baru).
• Selesai bila: alur berjalan dengan mock provider dan semua jalur error ditangani.
Fase 7: Export dan Backup
• Export CSV tanpa server.
• Backup JSON berversi skema ke file di perangkat.
• Restore dengan validasi: tolak file rusak atau versi tidak dikenal, jangan merusak data yang sudah ada (restore atomik dalam satu transaksi).
• Selesai bila: backup lalu restore menghasilkan data identik (diuji otomatis).
Fase 8: Review Bulanan dan Settings
• Layar 13 versi ringan.
• Layar 15 lengkap: Profil, Feedback, AI Key, Backup/Restore, Export CSV, Pembaruan Aplikasi, Tentang.
• Selesai bila: ke-15 layar ada dan terhubung dalam navigasi.
Fase 9: Pengerasan dan audit
• Jalankan semua test dan lint.
• Audit privasi: telusuri seluruh kode, pastikan tidak ada ledger yang masuk Firestore atau Analytics. Simpan hasil di docs/audit-privasi.md.
• Audit JavaScript-only: tidak ada .ts, .tsx, tsconfig.json, typescript, atau @types/*. Simpan hasil di docs/audit-js.md.
• Tinjau Security Rules yang ada terhadap akses pengguna biasa. Tulis draf perbaikan di firebase/rules.proposed (hanya bila ada celah) beserta penjelasan dampaknya ke dashboard, dan uji dengan emulator bila tersedia. Jangan deploy.
• Pastikan konfigurasi native lengkap supaya APK pertama tidak perlu dibuat ulang. Karena native tidak teruji di Expo Go, periksa ulang config plugin, permission, dan app.config.js terhadap dokumentasi, dan audit bahwa EXPO_PUBLIC_DEV_SKIP_LOGIN tidak berlaku di build EAS.
• Jalankan expo-doctor dan pemeriksaan config tanpa error.
• Selesai bila: semua pemeriksaan hijau atau temuan tercatat jelas.
Fase 10: Serah terima
• Buat FOUNDER_SETUP.md (bagian 5) dan DECISIONS.md.
• Kirim laporan akhir (bagian 6). Ini satu-satunya pesan konfirmasi kepada Founder.
5. Isi FOUNDER_SETUP.md (hanya yang tidak bisa dikerjakan agent)
Agent menulis langkah berurutan, siap salin, dengan perintah lengkap:
1.  Login ke EAS, jalankan eas init, isi project ID ke konfigurasi.
2.  Siapkan EAS signing credentials untuk mendapatkan SHA-1.
3.  Letakkan google-services.json dari Firebase (aplikasi com.bintangfauzandyan.arusdana sudah terdaftar) ke lokasi yang ditentukan agent.
4.  Tambahkan SHA-1 ke aplikasi Android di Firebase, aktifkan Google Sign-In, dan salin web client ID ke konfigurasi.
5.  Tinjau firebase/rules.proposed (bila ada), lalu deploy sendiri. Perubahan ini memengaruhi dashboard yang berjalan.
6.  Jalankan eas build profil preview dulu (APK uji), lalu uji di HP semua yang tidak bisa dites di Expo Go: login Google (bila belum jalan di Expo Go), analytics, EAS Update, dan allowBackup. Setelah lolos, build profil production.
7.  Opsional: lengkapi export layar Login dari file desain.
6. Definisi "100% selesai" dan laporan akhir
Agent mengirim laporan hanya jika semua ini benar:
• Seluruh 15 layar ada dan terhubung.
• Semua test lolos.
• Audit privasi dan audit JavaScript-only bersih.
• Tidak ada pekerjaan tersisa selain daftar di FOUNDER_SETUP.md.
Isi laporan akhir (bahasa sederhana, sebutkan kode tetap JavaScript):
• ringkasan hasil per fase
• asumsi di DECISIONS.md
• daftar package yang dipasang beserta alasannya
• temuan atau gap backend, termasuk catatan pencarian UID di dashboard
• batasan yang diketahui
• tautan ke FOUNDER_SETUP.md
7. Aturan kerja umum
• Kode mudah dibaca pemula: nama jelas, fungsi dan komponen kecil, komentar singkat bahasa Indonesia pada aturan akses, perhitungan waktu Asia/Jakarta, dan logika cooldown.
• Terjemahkan contoh TypeScript dari dokumentasi ke JavaScript.
• Jika sebuah library mensyaratkan TypeScript, jangan beralih. Pilih alternatif dan catat di DECISIONS.md.
• Cek dokumentasi sesuai versi Expo SDK dan Firebase SDK yang benar-benar dipakai.
• Commit per fase dengan pesan jelas agar mudah dilacak.
