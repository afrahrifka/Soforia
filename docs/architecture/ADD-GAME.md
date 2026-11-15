# Tambah game tanpa konflik registry

```sh
npm ci
npm run game:new -- --id komet --title "Komet Berdua"
npm run change:new -- --scope game:komet --summary "Tambah Komet Berdua"
npm test -- --scope game:komet
npm run check
npm run build
npm run check:scope -- --working
```

Perintah pertama membuat starter yang dapat dimainkan, bukan game matang yang otomatis diterima. Tidak menimpa folder yang sudah ada. Lengkapi desain, aturan, controller, console, tes privasi, aksesibilitas, aset/lisensi dan playtest dalam folder itu.

**Aturan tunggal registrasi: satu ID unik = satu folder game = satu `manifest.json` = satu PR scope game.** Jangan mengedit dashboard, host, game lain, daftar scope commit, file generated, atau daftar impor pusat. `order` boleh sama; ID menjadi tie-breaker sehingga kontributor tidak perlu memesan angka global.

Manifest wajib `schemaVersion:1`, `players:2`, ID sama dengan nama folder (slug huruf kecil), metadata menu dan schema input. Entry tetap `server.ts` dan `client.ts`; tidak menerima path eksternal. Axis `x/y` wajib, axis tambahan maksimal delapan keseluruhan dan rentang input -1..1. Aksi maksimal 24 nama; server memvalidasi berdasarkan manifest aktif. Input tidak boleh mengubah game lain.

Aset berada di `src/games/<id>/assets/`, dengan sumber/lisensi. Build menyalinnya ke `/games/<id>/assets/`. Jangan mengubah inventaris aset bersama untuk aset khusus game. Untuk artwork default gunakan `art.ts`; asset loader shared tersedia read-only jika memang diperlukan. CSS tidak boleh mengimpor URL atau style global; gunakan class lokal, layout gap dan media query.

Setiap game menyimpan `AGENTS.md`, `README.md`, `STATUS.md`, `tests/`, `tools/` bila perlu, dan `evidence/`. Jangan menambah laporan rutin game ke roadmap/evidence pusat. Tautkan issue pemilik supaya dua orang tidak mengerjakan file map yang sama tanpa koordinasi.

PR diverifikasi oleh discovery, batas AST impor, isolasi graph browser/server, namespace CSS, scope diff, tes dan build. Checker tidak menilai keseruan; pemelihara tetap menilai kualitas, lisensi dan hasil playtest.
