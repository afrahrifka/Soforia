# Panduan Kolaborasi Main Bareng

Ide, laporan masalah, tulisan, terjemahan, desain dan playtest sama bergunanya dengan kode. Ikuti [Kode Etik](CODE_OF_CONDUCT.md). Kontribusi memakai [MIT](LICENSE); aset pihak ketiga harus mempunyai izin redistribusi dan sumber/lisensi.

## Ide atau laporan masalah

Cari issue serupa, lalu pilih formulir **Bagikan ide**, **Laporkan masalah** atau **Perbaikan panduan**. Nyatakan scope (`game:<id>` atau lapisan), perilaku yang diharapkan, hasil yang terjadi, perangkat dan cara mengulang. Gunakan contoh sintetis. Jangan bagikan QR aktif, secret atau jawaban pribadi. Masalah keamanan dilaporkan pribadi melalui kanal pemelihara pada [profil @oskhar](https://github.com/oskhar).

## Perubahan program dan dokumen

1. Baca [AGENTS](AGENTS.md), [peta fokus AI/manusia](docs/architecture/AI-START.md), [SPEC](SPEC.md), [katalog](docs/03-katalog-game.md) dan [roadmap](docs/09-roadmap.md). Untuk pekerjaan besar yang belum diminta pemilik, diskusikan issue terlebih dahulu; instruksi pengguna yang sudah jelas tidak perlu dimintakan ulang.
2. Ambil satu scope dan branch dari branch utama (`master`, jangan mengasumsikan `dev`). Gunakan fork/worktree terpisah bila mengerjakan beberapa task. Jangan reset perubahan yang bukan milikmu.
3. Jalankan `npm ci`, `npm run ai:route -- --scope <scope>`, lalu baca README/AGENTS/STATUS modul. Buat satu change note unik dengan `npm run change:new`.
4. Edit hanya path scope. Dashboard tidak mengubah game; satu game tidak mengubah game/console lain; penambahan game hanya folder ID baru melalui [scaffolder](docs/architecture/ADD-GAME.md). Registry dan scope commit ditemukan otomatis dari manifest.
5. Jalankan tes scope, `npm run check`, `npm run build`, `npm run check:scope -- --working`, dan pemeriksaan docs bila terkait. Catat bukti nyata serta keterbatasan di status/evidence modul sendiri. Browser bukan dua HP, RTT bukan input-to-photon.
6. Stage hanya perubahan yang diotorisasi. `npm run commit` memakai cz-git lokal. Judul wajib `type(scope): ringkasan`; scope game ialah ID manifest. Push branch dan buka PR sesuai otorisasi kontributor/pengguna.
7. Gunakan template PR: masalah, scope, change note, path, issue/pemilik dan verifikasi. Review pemelihara menentukan penggabungan; jangan menganggap flag change note sebagai persetujuan.

Status rutin game berada di folder game, bukan pada satu roadmap yang diperebutkan semua kontributor. Perubahan platform/architecture mengagregasikan status pusat. [Aturan lintas modul](docs/architecture/COLLABORATION.md) menjelaskan kapan migrasi perlu dipisah.

## Penegakan dan AI

AST import, graph browser/server, CSS namespace, scope diff, kontrak dan CI diperiksa otomatis. `npm run hooks:install` memasang hook lokal secara eksplisit. [ENFORCEMENT](docs/architecture/ENFORCEMENT.md) menjelaskan proteksi GitHub yang perlu diaktifkan pemilik serta keterbatasannya. Tidak ada jaminan semua AI otomatis membaca instruksi; lampirkan AGENTS/AI-START jika tool tidak memuatnya.

Panduan utama memakai Bahasa Indonesia; README bahasa lain boleh memakai bahasa tujuan tetapi harus mempertahankan fakta, perintah dan tautan yang sama. Dukungan sukarela [Trakteer](https://trakteer.id/oskhar) tidak menjadi syarat kontribusi.
