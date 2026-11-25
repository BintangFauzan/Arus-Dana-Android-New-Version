# Audit privasi (pre-release)

- Ledger (amplop, transaksi, transfer, nominal, uraian, kategori) disimpan hanya pada SQLite lokal per UID.
- Kode Firebase Firestore mobile hanya membaca `access/{uid}` dan mengirim feedback setelah tombol eksplisit ditekan; tidak ada jalur write ledger.
- Export/backup ditulis ke penyimpanan perangkat dan dibagikan melalui OS atas tindakan pengguna.
- BYOK: foto hanya setelah pilihan pengguna, dikompres lalu dikirim ke Gemini/OpenRouter; tidak lewat backend Arus Dana. Implementasi Custom provider sengaja menolak karena belum memiliki URL.
- Analytics mengizinkan allowlist event serta hanya metadata `screen`, `provider`, `result`. Tidak ada field keuangan. Di Expo Go SDK native dimatikan.
- Rules dashboard aktif dibaca read-only: user read dokumen akses sendiri; feedback create hanya schema terbatas. Catch-all deny. Tidak ditemukan alasan untuk menambahkan rules proposal; tidak membuat `firebase/rules.proposed`.
- Tidak dapat menguji traffic runtime atau backend deploy dari sini. Ini audit statis, bukan jaminan keamanan rilis.
