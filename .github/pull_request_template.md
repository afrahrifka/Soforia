## Masalah dan hasil

Jelaskan pemicu masalah dan perilaku setelah perubahan.

## Scope tunggal

- Scope: `game:<id>` / `dashboard` / `platform` / `docs` / `tooling` / `assets` / `architecture`
- Change note unik: `.changes/...json`
- Path yang diubah:
- Issue/penanggung jawab:

Satu PR untuk satu game atau satu lapisan. Perubahan lintas lapisan harus merupakan scope `architecture` yang diotorisasi dan ditinjau pemelihara, bukan pengecualian diam-diam.

## Verifikasi aktual

Perintah, hasil, bukti lokal dalam modul, serta batas yang belum diuji. Browser bukan dua HP fisik; RTT bukan input-to-photon. Jangan menyertakan QR/secret sesi atau jawaban pribadi.

- [ ] Judul `type(scope): ringkasan` sesuai cz-git/manifest.
- [ ] Tidak menyentuh game/lapisan lain di luar scope.
- [ ] `npm run check`, tes scope yang relevan dan build lulus atau keterbatasan dijelaskan.
- [ ] Status/bukti game diperbarui pada folder game sendiri; tidak mengedit roadmap pusat untuk tugas game biasa.
- [ ] Sumber/lisensi aset tersedia dan Kode Etik dipatuhi.
