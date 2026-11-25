# Daftar event analytics non-keuangan

Parameter yang diizinkan hanya `screen`, `provider`, dan `result` (kategori nilai umum; tidak menyertakan input pengguna).

- `app_open`
- `onboarding_complete`
- `login_success`
- `envelope_created`
- `transaction_saved` (tanpa jumlah, amplop, kategori atau uraian; menandai aksi saja)
- `ai_capture_started`
- `ai_capture_completed`
- `feedback_sent`
- `backup_created`
- `export_created`

Di Expo Go pembungkus hanya mencatat ke console saat `__DEV__`; data finansial tidak pernah menjadi parameter.
