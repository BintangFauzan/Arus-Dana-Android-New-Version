# Gap backend yang ditemukan

1. Status database menyebut `access/{uid}` sebagai otoritas, tetapi dokumen schema menyebut enforcement expiry campaign belum dianggap siap produksi tanpa emulator. QA dashboard lokal melaporkan campaign expiry/reconciliation tidak menulis status efektif. Mobile tidak boleh merekonstruksi entitlement dari campaign. **Dampak:** status tanggal/trial bisa tertinggal; Founder perlu validasi backend sebelum memakai kebijakan tersebut.
2. Fungsi `startTrialOnFirstAiAccess` dan `getInAppNotificationConfig` tersedia sebagai `https.onRequest`; URL project yang terdeploy tidak tercatat di konfigurasi mobile. Tidak dipanggil tanpa URL dan validasi token.
3. Schema menyebut prompt settings global (`config/feedbackPrompts`) tetapi tidak ada struktur metadata prompt/cooldown per UID. Karena belum ada kontrak aman, pop-up berkala tidak diaktifkan; Settings tetap sediakan feedback sadar pengguna.
4. Pemetaan skema tidak menyebut status baca notifikasi per UID atau endpoint feedback prompt personalization. Tidak dapat menyimpan status seen dengan aman tanpa kontrak.
5. Tidak ada Firebase config yang diberikan di mobile. Google OAuth dan Firebase Auth tidak dapat diverifikasi sampai Founder mengisi env.

Tidak ada kebutuhan tambahan yang ditulis ke dashboard, Functions, atau Rules.
