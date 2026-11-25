# Pemetaan kebutuhan backend

Sumber: dashboard read-only `BACKEND_SCHEMA.md`, `firestore.rules`, dan `functions/index.js` (implementasi lokal dashboard, bukan bukti deployment).

| Kebutuhan | Data/endpoint terverifikasi | Integrasi klien |
|---|---|---|
| Login & identitas | Firebase Auth Google; `users/{uid}` berisi metadata minimum | Firebase Auth JS. Rules mengizinkan pemilik/admin read users; client write ditolak. |
| Status AI | `access/{uid}`: `effectiveStatus`, `source`, `trialEndsAt`, `campaignId`, `updatedAt` | Read hanya dokumen UID sendiri. Tidak pernah tulis access. Jika fetch gagal, data tersimpan hanya tampilan dan tidak menjadi otoritas izin. |
| Kebijakan | `config/accessPolicy`, `config/trialPolicy` | Rules memperbolehkan authenticated read untuk dokumen yang disebut; belum digunakan untuk menghitung entitlement lokal. |
| Trial | HTTP callable-style `startTrialOnFirstAiAccess` di `functions/index.js`; request autentikasi | Fungsi ditulis sebagai onRequest, bukan callable SDK; URL/deployment belum diverifikasi. |
| Notifikasi akses | `config/inAppNotifications`, `config/inAppNotificationTargets`; HTTP `getInAppNotificationConfig` | Jangan baca target/admin config langsung; endpoint deployment dan format respons wajib dikonfirmasi. |
| Feedback prompt | `config/feedbackPrompts` memiliki enabled/initialDelayDays/cooldownHours | User yang sign-in dapat read sesuai rules. Tidak ada metadata prompt per UID yang terdefinisi. |
| Feedback submission | `feedback/{id}`: uid/category/message/status/createdAt | Direct create diizinkan jika uid = auth.uid, status `new`, message 1..2000 chars, createdAt server time. Tidak dapat read/update/delete user. |
| Analytics | Firebase Analytics non-keuangan | Pembungkus terpisah; tanpa parameter finansial. Tidak memakai Firestore. |
| Kampanye | `accessCampaigns/{id}` hanya admin read/write; target, uids, start/end, status | Mobile tidak membaca campaign maupun daftar UID. |
| Ledger lokal | Tidak ada koleksi backend | SQLite lokal terpisah per UID; tidak pernah dikirim ke Firebase Arus Dana. |

## Keterbatasan bukti
`BACKEND_SCHEMA.md` adalah kontrak target dan kode folder dashboard lokal. Tidak dapat dipastikan bahwa versi kode tersebut sama dengan fungsi/rules yang sedang terdeploy; Founder perlu uji staging. Laporan QA dashboard juga mencatat rekonsiliasi campaign/expiry belum lengkap.
