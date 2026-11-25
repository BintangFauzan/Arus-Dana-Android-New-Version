# Laporan Hasil Sesi — Arus Dana Mobile

**Tanggal laporan:** 24 November 2026  
**Status keseluruhan:** fondasi aplikasi dan sejumlah fitur sudah dibuat, tetapi pekerjaan **belum selesai 100% dan belum siap diklaim siap rilis**.  
**Tujuan laporan:** merangkum dengan bahasa sederhana apa yang sudah dikerjakan, pemeriksaan yang berhasil, keterbatasan, serta langkah yang masih dibutuhkan.

## Ringkasan singkat

Pada sesi ini folder yang semula hanya berisi dokumen PRD dan rencana kerja dikembangkan menjadi proyek aplikasi Expo/React Native berbahasa JavaScript. Fondasi ledger SQLite, alur beberapa layar, login Firebase/Google, BYOK AI, backup/ekspor, serta sejumlah dokumentasi dan tes telah disiapkan.

Pemeriksaan otomatis terakhir yang berhasil:

- `npm run lint` — lulus.
- `npm test` — 7 tes lulus.
- `npx expo-doctor` — 20/20 pemeriksaan lulus.
- `npx expo install --check` — dependensi cocok dengan Expo yang terpasang.
- `npx expo export --platform android` — bundel Android berhasil dibuat.

Hasil ini membuktikan kode dapat melewati pemeriksaan tersebut dan Metro dapat membundel proyek Android. Ini **tidak** membuktikan login OAuth, semua layar, perilaku offline, Firestore yang terdeploy, perangkat Android, atau rilis EAS sudah berhasil diuji.

## Yang sudah dikerjakan

### 1. Proyek dan aturan implementasi

- Membuat proyek Expo dengan JavaScript, bukan TypeScript.
- Mengatur nama aplikasi, deep-link scheme, dan Android package `com.bintangfauzandyan.arusdana`.
- Menyiapkan konfigurasi EAS dan Expo.
- Menambahkan `.env.example` untuk menunjukkan konfigurasi publik Firebase, Google OAuth, Functions URL, serta opsi proyek.
- Menambahkan `.gitignore`, ESLint, Jest, dan konfigurasi pengujian.
- Menulis `DECISIONS.md` untuk merekam pilihan desain dan asumsi.
- Menulis `FOUNDER_SETUP.md` berisi langkah konfigurasi dan pemeriksaan yang perlu dilakukan Founder.
- Dashboard, Cloud Functions, dan Firestore Rules pada proyek dashboard tetap diperlakukan sebagai sumber baca-saja; tidak dilakukan perubahan pada proyek tersebut.

### 2. Data anggaran lokal

- Menyiapkan SQLite melalui `expo-sqlite` untuk menyimpan amplop, transaksi, dan transfer.
- Memisahkan file basis data dengan UID, agar data antar-akun tidak memakai file ledger yang sama.
- Nominal dimodelkan sebagai bilangan bulat rupiah.
- Menambahkan perhitungan saldo/amplop dan ringkasan.
- Menambahkan dukungan pemasukan, pengeluaran, edit/hapus transaksi, pencarian riwayat, transfer antar-amplop, dan ringkasan bulanan dasar.
- Menghapus amplop melalui operasi lokal yang juga membersihkan transaksi serta transfer terkait.
- Ledger tidak dirancang untuk disimpan ke Firestore Arus Dana.

### 3. Layar dan penggunaan aplikasi

- Membuat alur onboarding, login, setup awal, dashboard, amplop, transaksi, riwayat, AI Capture, ringkasan bulanan, akses AI, dan profil/pengaturan dalam `App.js`.
- Menyimpan status bahwa onboarding telah selesai di AsyncStorage.
- Menyediakan pemakaian ledger lokal setelah autentikasi awal, sejauh yang dapat diverifikasi lewat kode.
- Antarmuka masih berupa implementasi MVP dan dirender terutama dari satu file `App.js`; belum menjadi aplikasi yang telah divalidasi usability-nya pada perangkat.

### 4. Firebase dan akses

- Menyiapkan Firebase Web SDK untuk Auth dan Firestore, dengan nilai konfigurasi yang dibaca dari environment.
- Menyiapkan login Google melalui Expo Auth Session dan kredensial Firebase.
- Membaca dokumen `access/{uid}` dan kebijakan akses default; status yang tidak tersedia/tidak sah diperlakukan terkunci untuk AI, bukan otomatis dianggap unlimited.
- Menyiapkan pemanggilan HTTP Cloud Functions dengan token Firebase dan timeout.
- Menyiapkan alur akses AI/trial melalui endpoint yang disebut dalam kontrak dashboard, jika URL dan deployment-nya tersedia.
- Tidak membuat Firebase project baru dan tidak mengisi konfigurasi dengan nilai karangan.

**Penting:** Firebase client config, Google OAuth client ID, URL Functions, dan `google-services.json` belum tersedia pada folder kerja. Karena itu, autentikasi dan panggilan backend belum dapat dibuktikan berfungsi terhadap project Founder.

### 5. AI BYOK

- Menyiapkan integrasi BYOK untuk Gemini, OpenRouter, serta endpoint custom berformat kompatibel OpenAI Chat Completions.
- Menyimpan API key di SecureStore; pilihan provider dan URL custom disimpan pada penyimpanan lokal.
- Menyiapkan kompresi foto sebelum pengiriman langsung ke provider pilihan pengguna.
- Menyediakan konteks chat yang mengambil ringkasan transaksi lokal terbaru.
- Menambahkan timeout dan validasi respons dasar.
- Foto/pertanyaan tidak dirutekan melalui backend Arus Dana berdasarkan rancangan saat ini.

### 6. Ekspor, backup, dan privasi

- Menyiapkan ekspor transaksi CSV.
- Menyiapkan backup JSON dengan versi skema, validasi, dan pemulihan di dalam transaksi SQLite.
- Menggunakan pemilih dokumen dan dialog share sistem.
- Menulis audit privasi statis dan catatan analytics non-keuangan.
- Analytics dibuat aman/tidak aktif di Expo Go untuk bagian yang memerlukan modul native; parameter yang diizinkan tidak mencakup data finansial.

### 7. Dokumentasi dan tes

File dokumentasi yang telah dibuat:

- `README.md` — cara menyiapkan dan menjalankan proyek serta batasan yang diketahui.
- `DECISIONS.md` — keputusan implementasi dan asumsi.
- `FOUNDER_SETUP.md` — tindakan konfigurasi dan uji Founder.
- `docs/schema-mapping.md` — pemetaan kebutuhan mobile terhadap kontrak dashboard.
- `docs/schema-gaps.md` — hal backend yang belum terverifikasi atau belum lengkap.
- `docs/audit-privasi.md` — audit privasi statis pra-rilis.
- `docs/audit-js.md` — catatan batas JavaScript-only.
- `docs/analytics-events.md` — daftar event analytics yang diizinkan.
- `__tests__/core.test.js` — tes helper perhitungan, akses/tanggal, CSV, backup, dan cooldown prompt.

Laporan sesi ini sendiri disimpan sebagai `LAPORAN_HASIL_SESI.md`.

## Yang belum selesai atau belum terverifikasi

### A. Login dan konfigurasi Firebase — perlu tindakan Founder

1. Isi nilai Firebase client config di `.env` berdasarkan Firebase project yang sudah ada.
2. Isi Google Web OAuth client ID dan pastikan provider Google aktif.
3. Daftarkan package Android yang tepat dan signing SHA-1 yang dipakai EAS pada Firebase/Google.
4. Uji login dan pemulihan sesi pada Expo Go dan APK EAS.
5. Periksa alur OAuth Android secara khusus. Pemeriksaan lokal tidak menguji pertukaran redirect/token pada perangkat nyata; status login Google belum boleh dianggap siap produksi.
6. Sediakan URL Cloud Functions yang benar dan uji token, respons, error, serta timeout terhadap deployment yang sesuai.

### B. Backend dan kebijakan akses

- Kode dashboard lokal dan `BACKEND_SCHEMA.md` bukan bukti bahwa fungsi/Rules yang sama telah terdeploy.
- Deployment serta perilaku `startTrialOnFirstAiAccess`, status akses, expired trial, dan kampanye harus diuji oleh pemilik backend.
- Dokumen gap mencatat bahwa rekonsiliasi expiry/campaign perlu divalidasi terhadap QA dan deployment nyata.
- Pemberitahuan dalam aplikasi belum diintegrasikan penuh; endpoint dan perilakunya perlu dikonfirmasi.
- Prompt feedback berkala membutuhkan konfigurasi dan perilaku server yang cocok. Walaupun ada bagian implementasi klien, jangan menganggap konfigurasi ini aktif atau kontraknya sudah tervalidasi pada deployment.
- Dashboard, Functions, dan Rules tidak diubah; perubahan backend apa pun memerlukan proses terpisah serta tinjauan Founder.

### C. Uji fitur di perangkat dan uji menyeluruh

Belum ada bukti uji manual menyeluruh di perangkat Android. Perlu menguji, setidaknya:

- Onboarding, login, logout, dan sesi yang dipulihkan.
- Buat/edit/hapus transaksi, nominal rupiah, tanggal, pemasukan/pengeluaran, dan saldo.
- Buat/hapus amplop dan transfer; memastikan perhitungan saldo benar.
- Pakai data lokal setelah login pertama ketika offline dan perilaku ketika jaringan kembali.
- Foto kamera/galeri, penolakan izin, kompresi, error provider, jawaban AI, key salah, dan endpoint custom.
- Ekspor CSV dan backup/restore JSON, termasuk berkas rusak dan backup besar.
- Tampilan, keyboard, aksesibilitas, dan navigasi pada ukuran layar Android yang didukung.
- Update EAS, permission Android, dan opsi backup perangkat.

Tes otomatis yang tersedia masih kecil: tujuh tes unit helper bukan pengujian penuh seluruh fitur, database perangkat, autentikasi, UI, dan backend.

### D. Build/release dan dependensi

- Belum dilakukan build APK EAS dan pemasangan/pengujian hasil build.
- `EAS_PROJECT_ID` belum dikonfigurasi; credentials dan channel rilis perlu disiapkan Founder.
- `google-services.json` tidak tersedia. Native Firebase Analytics dan konfigurasi native perlu dinilai kembali untuk kebutuhan build.
- `npm audit --omit=dev` pada pemeriksaan sesi menemukan 9 advisori pada pohon dependensi runtime (6 high, 3 moderate; 0 critical). Audit perlu ditinjau berdasarkan paket terdampak dan diperbarui dengan versi yang tetap kompatibel. Jangan melakukan upgrade besar secara membabi buta.
- Perlu meninjau ukuran bundle, izin final, privasi/data disclosure toko aplikasi, dan persyaratan rilis.

### E. Penyelesaian produk dan arsitektur

- Implementasi layar masih terkonsentrasi di `App.js`; komponen, navigasi, dan state sebaiknya dipisahkan/dirapikan sebelum perluasan produk.
- Kesesuaian setiap detail seluruh PRD dan plan belum ditandai satu per satu melalui uji penerimaan.
- Belum ada validasi pengguna/desain atau pengukuran performa pada perangkat nyata.
- Laporan keamanan yang tersedia adalah tinjauan statis, bukan penetration test atau jaminan keamanan.

## Batasan pemeriksaan yang sudah dilakukan

| Pemeriksaan | Hasil | Makna |
|---|---|---|
| ESLint | Lulus | Tidak ditemukan masalah lint yang terkonfigurasi saat pemeriksaan terakhir. |
| Jest | 7 tes lulus | Helper yang dites berjalan; bukan bukti semua alur aplikasi benar. |
| Expo Doctor | 20/20 | Pemeriksaan konfigurasi/ekosistem Expo lulus. |
| Expo install check | Lulus | Versi dependensi sesuai rekomendasi Expo saat pemeriksaan. |
| Ekspor Android | Berhasil | Metro membuat bundle; bukan APK dan bukan uji perangkat. |
| Uji login/backend | Belum dilakukan | Konfigurasi/deployment belum tersedia dan hasil perlu diuji terpisah. |
| EAS APK | Belum dilakukan | Project ID, kredensial dan pengujian Founder masih diperlukan. |

## Langkah berikut yang disarankan

1. Founder melengkapi konfigurasi Firebase, OAuth, Functions URL, dan EAS project ID melalui jalur aman; jangan memasukkan service account key ke aplikasi.
2. Jalankan login dan alur backend di lingkungan staging yang benar.
3. Perbaiki/validasi OAuth Android serta uji alur autentikasi pada Expo Go dan APK preview.
4. Jalankan uji penerimaan tiap fitur ledger, AI, backup/restore, offline, dan izin perangkat.
5. Tinjau 9 advisori npm audit dan lakukan pembaruan terukur, lalu ulangi seluruh pemeriksaan.
6. Buat APK preview EAS, uji pada perangkat fisik, perbaiki temuan, kemudian baru pertimbangkan build production.
7. Tutup semua butir PRD/plan dengan bukti uji sebelum menyatakan proyek selesai 100%.

## Kesimpulan

Sesi ini menghasilkan fondasi aplikasi, beberapa implementasi fitur, dokumentasi, dan pemeriksaan otomatis lokal yang lulus. Namun integrasi konfigurasi/deployment, verifikasi OAuth Android, uji perangkat, audit dependensi, penerimaan lengkap PRD, dan build EAS belum selesai. Oleh karena itu status yang akurat adalah **prototipe/fondasi MVP dalam pengembangan**, bukan produk yang telah selesai 100% atau siap rilis.

## Catatan kelalaian: referensi desain resmi belum diperiksa

Saya tidak membuka atau membandingkan aplikasi dengan file desain resmi yang disebut pada Bagian 4.2 PRD:

- `D:\Belajar\AI Agent Scrach\Open Maus Bot\Brand Group\Designer\Arus Dana Design Export\arus-dana-design.figcraft`
- `D:\Belajar\AI Agent Scrach\Open Maus Bot\Brand Group\Designer\Arus Dana Design Export\arus-dana-design.pdf` (referensi 14 layar; layar Login belum termasuk)
- `D:\Belajar\AI Agent Scrach\Open Maus Bot\Brand Group\Designer\Arus Dana Design Export\arus-dana-design-tokens.md`

Saya hanya membaca token yang dicantumkan langsung di PRD dan menggunakan sebagian token tersebut saat membuat antarmuka. Saya tetap membangun layar tanpa terlebih dahulu memeriksa apakah file-file referensi di atas dapat diakses dan tanpa membandingkan hasilnya dengan desain resmi. Akibatnya, tampilan layar yang dibuat merupakan rancangan MVP saya sendiri berdasarkan pemahaman terbatas atas PRD; **kesesuaian visual dengan desain resmi belum diketahui dan tidak boleh dianggap sudah tercapai**.

Ini adalah kelalaian proses saya. Seharusnya saya memeriksa semua referensi desain yang dirujuk PRD sebelum membuat UI, atau menyampaikan sejak awal bahwa referensi tersebut belum diperiksa. File desain tidak diubah. Sebelum pekerjaan desain dianggap sesuai PRD, referensi perlu dibuka/diperiksa, setiap layar dibandingkan, lalu UI aplikasi disesuaikan tanpa mengubah sumber desain kecuali diminta Founder.
