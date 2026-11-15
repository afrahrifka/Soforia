# Mulai di sini — instruksi semua kontributor AI

Instruksi ini berlaku di seluruh repo. Sistem/tool yang digunakan tetap mempunyai aturan dan izin sendiri; file repo tidak dapat memaksa semua AI membacanya. Jika tidak dimuat otomatis, lampirkan file ini dan `docs/architecture/AI-START.md` ke prompt. Jangan mengklaim kepatuhan universal.

## Sebelum mengedit

1. Baca `docs/architecture/AI-START.md`, `SPEC.md`, `docs/03-katalog-game.md` dan status terbaru `docs/09-roadmap.md`.
2. Jalankan `git status --short`. Pertahankan perubahan pengguna/kontributor lain. Jangan reset, menghapus, atau memformat seluruh repo untuk menyelesaikan tugas lokal.
3. Tentukan **satu scope** dari permintaan pengguna. Jalankan `npm run ai:route -- --scope game:glass` atau scope yang sesuai. Baca `AGENTS.md`, `README.md`, `STATUS.md` di folder pemilik.
4. Sebutkan path fokus sebelum bekerja. Buat satu change note unik lewat `npm run change:new -- --scope <scope> --summary "..."`. Jangan mengedit change note PR lain.

## Batas tulis

| Tugas | Path tulis | Dilarang untuk tugas tersebut |
|---|---|---|
| Dashboard/menu | `src/dashboard/` | Semua game, console game, platform/shared |
| Satu game, termasuk console/HP/audio/map | `src/games/<id>/` | Game lain, dashboard, platform/shared, facade root |
| Game baru | Folder baru `src/games/<id>/` | Menambah ID/switch/import manual ke host/dashboard/registry |
| Host/protokol/API umum | `src/platform/`, `src/shared/`, `tests/platform/` | Mengubah aturan atau console game dalam PR yang sama |
| Dokumentasi | README, panduan dan `docs/` | Program game/host |
| Tooling | `scripts/`, `tests/tooling/`, package tooling | Program game/dashboard |
| Migrasi lintas modul yang diotorisasi | Scope `architecture` dengan alasan dan review pemelihara | Menganggap migrasi sebagai izin untuk mengubah sistem/deployment lain |

Satu `.changes/<id-unik>.json` diperbolehkan di luar folder utama setiap scope. Untuk tugas game biasa, status, tes, tool dan bukti ada **di dalam folder game**; jangan mengedit roadmap/evidence pusat. Pemelihara mengagregasikan roadmap pusat. API bersama boleh dibaca untuk memahami kontrak, tetapi bukan otomatis boleh diubah.

Arahan pengguna yang jelas mengotorisasi pekerjaan lintas modul dapat dijalankan sebagai `architecture`; jangan meminta persetujuan ulang untuk cakupan yang sudah diberikan. Jika API bersama memang harus berubah tetapi belum termasuk arahan, jelaskan kebutuhan dan pisahkan pekerjaan platform; jangan menyelundupkannya ke perbaikan game.

## Aturan implementasi

- `src/games/<id>/server.ts`: aturan otoritatif, snapshot publik/privat, hasil. Tidak impor game lain atau memakai filesystem/network sendiri.
- `console.ts`, `hud.ts`, `controller.ts`, `client.ts`, audio/map dan `style.css` hanya milik game itu. Gunakan API `src/shared/game-contracts.ts` dan resource scene yang diberikan host.
- Dashboard hanya metadata manifest dan artwork yang diinjeksi; tidak berisi aturan game. Host tidak menambahkan cabang `if game.id === ...` untuk fitur baru.
- Gunakan `npm run game:new -- --id <slug> --title "Judul"`. Folder/id unik, huruf kecil. `manifest.json` satu-satunya deklarasi katalog; generate/build menemukan game otomatis. Game baru wajib mempunyai server, client, console/controller, dokumentasi dan tes sendiri.
- Jangan edit/commit `src/generated/`, `dist/`, `.runtime/`, facade kompatibilitas `src/*.ts`, atau daftar game pusat. Ubah sumber modul/generator pada scope yang benar.
- CSS game dibatasi build ke `data-game-scope` pemilik. Jangan `html`, `body`, `:root`, sibling selector, URL/import/font global atau selector keluar scope. Gunakan aset lokal game dengan sumber/lisensi.
- Jangan melemahkan checker/tes, menambah pengecualian global, atau memalsukan change note agar perubahan lintas scope lolos.

## Verifikasi dan serah-terima

Jalankan tes scope, `npm run check`, `npm run build`, `npm run check:scope -- --working`; untuk docs jalankan `npm run check:docs`. Laporkan perintah/hasil dan keterbatasan sebenarnya. Perbarui `STATUS.md` dan bukti milik modul; perubahan platform/architecture juga memperbarui `docs/09-roadmap.md`. Commit hanya path yang memang diotorisasi; push/merge mengikuti permintaan pengguna. Pesan `type(scope): ringkasan` memakai scope cz-git yang dibaca dari manifest.

Dokumentasi/laporan utama memakai Bahasa Indonesia. Terjemahan README boleh memakai bahasa tujuan dan wajib menyamakan fakta/tautan dengan sumber Indonesia. Jangan mengklaim dokumentasi sebagai aplikasi, browser sintetis sebagai dua HP fisik, atau RTT sebagai input-to-photon.

## Batas proyek yang tetap berlaku

- Dua pemain pasangan, offline LAN, controller browser HP, server otoritatif di laptop. Catat perubahan cakupan.
- Portofolio Web-Portfolio-3D bukan sumber kode/konten game. Pengecualian arahan pengguna 14 November 2026: aset relevan dari `public/lib` boleh digunakan bila redistribusinya jelas (misalnya CC0), dengan inventaris/sumber/lisensi. Jangan menyalin kode atau membangun ulang game portofolio.
- Jangan mengubah Tailscale, firewall, systemd, atau deployment proyek lain sebagai pekerjaan rutin.
- Secret sesi, QR aktif dan jawaban pribadi tidak boleh masuk log, fixture publik, screenshot atau Git. Gunakan data sintetis.
