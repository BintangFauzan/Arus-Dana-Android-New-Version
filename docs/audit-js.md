# Audit JavaScript-only

- Kode aplikasi ditulis dengan `.js`/`.jsx` (JavaScript); tidak ada kode TypeScript.
- Pemeriksaan proyek ini: tidak ada `.ts`, `.tsx`, `tsconfig.json`, dependency `typescript`, atau `@types/*` pada dependency langsung.
- Dependency pihak ketiga dapat berisi deklarasi `.d.ts`; itu bukan source code aplikasi dan tidak menambahkan TypeScript sebagai bahasa implementasi.
- Audit ulang sebelum rilis: `find . -path ./node_modules -prune -o \( -name '*.ts' -o -name '*.tsx' -o -name 'tsconfig.json' \) -print`.
