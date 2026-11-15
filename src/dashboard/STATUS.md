# Status dashboard

16 November 2026 — pustaka konsol ungu: hero game terpilih, grid empat kolom/delapan kartu per halaman, pencarian judul/genre, urutan pilihan/A–Z dan koleksi favorit. Hanya halaman aktif dirender; fixture 2.500 metadata game tidak menambah ribuan node/artwork sekaligus. Kedua controller memakai empat tombol arah, halaman sebelumnya/berikutnya, Main, favorit, filter dan pencarian. Analog tetap ada di dalam game.

Favorit bersama disimpan laptop pada `.runtime/library.json`; berkas hanya memuat versi schema dan ID game. Filter/query/sortir merupakan state sesi bersama. Teks pencarian yang sedang diketik tidak ditimpa snapshot controller lain. Penyimpanan gagal memberi pesan dan mempertahankan favorit dalam sesi. Reset identitas sesi tidak menghapus preferensi favorit laptop.

Verifikasi: `npm test` 65 tes, check/build, `node --import tsx scripts/library-browser-check.mjs`, menu dan dua controller. Bukti ada di evidence/library-browser-report.json dan PNG di folder ini. Fixture 2.500 game hanya bukti presentasi/pagination, bukan 2.500 game terpasang. Uji browser bukan dua HP fisik atau bukti FPS. Titik lanjut: uji keterbacaan TV/jarak duduk serta keyboard virtual Android/iOS fisik.
