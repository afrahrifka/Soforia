# Status platform

15 November 2026 — perbaikan tes CI: tes integrasi server mengambil aset dari `public/` yang dilacak Git, bukan `dist/public/` yang hanya tersedia setelah build. Kegagalan GitHub `404 !== 200` terjadi saat meminta model crate pada checkout baru. Tes tetap memeriksa status HTTP, MIME GLB, header biner dan penolakan traversal; pairing, reconnect, otorisasi dan privasi tidak dilonggarkan. Program platform dan seluruh game tidak diubah.

Verifikasi sebelum/sesudah dilakukan pada salinan file Git yang bersih tanpa `dist/`, memakai dependensi lokal yang sama. Sebelum perbaikan 7/8 tes platform lulus; setelahnya seluruh 60 tes lulus tanpa dist pada Node 24 dan Node 22.23.5. Urutan CI check → test → check:docs → build juga lulus. Bukti ada di evidence/ci-test-report.json; run GitHub baru belum dijalankan. Uji sumber ini tidak menggantikan build/regresi browser atau dua HP fisik.
