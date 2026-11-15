# Dashboard konsol

Scope `dashboard`. `view.ts` menghasilkan menu dari snapshot katalog dan fungsi artwork yang diinjeksi host. `style.css` hanya layout menu. Untuk memperbaiki kartu/QR/koleksi, mulai dari dua file ini; jangan membaca atau mengedit aturan game bila tidak diperlukan. Data judul/genre/art game bukan daftar di sini, melainkan manifest/art modul itu.

Verifikasi: `npm run check`, `npm run build`, `node scripts/menu-browser-check.mjs`, `npm run check:scope -- --working`. Status lokal ditulis di `STATUS.md`. Jika kebutuhan ternyata pairing/protokol, itu scope platform terpisah, bukan alasan mengubah server pada PR dashboard.

Pustaka aktif memakai `controller.ts` untuk UI menu HP dan `tests/library.test.ts` untuk halaman/filter/D-pad. Pemilahan, pencarian dan navigasi murni ada di kontrak helper `src/shared/catalog-library.ts` (read-only untuk task dashboard biasa). Persistensi favorit serta transport merupakan platform; jangan menaruh akses filesystem di dashboard. Halaman berisi maksimal delapan kartu. Jangan mengembalikan daftar game hardcode atau merender seluruh cover katalog besar.
