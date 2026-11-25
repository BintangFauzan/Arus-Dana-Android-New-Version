# Product Requirements Document — Arus Dana Mobile App

**Project ID:** PRJ-001  
**Jenis Dokumen:** PRD Mobile App  
**Versi PRD:** 1.2 (revisi dari v1.0; menyesuaikan status proyek per 24 November 2026 dan menambahkan kewajiban JavaScript)  
**Tanggal:** 24 November 2026  
**Master Brief Versi:** 10  
**Product Brief Versi:** 6  
**Dokumen pasangan:** PRD Arus Dana Web Dashboard v1.0 (sudah diimplementasikan dan berjalan)  

---

## 0. Status Proyek dan Ringkasan Perubahan v1.1

### 0.1 Status saat ini (24 November 2026)

| Komponen | Status |
|---|---|
| Web Dashboard Founder | **Sudah berjalan** di Firebase. |
| Firebase project (Auth, Firestore, Cloud Functions, Security Rules) | **Sudah dibuat dan aktif**, dipakai bersama Web Dashboard. Tidak ada project backend ketiga. |
| Mobile App | **Belum dikerjakan.** Ini fokus dokumen ini. |
| Midtrans | **Ditunda.** Akan dikerjakan setelah Mobile App selesai. Bukan prasyarat apa pun. |
| Pengaturan akses | Default tetap `unlimited`. Trial dan kampanye tanggal tidak aktif sampai Founder mengaktifkannya dari dashboard. |

### 0.2 Perubahan dari v1.0

1. Status Firebase, Web Dashboard, dan Midtrans diperbarui (Bagian 0, 2.4, 3.1, 7.1–7.3). Copilot tidak perlu lagi menanyakan apakah Firebase sudah ada atau apakah Midtrans mau dikerjakan sekarang.
2. Kontrak backend (3.2) kini mengacu ke **skema Firestore yang benar-benar dipakai Web Dashboard**, bukan asumsi baru. Copilot wajib membaca skema tersebut terlebih dahulu.
3. Hitungan layar dan status export desain diseragamkan (4.2).
4. Keputusan terbuka dipindahkan ke tabel tersendiri (Bagian 9) dengan status dan rekomendasi: penyimpanan ledger, Review Bulanan, Backup/Restore lokal, edit transaksi, login offline.
5. Ditambahkan persyaratan perilaku offline setelah login dan peringatan risiko kehilangan data (3.5, 6).
6. **(v1.2)** Ditambahkan kewajiban bahasa pemrograman: seluruh kode Mobile App ditulis dengan **JavaScript penuh, tanpa TypeScript** (3, 7.8).

> Butir yang ditandai **[Usulan]** adalah rekomendasi yang belum disetujui Founder. Copilot tidak boleh menganggapnya sebagai keputusan final sebelum dikonfirmasi.

---

## 1. Ringkasan Eksekutif

**Arus Dana Mobile App** adalah aplikasi Android mobile-first berbasis *envelope budgeting* untuk pekerja muda dan fresh graduate Indonesia (Gen Z, 19–28 tahun). Masalah inti yang ingin diselesaikan adalah pencatatan manual yang merepotkan, transaksi kecil yang sering terlupakan, dan keengganan target pengguna untuk berlangganan aplikasi budgeting.

**Solusi:** aplikasi *offline-first* yang memisahkan dana ke dalam "Amplop" (Makan, Darurat, Tabungan, dan lain-lain) serta memungkinkan pencatatan transaksi dalam waktu kurang dari 10 detik. Pengguna wajib login Google melalui Firebase Auth, tetapi seluruh ledger keuangan tetap tersimpan lokal di perangkat. Login digunakan untuk identitas akun, kontrol akses, analitik produk non-keuangan, serta feedback, bukan untuk menyinkronkan data keuangan.

Selama **Early Access**, semua fitur termasuk AI Capture dan AI Chat berbasis BYOK (*Bring Your Own Key*) terbuka tanpa batas waktu secara default. Tidak ada timer trial atau tanggal kedaluwarsa otomatis. Founder dapat mengaktifkan kebijakan trial berdurasi custom atau akses gratis berbatas tanggal dari Web Dashboard. Akses berbatas tanggal dapat ditujukan ke seluruh pengguna atau UID tertentu. Jika periode akses AI berakhir, fitur inti budgeting tetap gratis. Midtrans bersifat opsional, ditunda, dan tidak menjadi prasyarat peluncuran MVP gratis.

**Stack Mobile:** React Native / Expo dengan **JavaScript penuh (bukan TypeScript)**, Android APK melalui EAS, ledger lokal menggunakan expo-sqlite atau Realm (lihat Bagian 9), preferensi di AsyncStorage, AI key di SecureStore, dan `allowBackup=false`. Firebase Auth, Firestore, dan Cloud Functions menjadi backend wajib bersama Web Dashboard (sudah berjalan). Pembaruan aplikasi menggunakan EAS Update (`expo-updates`) untuk JavaScript dan aset yang kompatibel; perubahan native tetap memerlukan APK baru.

**Batas data utama:** backend Arus Dana hanya menyimpan identitas pengguna minimum, status akses, metadata kampanye dan pemberitahuan, metadata prompt feedback, feedback yang dikirim secara sadar, serta event analitik non-keuangan. Backend tidak menerima atau menyimpan ledger keuangan lokal.

---

## 2. Tujuan Produk dan Cakupan

### 2.1 Tujuan MVP

1. Membantu pengguna mengelola anggaran melalui sistem amplop digital.
2. Membuat pencatatan transaksi manual cepat dan sederhana.
3. Menyediakan AI Capture dan AI Chat opsional dengan BYOK tanpa membebankan biaya token kepada developer.
4. Mengetahui jumlah dan pola penggunaan produk melalui identitas akun serta analitik non-keuangan.
5. Mengumpulkan feedback pengguna secara sadar untuk menentukan prioritas pengembangan.
6. Memungkinkan Founder mengatur akses AI dari Web Dashboard tanpa merilis ulang aplikasi untuk perubahan kebijakan akses.
7. Memungkinkan pembaruan aplikasi melalui OTA untuk perubahan yang kompatibel, sehingga pengguna tidak perlu mengunduh APK baru setiap kali ada perubahan JavaScript atau aset.

### 2.2 Fitur MVP (Gratis, Offline-First)

| Fitur | Deskripsi |
|---|---|
| **Amplop (Envelope)** | CRUD amplop, alokasi budget, progress bar, dan transfer antar-amplop. |
| **Transaksi Manual** | Input nominal, keterangan, kategori, tanggal, dan jam; riwayat serta hapus transaksi. Edit transaksi: lihat Bagian 9. |
| **Saldo & Ringkasan** | Total saldo, delta dibanding bulan sebelumnya, dan sisa saldo per amplop. |
| **AI Capture (BYOK)** | Foto struk/teks → OCR → AI parse → konfirmasi kategori dan amplop → simpan ke ledger lokal. |
| **AI Chat (BYOK)** | Tanya jawab saldo dan transaksi 30 hari terakhir. Data yang diperlukan dikirim langsung ke provider AI pilihan pengguna sesuai alur BYOK, bukan disinkronkan ke backend Arus Dana. |
| **Data Lokal** | expo-sqlite/Realm untuk ledger transaksi; AsyncStorage untuk preferensi; SecureStore untuk AI key. |
| **Export CSV** | Ekspor data kapan saja tanpa server. |
| **Backup/Restore Lokal** | Cadangan dan pemulihan data melalui file di perangkat pengguna, tanpa cloud. **[Usulan: masuk MVP]**, lihat Bagian 9. |
| **Login & Identitas Pengguna** | Google OAuth melalui Firebase Auth. Login wajib sebelum pengguna memakai aplikasi. Backend menyimpan identitas akun minimum untuk mengenali pengguna dan mengelola akses. |
| **Feedback Pengguna** | Pengguna dapat mengirim penilaian, kendala, dan saran. Feedback dikirim dengan tindakan sadar pengguna, disimpan di Firestore, dan dikaitkan dengan Firebase UID. |
| **Analitik Penggunaan Produk** | Firebase Analytics untuk aktivasi, penggunaan fitur, dan retensi melalui event non-keuangan. Event tidak boleh berisi nominal, saldo, deskripsi, kategori, foto struk, atau isi transaksi. |
| **Kontrol Akses AI** | Default `unlimited`. Backend mendukung trial custom dan akses gratis berbatas tanggal untuk semua pengguna atau UID tertentu. |
| **Pop-up Pemberitahuan Akses** | In-app pop-up ketika akses AI dimulai, mendekati akhir (jika diaktifkan), atau berakhir. Bukan push notification OS. |
| **Pop-up Feedback Berkala** | Meminta penilaian/saran dengan interval yang dikendalikan Founder. Default awal paling sering sekali setiap 2 hari; pengguna dapat melewati atau menutupnya. |
| **Pembaruan Aplikasi** | Pemeriksaan dan pengunduhan EAS Update untuk JavaScript dan aset yang kompatibel. `expo-updates` wajib dipasang dan dikonfigurasi sebelum APK produksi pertama. |

### 2.3 Akses Fitur, Trial, Akses Berbatas Tanggal, dan Monetisasi

#### Kebijakan default Early Access

- Semua fitur inti dan AI terbuka tanpa batas waktu (`unlimited`).
- Tidak ada hitung mundur trial atau tanggal kedaluwarsa otomatis secara default.
- Backend tidak boleh memulai trial atau mengakhiri akses hanya karena pengguna login, memasang aplikasi, atau pertama kali menggunakan AI.
- Midtrans dan pembayaran dinonaktifkan secara default serta bukan syarat peluncuran MVP.

#### Pengaturan akses yang dikendalikan backend

- Founder dapat mengubah kebijakan akses (melalui Web Dashboard) tanpa menanam durasi tertentu secara permanen di aplikasi.
- Trial `free_tier` dapat diaktifkan dengan durasi custom, misalnya 7 hari, 14 hari, atau nilai lain yang ditentukan Founder. Durasi tidak boleh diasumsikan tetap 7 hari.
- Timer trial hanya dimulai setelah Founder mengaktifkan trial dan pengguna melakukan akses AI pertama sesuai kebijakan aktif. Waktu mulai dan berakhir ditetapkan server, bukan jam perangkat.
- Founder dapat membuat akses gratis berbatas tanggal (`date_limited_free`) dengan tanggal mulai dan akhir kalender. Akses berlaku sesuai rentang tanggal dan tidak menunggu first AI access.
- Target akses berbatas tanggal dapat berupa seluruh pengguna (`all_users`) atau satu/daftar pengguna tertentu (`selected_users`) berdasarkan Firebase UID.
- Tanggal mulai dan akhir bersifat inklusif berdasarkan zona waktu `Asia/Jakarta`. Backend mengubah tanggal akhir menjadi batas waktu eksklusif pukul 00.00 hari berikutnya. Contoh: 21–30 November 2026 aktif sampai akhir 30 November dan berakhir 1 Desember 2026 pukul 00.00 WIB. Tanggal tidak valid, misalnya 31 November, harus ditolak.
- Penentuan status menggunakan waktu server. Mengubah jam perangkat atau menghapus data aplikasi tidak boleh memperpanjang akses.
- Ketika kampanye `date_limited_free` berakhir, akses AI untuk target menjadi `inactive`, kecuali Founder telah menetapkan kebijakan/override lain. Jangan otomatis mengembalikan status ke `unlimited` hanya karena kampanye berakhir.
- Akses berbatas tanggal hanya memengaruhi fitur yang dikendalikan monetisasi (MVP: AI Capture dan AI Chat). Fitur inti budgeting (amplop, transaksi manual, saldo, riwayat, dan export CSV) tetap gratis.
- Akses berbayar terverifikasi (`active`) tidak boleh dicabut hanya karena kampanye gratis global berakhir. Perubahan manual akun berbayar memerlukan keputusan eksplisit Founder.
- Override khusus UID (`selected_users`) mengesampingkan kampanye global bagi UID tersebut. Backend harus mendeteksi konflik kampanye yang tumpang tindih dan tidak boleh memilih status secara acak.
- Copilot tidak boleh mengaktifkan trial, membuat kampanye tanggal, mengunci AI, atau mengubah kebijakan akses tanpa instruksi dan konfirmasi eksplisit Founder.

#### Status akses

| Status | Makna untuk aplikasi |
|---|---|
| `unlimited` | AI terbuka tanpa batas waktu; status default Early Access. |
| `date_limited_free` | AI gratis dalam rentang tanggal kalender yang ditetapkan Founder untuk semua pengguna atau UID tertentu. |
| `free_tier` | Pengguna berada dalam trial berbasis durasi yang secara eksplisit diaktifkan Founder; timer dimulai pada first AI access sesuai kebijakan. |
| `inactive` | Akses AI dibatasi karena masa akses/trial berakhir atau Founder menonaktifkannya. |
| `active` | Pengguna memiliki akses berbayar yang telah diverifikasi backend. |

#### Prioritas evaluasi status

1. `active` hasil pembayaran terverifikasi dipertahankan dan tidak otomatis dicabut oleh kampanye gratis yang berakhir.
2. Override khusus UID memiliki prioritas atas kampanye global bagi UID tersebut.
3. Kampanye global berlaku bagi UID yang tidak memiliki override individual lebih spesifik.
4. Saat akses berbatas tanggal berakhir, target masuk ke `inactive` sesuai `post_expiry_status`; Founder dapat menetapkan kebijakan baru untuk mengubahnya.
5. Jika tidak ada override, kampanye, atau trial yang berlaku, gunakan default backend (`unlimited` pada Early Access).

#### Konfigurasi backend awal (konseptual)

```json
{
  "default_access_mode": "unlimited",
  "trial_enabled": false,
  "trial_duration_days": null,
  "date_limited_access_enabled": false,
  "date_limited_access": {
    "target_scope": "all_users",
    "target_uids": [],
    "start_date": null,
    "end_date": null,
    "timezone": "Asia/Jakarta",
    "post_expiry_status": "inactive"
  },
  "payments_enabled": false,
  "payment_provider": null
}
```

Contoh di atas bersifat konseptual. **Nama koleksi dan field sebenarnya mengikuti implementasi Web Dashboard yang sudah berjalan** (lihat 3.2). Kampanye individual disimpan sebagai dokumen tersendiri agar beberapa kampanye dan target tidak saling menimpa.

### 2.4 Midtrans (Ditunda)

**Status: ditunda hingga Mobile App selesai.** Pertanyaan tentang Midtrans tidak perlu diajukan lagi selama pengerjaan Mobile App.

- Jangan memasang `midtrans-client`, jangan meminta credential Midtrans, dan jangan membuat alur pembayaran selama status ini berlaku.
- Pertahankan `payments_enabled: false` dan akses default `unlimited`.
- Layar Akses AI / Upgrade (layar 14) tidak menampilkan UI pembayaran. Hanya kondisi Unlimited / Date-limited Free / Trial / Locked yang diimplementasikan.
- Jangan menambahkan dependency atau perubahan native hanya untuk mempersiapkan Midtrans.

Rencana ketika Founder menyetujui di kemudian hari:

- Backend menggunakan Midtrans Snap melalui Firebase Cloud Functions.
- Metode yang disarankan adalah Snap Redirect melalui browser eksternal. Aplikasi menerima URL pembayaran dari backend lalu membukanya.
- `midtrans-client` hanya dipasang di Cloud Functions/Node.js. Tidak diperlukan SDK Midtrans di aplikasi Expo, dan jangan memasang `react-native-webview` hanya untuk pembayaran.
- Webhook Midtrans harus diverifikasi di backend. Aplikasi tidak boleh mengaktifkan akses berdasarkan redirect atau klaim sukses dari client.
- Server Key dan secret disimpan sebagai secret backend (misalnya Firebase Secret Manager), bukan di APK, kode client, atau repository publik.
- Karena EAS Update sudah disiapkan sejak APK pertama dan Snap Redirect tidak memerlukan modul native, integrasi pembayaran kelak diperkirakan **tidak** membutuhkan APK baru. Hal ini tetap perlu diverifikasi saat itu.

### 2.5 Pasca-MVP

- **Predictor:** proyeksi laju pengeluaran harian, peringatan saldo tidak cukup, perbandingan kategori dibanding bulan sebelumnya.
- **Planner:** rekomendasi alokasi berbasis pola pengeluaran.
- **Integrasi Midtrans** dan akses berbayar `active`.

### 2.6 Di Luar Cakupan MVP

- Filter riwayat lanjutan, laporan bulanan lengkap, pencatatan QRIS otomatis. (Edit transaksi dan layar Review Bulanan: lihat Bagian 9.)
- Cloud sync atau penyimpanan ledger keuangan di server, backup cloud, push notification, dan penggunaan multi-device.
- Integrasi Midtrans (ditunda, lihat 2.4).
- Perubahan native yang tidak dapat dikirim melalui EAS Update; perubahan tersebut ditangani melalui build APK baru ketika diperlukan.
- Web dashboard Founder (sudah selesai, PRD terpisah), website publik/landing page, dan portal pengguna umum.
- Proteksi anti-piracy di luar validasi akses berbasis akun dan feature flag.

---

## 3. Arsitektur dan Teknologi Mobile

| Lapisan | Keputusan | Catatan |
|---|---|---|
| Platform | Android (APK via EAS) | Target MVP. |
| Framework Mobile | React Native / Expo | Aplikasi pengguna; bukan React web. |
| Bahasa Pemrograman | **JavaScript (ES6+), bukan TypeScript** | Wajib. Founder tidak menggunakan TypeScript. Lihat 7.8. |
| Database Ledger | expo-sqlite atau Realm | Bukan AsyncStorage; seluruh ledger keuangan tetap lokal. Keputusan final: Bagian 9 (rekomendasi: expo-sqlite). |
| Preferensi | AsyncStorage | Preferensi non-keuangan. |
| AI Key Storage | SecureStore | Menyimpan key AI milik pengguna. |
| Backup Android | `allowBackup=false` | Mengurangi risiko backup Android yang tidak diinginkan; bukan pengganti enkripsi. Konsekuensinya: tanpa Backup/Restore lokal, data hilang saat uninstall/ganti HP. |
| AI Provider | BYOK (Gemini, OpenRouter, custom) | Biaya token ditanggung pengguna. |
| Backend Auth | Firebase Auth | **Sudah aktif.** Google OAuth wajib untuk menggunakan aplikasi. |
| Backend DB | Firestore | **Sudah aktif.** Identitas minimum, feedback, status akses per UID, kampanye, status pemberitahuan, konfigurasi trial/pembayaran, metadata prompt feedback; tidak menyimpan ledger. |
| Backend Functions | Cloud Functions (Node.js) | **Sudah aktif untuk kebutuhan dashboard.** Endpoint tambahan untuk Mobile ditambahkan hanya bila diperlukan dan disetujui. |
| Analytics | Firebase Analytics | Aktif sejak Early Access; hanya event non-keuangan. |
| OTA Updates | EAS Update (`expo-updates`) | Wajib dikonfigurasi sebelum APK produksi pertama. |
| Runtime Compatibility | `runtimeVersion` dan EAS Update channel | Update hanya untuk binary yang kompatibel. Pertimbangkan kebijakan runtime seperti `fingerprint` sesuai dukungan Expo SDK yang dipakai. |
| Payment | Midtrans Snap (ditunda) | Lihat 2.4. |

Backend Firebase yang digunakan Mobile App adalah backend yang **sama** dengan Web Dashboard. Tidak ada project backend ketiga. Dokumen Web Dashboard menjelaskan kebutuhan administrasi Founder; dokumen ini menjelaskan integrasi yang dibutuhkan aplikasi pengguna.

### 3.1 Konfigurasi Firebase untuk Android

**Status: Firebase project sudah ada dan aktif.** Copilot tidak perlu menanyakan apakah project sudah dibuat, dan tidak boleh membuat project Firebase baru.

Yang masih perlu dilakukan untuk sisi Android (diminta pada tahap yang tepat, bukan sekaligus di awal):

1. **Nama package Android final** (`android.package` / `applicationId`) harus diputuskan Founder terlebih dahulu. Nama ini harus cocok dengan aplikasi Android yang didaftarkan di Firebase.
2. **Mendaftarkan aplikasi Android** ke Firebase project yang sudah ada, lalu mengunduh `google-services.json` bila pendekatan integrasi memerlukannya.
3. **SHA-1 fingerprint** sertifikat penandatanganan Android untuk Google Sign-In. Fingerprint baru tersedia setelah signing credentials (EAS) disiapkan; jelaskan urutan ini kepada Founder dan minta pada tahap yang tepat.
4. **OAuth configuration** tambahan apabila dibutuhkan oleh metode Google Sign-In yang dipilih.

Aturan yang tetap berlaku:

- Jangan mengarang Firebase config. Gunakan hanya nilai yang diberikan Founder atau yang tersedia dari project.
- Konfigurasi Firebase client bukan pengganti Firestore Security Rules. Rules yang sudah ada untuk dashboard harus **ditinjau**, dan perlu dipastikan pengguna biasa (non-Founder) hanya dapat membaca/menulis dokumen miliknya sendiri. Perubahan Rules wajib diuji dan disetujui Founder karena memengaruhi dashboard yang sudah berjalan.
- Jangan meminta private key service account untuk ditanam di aplikasi atau source code. Kredensial administratif ditangani melalui mekanisme aman di lingkungan backend/deployment.

### 3.2 Kontrak Backend yang Digunakan Aplikasi

Aplikasi berkomunikasi dengan Firebase/backend untuk kebutuhan berikut:

- **Auth:** login Google dan Firebase UID.
- **Profile minimum:** status akun dan metadata minimum yang diperlukan operasional.
- **Access state:** status akses AI efektif, kebijakan yang berlaku, dan waktu akhir bila relevan.
- **In-app notices:** pemberitahuan akses yang ditujukan kepada pengguna serta status sudah dibaca/ditutup.
- **Feedback prompt settings:** status aktif, initial delay, interval, dan metadata waktu prompt per UID.
- **Feedback submission:** pengiriman feedback secara sadar, dikaitkan dengan Firebase UID.
- **Analytics:** event penggunaan non-keuangan.

**Sumber kebenaran skema = implementasi Web Dashboard yang sudah berjalan.** Karena dashboard sudah dibangun, Mobile App tidak boleh mendefinisikan koleksi, nama field, atau format dokumen sendiri. Sebelum menulis kode integrasi, Copilot wajib:

1. Meminta/membaca skema Firestore yang dipakai dashboard (nama koleksi, field, tipe data, format kampanye, format pemberitahuan, format feedback, dan prompt settings).
2. Meminta/membaca Firestore Security Rules dan Cloud Functions yang sudah dideploy.
3. Merangkum pemetaan "kebutuhan aplikasi → koleksi/field/endpoint yang sudah ada" dan meminta konfirmasi Founder.
4. Hanya jika ada kebutuhan yang belum tercakup, mengusulkan penambahan (field/endpoint) beserta dampaknya terhadap dashboard, dan menunggu persetujuan sebelum mengubah apa pun.

Aplikasi tidak boleh membaca atau menulis ledger keuangan ke Firestore. Operasi yang menentukan status akses harus mengikuti hasil otoritatif backend; jangan mempercayai nilai akses yang hanya disimpan lokal.

### 3.3 Kebijakan EAS Update dan Pembaruan Aplikasi

Target pengalaman pengguna: setelah mengunduh dan memasang APK pertama, pengguna menerima update aplikasi yang kompatibel melalui mekanisme update di dalam aplikasi, tanpa harus mengunduh APK baru setiap kali ada perubahan JavaScript atau aset.

Persyaratan:

- `expo-updates` dan konfigurasi EAS Update wajib disiapkan sebelum APK produksi pertama dibangun. APK awal harus sudah memuat native update module.
- Konfigurasikan EAS Project ID, update URL, `runtimeVersion`, dan channel yang sesuai (misalnya `production`; channel preview/staging dapat digunakan untuk pengujian).
- Aplikasi memeriksa update otomatis saat startup atau waktu aman, mengunduh update kompatibel di latar belakang, lalu memberi tahu pengguna ketika update siap diterapkan.
- Update dapat diterapkan pada peluncuran ulang berikutnya atau melalui tindakan **Perbarui sekarang**, setelah memastikan pengguna tidak sedang menjalankan proses penting.
- Tambahkan informasi versi aplikasi, status update, dan tindakan **Periksa pembaruan** di Settings/Profil.
- Gunakan runtime compatibility dan mekanisme recovery/rollback Expo agar update gagal tidak membuat aplikasi terjebak pada versi rusak.
- Jangan mengirim update dengan runtime version atau platform yang tidak kompatibel dengan binary terpasang.

**Batasan penting:** EAS Update dapat memperbarui JavaScript, tampilan, logika aplikasi, dan aset yang kompatibel. Perubahan native code, native dependency, permission Android, konfigurasi native tertentu, atau upgrade Expo SDK memerlukan build APK baru. Target "unduh sekali" berlaku untuk pembaruan OTA yang kompatibel, bukan jaminan APK tidak akan pernah perlu diperbarui lagi.

### 3.4 Kampanye Akses, Pop-up Pemberitahuan, dan Feedback Berkala

#### A. Data kampanye akses berbatas tanggal

- Backend menyimpan setiap jadwal sebagai kampanye yang dapat diaktifkan/dinonaktifkan Founder, bukan tanggal yang ditanam di aplikasi.
- Data kampanye minimal: `campaign_id`, `enabled`, `target_scope` (`all_users` atau `selected_users`), `target_uids` bila target individual, `start_at`, `end_at_exclusive`, `timezone`, `post_expiry_status`, `created_at`, dan `updated_at` (nama field final mengikuti skema dashboard).
- Simpan waktu sebagai server timestamp. Tanggal yang dipilih Founder ditafsirkan dalam `Asia/Jakarta`; `end_at_exclusive` adalah pukul 00.00 WIB pada hari setelah tanggal akhir yang dipilih.
- Kampanye global dan individual dapat dikelola terpisah. Kampanye individual mengesampingkan kampanye global untuk UID terkait. Backend harus menolak atau meminta Founder menyelesaikan kampanye yang tumpang tindih untuk target yang sama.
- Setelah kampanye berakhir, backend menghitung status efektif sebagai `inactive` bagi target kecuali ada akses berbayar terverifikasi atau kebijakan/override lain yang ditetapkan Founder.
- Dokumen kampanye tidak boleh berisi saldo, amplop, atau riwayat transaksi.

#### B. Pop-up pemberitahuan akses dalam aplikasi

- Aplikasi menyediakan modal/pop-up untuk memberi tahu pengguna ketika akses AI diaktifkan, akan berakhir (pengingat ini opsional dan dapat diaktif/nonaktifkan Founder), atau sudah berakhir.
- Isi pemberitahuan mencantumkan status yang berubah, tanggal akhir dan zona waktu bila relevan, serta fitur yang terdampak. Jelaskan bahwa fitur inti budgeting tetap tersedia ketika hanya akses AI yang berakhir.
- Pemberitahuan dapat ditargetkan ke semua pengguna atau UID tertentu dan hanya ditampilkan kepada target yang sesuai.
- Pop-up ditampilkan setelah aplikasi berhasil mengambil status terbaru dari backend, misalnya saat login atau startup. Jika aplikasi tertutup saat perubahan terjadi, pemberitahuan tampil saat pengguna membuka aplikasi berikutnya.
- Setiap pemberitahuan ditandai sudah dibaca/ditutup agar tidak muncul berulang pada setiap startup. Menutup pemberitahuan tidak mengubah status akses.
- Ini adalah in-app pop-up, bukan push notification OS. Push notification di luar cakupan MVP.

#### C. Pop-up feedback berkala

- Aplikasi menampilkan pop-up untuk meminta penilaian atau saran. Frekuensinya dikendalikan Founder melalui backend.
- Nilai awal yang disarankan: paling sering satu kali setiap 2 hari (interval 48 jam). Interval dapat diubah atau dinonaktifkan tanpa merilis APK baru.
- Untuk pengguna baru, pop-up pertama tidak ditampilkan sebelum pengguna memiliki pengalaman awal menggunakan aplikasi. Nilai awal yang disarankan: 2 hari setelah aktivasi akun/penggunaan pertama.
- Interval berikutnya dihitung dari waktu pop-up terakhir ditampilkan. Jika pengguna mengirim feedback atau memilih melewati/menutup pop-up, cooldown dimulai kembali.
- Pengguna dapat menutup/melewati pop-up tanpa kehilangan akses ke fitur aplikasi. Menu Feedback di Settings tetap tersedia kapan saja.
- **[Usulan]** Sediakan pilihan "Jangan tampilkan lagi" pada pop-up (disimpan sebagai preferensi per UID), agar pengguna yang terganggu tidak berhenti memakai aplikasi. Perlu persetujuan Founder.
- Simpan hanya metadata minimum, seperti `last_feedback_prompt_at`, `next_feedback_prompt_at`, dan preferensi prompt per UID. Isi feedback disimpan terpisah di koleksi `feedback` dan hanya dikirim ketika pengguna menyetujuinya.
- Jangan munculkan pop-up saat pengguna mengisi transaksi, memproses AI, atau berada dalam alur kritis. Tampilkan pada momen aman setelah pengguna selesai menggunakan aplikasi.

#### D. Konfigurasi awal (konseptual)

```json
{
  "access_notice_enabled": true,
  "access_expiry_reminder_enabled": true,
  "feedback_prompt_enabled": true,
  "feedback_prompt_initial_delay_days": 2,
  "feedback_prompt_interval_days": 2
}
```

Nilai awal dapat diubah Founder melalui Web Dashboard. Nama field final mengikuti skema dashboard. Pop-up tidak memerlukan integrasi push notification.

### 3.5 Perilaku Offline dan Sesi Login **[Usulan, perlu konfirmasi Founder]**

Aplikasi bersifat offline-first tetapi login Google wajib. Agar keduanya tidak bertentangan:

- Login pertama kali memerlukan koneksi internet. Tampilkan pesan yang jelas bila gagal karena offline.
- Setelah login berhasil, sesi Firebase Auth dipertahankan. Aplikasi tetap dapat dibuka dan fitur inti budgeting (amplop, transaksi, saldo, riwayat, export CSV) tetap berfungsi **tanpa koneksi**, termasuk setelah restart.
- Status akses terakhir yang berhasil diambil disimpan sebagai cache untuk tampilan. Cache hanya untuk UI; AI Capture/Chat tetap membutuhkan internet (karena memanggil provider AI) sehingga status akses diperiksa ulang saat online.
- Cache akses tidak boleh dipakai untuk memperpanjang akses yang sudah berakhir. Jika waktu cache tidak dapat diverifikasi, perlakukan sebagai belum terverifikasi dan periksa ulang ketika online.
- Pop-up akses dan feedback hanya ditampilkan setelah status terbaru berhasil diambil; saat offline pop-up ditunda.
- Jika sesi kedaluwarsa atau pengguna logout, jangan menghapus ledger lokal. Data lokal tetap utuh dan tersedia kembali setelah login ulang dengan akun yang sama. Perilaku jika login dengan akun Google yang berbeda pada perangkat yang sama perlu ditetapkan (misalnya data lokal dipisah per UID).

---

## 4. Desain UI/UX Mobile

**Total desain referensi: 15 layar** (3 slide onboarding dan 1 layar Login sudah termasuk dalam hitungan ini). Penambahan status update dan feedback ditempatkan pada layar yang sudah ada; tidak menambah layar baru kecuali Founder menyetujuinya.

### 4.1 Design System (Token, 17 November 2026)

| Token | Nilai |
|---|---|
| Primary Dark | `#121212` (Graphite) |
| Accent Lime | `#CDFA4E` |
| Background | `#121212` (dark default) |
| Surface | `#1E1E1E` |
| Text Primary | `#FFFFFF` |
| Text Secondary | `#B3B3B3` |
| Border | `#333333` (1px) |
| Typography | System font (Roboto/Inter), scale 12/14/16/20/28/32 |
| Spacing | 4dp base (4, 8, 12, 16, 24, 32, 48) |
| Radius | 8dp (card), 12dp (modal), 24dp (bottom sheet) |
| Touch Target | ≥48dp |
| Contrast | WCAG AA minimum |

**Komponen library:** Button (primary/secondary/ghost), Input, Card, Modal, Bottom Sheet, Progress Bar (2px lime), Tab Bar (4 tab), Chip, Avatar, Divider.

### 4.2 Daftar Layar Mobile (15 Layar)

| # | Layar | Kondisi | Catatan |
|---|---|---|---|
| 1 | Splash | - | Brand logo, loading, pemeriksaan update yang aman tanpa mengganggu startup. |
| 2 | Onboarding 1/3 | Slide 1 | Masalah pencatatan manual. |
| 3 | Onboarding 2/3 | Slide 2 | Konsep envelope budgeting. |
| 4 | Onboarding 3/3 | Slide 3 | Arus Dana value proposition. |
| 5 | **Login (Google OAuth)** | **Wajib** | Firebase Auth; pengguna harus login sebelum memakai fitur aplikasi. Tampilkan pesan jelas bila offline (lihat 3.5). |
| 6 | Setup Amplop Default | - | Pilih kategori dan budget awal. |
| 7 | Setup AI Key (BYOK) | - | SecureStore, provider dropdown. |
| 8 | **Home Dashboard** | Normal / Empty / Loading / Error | Saldo total, delta, status akses (label Early Access tanpa timer pada mode `unlimited`), 4 amplop progress, CTA "Catat Transaksi", bottom tab bar. Menjadi titik aman untuk pop-up akses/feedback ketika tidak ada proses kritis. |
| 9 | Envelope Management | List / Tambah / Edit | CRUD amplop, alokasi, transfer. |
| 10 | Transaksi Manual | Input form | Nominal, keterangan, kategori, tanggal, jam. |
| 11 | AI Capture (Scan Struk) | Camera / Gallery / Preview | OCR → AI parse → konfirmasi. |
| 12 | Riwayat Transaksi | List + Filter | Tanggal, kategori, amplop, pencarian. |
| 13 | Review Bulanan | Chart + Insight | **Status cakupan menunggu keputusan Founder** (lihat Bagian 9). |
| 14 | **Akses AI / Upgrade** | Unlimited / Date-limited Free / Trial / Locked | Early Access menampilkan akses tanpa batas waktu. Akses tanggal/trial hanya tampil jika diaktifkan Founder. **UI pembayaran tidak diimplementasikan selama Midtrans ditunda.** Tampilkan tanggal akhir dengan zona waktu jelas. |
| 15 | **Settings & Profil** | Profil, Feedback, AI Key, Backup/Restore lokal, Export CSV, Pembaruan Aplikasi, Tentang | Kelola informasi akun minimum, kirim feedback kapan saja, cek versi/update, SecureStore management; backup/restore melalui file lokal pengguna, bukan cloud. Pop-up akses dan feedback adalah modal di atas layar yang ada, bukan layar navigasi baru. |

**Status export desain:** export PDF yang ada saat ini berisi 14 file dan **belum memuat layar Login**. Total desain tetap 15 layar; export layar Login perlu dilengkapi Founder (Copilot tidak membuat atau mengubah file desain).

**File desain:** `D:\Belajar\AI Agent Scrach\Open Maus Bot\Brand Group\Designer\Arus Dana Design Export\arus-dana-design.figcraft`  
**Export PDF:** folder `D:\Belajar\AI Agent Scrach\Open Maus Bot\Brand Group\Designer\Arus Dana Design Export\arus-dana-design.pdf` (14 file; layar Login belum termasuk).  
**Design Tokens MD:** `D:\Belajar\AI Agent Scrach\Open Maus Bot\Brand Group\Designer\Arus Dana Design Export\arus-dana-design-tokens.md`

### 4.3 Diagram dan Aset FigCraft

Diagram FigCraft yang telah disetujui Founder sudah tersedia dan dikelola Founder.

| Diagram | File |
|---|---|
| User Flow Arus Dana | `diagram-user-flow-arus-dana.figcraft` |
| Arsitektur Data | `diagram-arsitektur-data-arus-dana.figcraft` |
| Logika Trial & Upgrade | `diagram-logika-trial-upgrade.figcraft` |
| Flowchart Alur Utama | `diagram-flowchart-alur-utama.figcraft` |
| Use Case Diagram | `diagram-use-case-arus-dana.figcraft` |
| Sequence Diagram Transaksi + Upgrade | `diagram-sequence-transaksi-upgrade.figcraft` |

Lokasi yang tercatat: `D:\Belajar\AI Agent Scrach\Open Maus Bot\Brand Group\Designer\*.figcraft`.

**Instruksi:** jangan membuat ulang, mengubah, menghapus, atau menimpa file `.figcraft` maupun export PNG tanpa permintaan dan persetujuan eksplisit Founder. Founder akan menyelaraskan diagram dengan revisi kebijakan akses dan pemisahan PRD secara terpisah.

---

## 5. Model Bisnis dan Monetisasi

| Elemen | Detail |
|---|---|
| Produk Gratis | Pencatatan, amplop, saldo, export CSV, serta AI Capture/Chat selama akses `unlimited`, `date_limited_free`, atau `free_tier` masih berlaku. |
| Produk Berbayar | Akses AI (Chat + Capture) sesuai kebijakan harga/akses Founder; Predictor/Planner dapat menjadi fitur pasca-MVP. Belum aktif. |
| Mekanisme Akses Default | `unlimited`; semua fitur terbuka tanpa batas waktu. Tidak ada timer trial otomatis. |
| Akses Gratis Berbatas Tanggal | `date_limited_free`; Founder menentukan tanggal mulai/akhir dan target semua pengguna atau UID tertentu. Tanggal akhir inklusif; akses AI berakhir pukul 00.00 WIB hari berikutnya kecuali kebijakan lain ditetapkan. Fitur inti budgeting tetap gratis. |
| Mekanisme Trial | Dapat diaktifkan dan diatur custom dari backend. Durasi tidak dikunci menjadi 7 hari. Timer dimulai pada first AI access setelah kebijakan diaktifkan Founder; waktu server menjadi acuan. |
| Notifikasi Akses | Pop-up in-app saat akses mulai/berakhir dan pengingat sebelum berakhir bila diaktifkan. Tidak membutuhkan push notification. |
| Feedback Berkala | Pop-up dengan interval backend yang dapat diubah; default awal paling sering setiap 2 hari. Feedback juga selalu tersedia dari Settings. |
| Pembelian | **Ditunda.** Jika kelak Midtrans diaktifkan: Snap → Cloud Function/webhook → verifikasi server → akses `active`. |
| Biaya AI | Ditanggung pengguna melalui BYOK; developer tidak menanggung biaya token provider AI. |
| Harga | Belum ditentukan; perlu validasi pengguna. |

---

## 6. Keamanan dan Privasi Mobile

- **Login wajib, data keuangan tetap lokal:** Firebase Auth digunakan untuk identitas akun. Login tidak berarti ledger keuangan diunggah ke cloud.
- **Data yang boleh disimpan di backend Arus Dana:** Firebase UID, informasi akun minimum, status akses/trial/pembayaran, jadwal kampanye akses dan target UID, status pemberitahuan in-app, metadata waktu prompt feedback, feedback yang dikirim pengguna, serta data teknis minimum operasional aplikasi.
- **Analitik penggunaan:** Firebase Analytics hanya mencatat event non-keuangan untuk memahami aktivasi, penggunaan fitur, dan retensi. Jangan catat nominal, saldo, kategori, deskripsi, foto struk, atau isi transaksi.
- **Pemberitahuan dan prompt:** simpan ID pemberitahuan serta metadata waktu/status dibaca; bukan data keuangan. Push notification OS tidak termasuk MVP.
- **Tidak ada cloud sync ledger:** data amplop, saldo, dan transaksi tetap berada di perangkat. Backend Arus Dana tidak mengumpulkan isi data keuangan lokal.
- **Risiko kehilangan data:** karena tidak ada cloud sync dan `allowBackup=false`, uninstall atau ganti perangkat menghapus seluruh ledger. Pengguna harus diberi tahu hal ini (misalnya saat onboarding atau di Settings) dan diarahkan ke Export CSV serta Backup/Restore lokal.
- **Penggunaan AI BYOK:** saat pengguna secara sadar menjalankan AI, data relevan dapat dikirim ke provider AI pilihan pengguna; data tersebut tidak perlu melewati atau disimpan di backend Arus Dana.
- **Pembatasan akses AI bersifat kontrol produk, bukan perlindungan kuat:** karena AI dipanggil langsung dari perangkat dengan key milik pengguna, pembatasan akses AI dikendalikan oleh status akses dan feature flag di aplikasi. Anti-piracy tidak termasuk cakupan MVP.
- **Feedback:** dikirim secara sadar, disimpan di Firestore, dan dikaitkan dengan Firebase UID. Pop-up dapat ditutup/dilewati dan frekuensinya dibatasi.
- **SecureStore** untuk AI key pengguna.
- **`allowBackup=false`** sebagai pembatasan backup Android; bukan pengganti enkripsi atau kontrol keamanan lainnya.
- **Kompres foto struk** sebelum dikirim ke provider AI.
- **Firebase Security Rules** wajib membatasi akses berdasarkan Firebase Authentication/UID. Jangan mengandalkan penyembunyian UI. Rules yang sudah ada untuk dashboard harus ditinjau terhadap akses dari aplikasi pengguna (lihat 3.1).
- **Rahasia server** (misalnya Midtrans Server Key bila kelak digunakan) tidak boleh disimpan di aplikasi mobile atau repository publik.

---

## 7. Instruksi Implementasi untuk Copilot (Wajib Diikuti)

Bagian ini mengatur pengerjaan **Mobile App saja**. Web Dashboard sudah selesai dan berjalan; jangan mengubahnya tanpa persetujuan Founder. Backend Firebase adalah backend bersama bagi kedua aplikasi; jangan membuat project backend ketiga.

### 7.1 Tahap Pemahaman dan Gerbang Konfirmasi

1. Baca PRD Mobile App ini secara menyeluruh sebelum melakukan tindakan implementasi.
2. Jangan langsung membuat project Expo, menjalankan generator, membuat struktur folder, menulis kode, memasang package, mengubah resource Firebase, atau mengubah file apa pun.
3. Sampaikan rangkuman pemahaman tentang tujuan aplikasi, fitur mobile, penyimpanan ledger lokal, integrasi dengan Firebase yang sudah ada, akses default, kebijakan trial/kampanye, privasi, perilaku offline, dan EAS Update.
4. Sebutkan keputusan yang masih membutuhkan input Founder (lihat Bagian 9). Jangan mengarang konfigurasi atau menganggap keputusan yang belum diberikan sebagai persetujuan. Butir bertanda **[Usulan]** bukan keputusan final.
5. Minta konfirmasi eksplisit bahwa PRD telah dipahami dan Founder mengizinkan pembuatan project/implementasi Mobile App.
6. **Jangan menanyakan** apakah Firebase project sudah dibuat atau apakah Midtrans ingin dikerjakan sekarang. Keduanya sudah dijawab: Firebase sudah ada dan aktif, Midtrans ditunda.
7. Jangan melewati gerbang ini. Diam, respons singkat, atau persetujuan terhadap satu pertanyaan teknis tidak dianggap sebagai izin membuat project.

### 7.2 Firebase — Sudah Tersedia, Wajib Dipakai

1. Firebase adalah dependensi wajib dan **sudah berjalan** bersama Web Dashboard. Jangan menggantinya dengan backend lain, membuat project baru, atau membuat autentikasi palsu/lokal.
2. Sebelum integrasi, lakukan pemetaan skema sesuai 3.2: baca skema Firestore, Security Rules, dan Cloud Functions yang sudah ada, lalu minta konfirmasi Founder.
3. Minta nama package Android final (`android.package` / `applicationId`) kepada Founder. Pandu pendaftaran aplikasi Android ke Firebase project yang sudah ada dan pengambilan `google-services.json` jika pendekatan integrasi memerlukannya.
4. Minta SHA-1 fingerprint atau OAuth configuration saat memang diperlukan oleh metode Google Sign-In (biasanya setelah EAS signing setup); jelaskan urutannya.
5. Jangan meminta private key service account untuk ditempel ke source code atau APK.
6. Jangan mengubah Security Rules, struktur koleksi, atau Cloud Functions yang dipakai dashboard tanpa menjelaskan dampaknya dan mendapat persetujuan Founder.
7. Setelah konfigurasi tersedia, verifikasi Firebase Auth, Firestore, Cloud Functions, dan Security Rules sebelum menyatakan integrasi selesai. Uji juga bahwa pengguna biasa tidak dapat mengakses data pengguna lain atau data administratif.

### 7.3 Midtrans — Ditunda

1. Midtrans ditunda hingga Mobile App selesai. Jangan bertanya ulang kecuali Founder yang memulai pembahasannya.
2. Jangan memasang `midtrans-client`, jangan meminta credential, dan jangan membuat alur pembayaran atau UI pembayaran. Pertahankan akses default `unlimited` dan `payments_enabled: false`.
3. Saat Founder memutuskan untuk melanjutkan, ikuti rencana di 2.4: Snap Redirect, secret di backend, webhook diverifikasi, `midtrans-client` hanya di Cloud Functions.
4. Integrasi Midtrans dan aktivasi trial/akses terbatas adalah dua keputusan berbeda. Jangan mengaktifkan trial atau mengunci AI tanpa konfirmasi kebijakan akses Founder.

### 7.4 EAS Update — Wajib Sejak APK Pertama

1. Rancang dan konfigurasi EAS Update sebelum membuat APK produksi pertama.
2. Pastikan `expo-updates`, EAS Project ID, update URL, runtime version, dan channel telah dikonfigurasi serta diuji.
3. Implementasikan pemeriksaan otomatis, pengunduhan update kompatibel di latar belakang, pemberitahuan bahwa update siap, dan penerapan pada waktu aman.
4. Sediakan tindakan pemeriksaan update di Settings/Profil.
5. Jangan menjanjikan OTA untuk perubahan native. Jika native dependency, permission, konfigurasi native, atau Expo SDK berubah, jelaskan bahwa APK baru diperlukan dan minta persetujuan Founder sebelum build/distribusi.
6. Jangan memasang package native baru tanpa menilai dampaknya terhadap runtime dan kebutuhan APK baru. Ini juga berlaku saat memilih database lokal, library OCR/kamera, dan Google Sign-In: pilih semua dependency native **sebelum** APK produksi pertama dibangun.

### 7.5 Akses, Pop-up, dan Feedback

1. Terapkan default `unlimited`; tidak ada timer otomatis.
2. Trial custom hanya berjalan setelah Founder mengaktifkan kebijakan dan pengguna melakukan first AI access sesuai kebijakan.
3. Kampanye `date_limited_free` harus memakai waktu server, zona waktu `Asia/Jakarta`, tanggal mulai/akhir inklusif, dan `end_at_exclusive` pada 00.00 WIB hari berikutnya.
4. Kampanye dapat menargetkan `all_users` atau `selected_users`; override individual mengesampingkan kampanye global. Konflik target harus ditolak atau diminta penyelesaiannya.
5. Setelah masa akses AI berakhir, terapkan `post_expiry_status` yang disetujui. Jangan otomatis kembali ke `unlimited` dan jangan mengunci fitur inti budgeting.
6. Pertahankan akses `active` yang berasal dari pembayaran terverifikasi kecuali Founder memberi keputusan eksplisit lain.
7. Tampilkan pop-up akses aktif, pengingat sebelum akhir jika diaktifkan, dan akses berakhir. Pop-up hanya untuk target yang relevan dan tidak berulang setelah dibaca/ditutup.
8. Feedback prompt default: initial delay 2 hari dan interval 2 hari. Founder dapat mengubah atau menonaktifkan. Menutup/melewati/mengirim feedback memulai cooldown.
9. Tampilkan feedback prompt pada momen aman; Settings tetap menyediakan menu Feedback kapan saja.
10. Jangan membangun push notification untuk menggantikan in-app pop-up.
11. Ikuti perilaku offline di 3.5 setelah Founder mengonfirmasinya.

### 7.6 Batas Tindakan dan Pelaporan

- Jangan mengubah file FigCraft `.figcraft` atau export PNG. Diagram dikelola Founder.
- Jangan mengubah Web Dashboard atau menjadikan stack Mobile sebagai React + Vite.
- Jangan mengubah React Native/Expo tanpa persetujuan Founder.
- Jangan menggunakan TypeScript; seluruh kode Mobile App wajib JavaScript (lihat 7.8).
- Jangan menambah package, fitur, layanan eksternal, atau biaya berlangganan di luar PRD tanpa menjelaskan manfaat/biayanya dan meminta persetujuan.
- Jangan menyimpan ledger keuangan pengguna di Firebase.
- Jangan mengaktifkan trial, kampanye akses, atau Midtrans tanpa instruksi dan konfirmasi eksplisit.
- Jangan mengunci fitur inti budgeting karena akses AI/trial/kampanye berakhir.
- Setelah setiap tahap, laporkan file yang berubah, package yang ditambahkan, konfigurasi yang diperlukan dari Founder, hasil pengujian, dan batasan yang belum terselesaikan.

### 7.7 Urutan Pengerjaan yang Disarankan

1. Konfirmasi keputusan Bagian 9, lalu setup Expo dengan template **JavaScript** (lihat 7.8) + `expo-updates` + EAS project + signing (sebelum fitur apa pun).
2. Pendaftaran aplikasi Android ke Firebase, Google Sign-In, dan penyambungan ke Firebase yang sudah ada (termasuk pemetaan skema).
3. Ledger lokal: amplop, transaksi manual, saldo, riwayat.
4. Pembacaan status akses dan pop-up pemberitahuan (backend sudah siap).
5. Feedback (prompt dan menu Settings) dan analitik.
6. AI Capture dan AI Chat (BYOK).
7. Export CSV dan Backup/Restore lokal.
8. Review Bulanan (sesuai keputusan), pengujian menyeluruh, lalu build APK produksi pertama.
9. Midtrans menyusul setelah semuanya selesai.

---

### 7.8 Bahasa Pemrograman: JavaScript Penuh, Tanpa TypeScript (Wajib)

Founder tidak menggunakan TypeScript dan perlu dapat membaca serta memelihara kode sendiri. Karena itu:

1. **Seluruh kode Mobile App ditulis dalam JavaScript (ES6+).** Jangan menggunakan TypeScript dalam bentuk apa pun.
2. **Template project:** buat project Expo dengan template JavaScript (misalnya template `blank`, bukan `blank-typescript` atau template default yang membawa TypeScript). Periksa hasil generator; bila template yang dihasilkan memuat TypeScript, hapus dan ganti sebelum melanjutkan, lalu laporkan kepada Founder.
3. **Ekstensi file:** gunakan `.js` (atau `.jsx` bila dibutuhkan). Jangan membuat file `.ts` atau `.tsx`.
4. **Jangan** menambahkan `typescript`, `tsconfig.json`, paket `@types/*`, anotasi tipe, `interface`, `type`, `enum`, generics, atau sintaks khusus TypeScript lainnya. Jangan menambahkan konfigurasi `checkJs` yang memaksa pengecekan tipe.
5. **Contoh dari dokumentasi:** bila dokumentasi Expo, Firebase, atau library lain memberi contoh TypeScript, terjemahkan ke JavaScript. Jangan menyalin sintaks tipe.
6. **Kode harus mudah dipahami pemula JavaScript:**
   - Gunakan nama variabel dan fungsi yang jelas (boleh dalam bahasa Inggris atau Indonesia, tetapi konsisten).
   - Pecah logika menjadi fungsi dan komponen kecil; hindari trik atau pola yang terlalu rumit tanpa alasan.
   - Beri komentar singkat dalam bahasa Indonesia pada bagian yang tidak jelas dengan sendirinya, misalnya aturan akses, perhitungan waktu `Asia/Jakarta`, dan logika cooldown feedback.
   - Gunakan struktur folder yang sederhana dan jelaskan secara singkat setelah dibuat.
7. **Validasi data tanpa tipe:** lakukan pengecekan nilai secara eksplisit di runtime (misalnya memeriksa input nominal dan data dari Firestore) agar kesalahan data tidak merusak aplikasi. Jangan menambahkan library validasi baru tanpa persetujuan Founder (lihat 7.6).
8. **Backend yang sudah ada:** jangan menulis ulang atau mengonversi kode Web Dashboard maupun Cloud Functions yang sudah berjalan hanya karena bahasanya. Bila kode tersebut menggunakan TypeScript, biarkan apa adanya. Tambahan di sisi Cloud Functions yang diperlukan Mobile App (jika ada dan disetujui) ditulis dalam JavaScript, kecuali tidak memungkinkan secara teknis; dalam kasus itu jelaskan alasannya dan minta persetujuan Founder.
9. **Jika sebuah library mensyaratkan TypeScript** atau tidak dapat dipakai dari JavaScript dengan wajar, jangan beralih ke TypeScript. Laporkan kepada Founder dan usulkan alternatif.
10. Saat melaporkan hasil tiap tahap (7.6), jelaskan perubahan dengan bahasa sederhana dan sebutkan bahwa kode tetap JavaScript.

---

## 8. Referensi Teknis

Copilot harus memeriksa dokumentasi versi yang sesuai dengan Expo SDK dan Firebase SDK yang benar-benar digunakan.

- [Expo — EAS Update](https://docs.expo.dev/eas-update/)
- [Expo — EAS Update Getting Started](https://docs.expo.dev/eas-update/getting-started/)
- [Expo — Runtime Versions and Updates](https://docs.expo.dev/eas-update/runtime-versions/)
- [Firebase — Google Sign-In di Android](https://firebase.google.com/docs/auth/android/google-signin)
- [Firebase — Google Services configuration file](https://firebase.google.com/docs/android/google-services-plugin-and-file)
- [Midtrans — Access Keys](https://docs.midtrans.com/docs/access-keys) (untuk fase selanjutnya)

---

## 9. Keputusan Terbuka untuk Founder

Keputusan di bawah ini perlu dijawab sebelum atau saat tahap terkait dimulai. Kolom rekomendasi adalah usulan, bukan keputusan.

| # | Keputusan | Mengapa penting | Rekomendasi | Dibutuhkan sebelum |
|---|---|---|---|---|
| 1 | **Database ledger:** expo-sqlite atau Realm | Keduanya native; harus dipilih sebelum APK pertama agar tidak memaksa APK baru. | expo-sqlite: lebih ringan, risiko dependency native lebih kecil, mudah dijaga kompatibel dengan OTA. | Setup project |
| 2 | **Nama package Android final** | Dipakai untuk pendaftaran Firebase dan `applicationId`; sulit diubah setelah rilis. | Putuskan sekarang dan jangan diubah. | Integrasi Firebase |
| 3 | **Review Bulanan (layar 13):** masuk MVP atau pasca-MVP | Tercantum di 15 layar, tetapi "laporan bulanan" ada di luar cakupan MVP; memengaruhi effort. | Jika masuk MVP, batasi pada versi ringan (total masuk/keluar dan perbandingan kategori bulan ini). Jika tidak, layar tetap sebagai desain pasca-MVP dan tab disembunyikan. | Tahap 8 |
| 4 | **Backup/Restore lokal:** format dan cakupan | Layar Settings mencantumkannya, dan `allowBackup=false` tanpa cloud berarti data hilang saat uninstall/ganti HP. | Masuk MVP. File JSON versi-berskema, dapat dipulihkan dengan validasi; keputusan enkripsi menyusul. | Tahap 7 |
| 5 | **Edit transaksi** | Saat ini hanya hapus; salah ketik nominal sering terjadi pada pencatatan cepat. | Izinkan edit minimal (nominal, kategori, amplop, keterangan). | Tahap 3 |
| 6 | **Login dan offline** (lihat 3.5) | Login wajib bisa bertabrakan dengan sifat offline-first. | Sesi tersimpan; fitur inti tetap jalan offline setelah login pertama; data lokal dipisah per UID. | Tahap 2 |
| 7 | **Tombol "Jangan tampilkan lagi"** pada pop-up feedback | Interval 2 hari cukup agresif untuk Gen Z. | Tambahkan, dan pantau metrik retensi/uninstall. | Tahap 5 |
| 8 | **Provider AI dan alur OCR** | Menentukan package/endpoint dan kemungkinan dependency native. | Putuskan bersama Founder sebelum tahap AI; jika butuh modul native, putuskan sebelum APK pertama. | Sebelum APK pertama |
| 9 | **Pencarian UID pengguna di dashboard** | Kampanye `selected_users` memakai UID; praktis hanya jika dashboard bisa mencari berdasarkan email. | Cek di dashboard yang sudah berjalan; tambahkan bila belum ada. | Saat memakai kampanye individual |
| 10 | **Export layar Login dari desain** | Export PDF baru 14 file dan belum memuat Login. | Founder melengkapi export. | Tahap 2 |

---

## 10. Riwayat Revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 21 November 2026 | PRD mandiri hasil pemisahan PRD gabungan v1.3. |
| 1.2 | 24 November 2026 | Menambahkan kewajiban JavaScript penuh tanpa TypeScript (stack, tabel arsitektur, 7.6, 7.7, 7.8). |
| 1.1 | 24 November 2026 | Menyesuaikan dengan status terbaru: Web Dashboard dan Firebase sudah berjalan, Midtrans ditunda. Kontrak backend mengacu ke skema dashboard. Menambahkan perilaku offline, risiko kehilangan data, tabel keputusan terbuka, urutan pengerjaan, dan merapikan hitungan layar. |
