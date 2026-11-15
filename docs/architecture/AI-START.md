# Peta kerja AI — baca sebelum mengubah kode

Tujuan aturan ini adalah mencegah salah path dan konflik, bukan menjanjikan model selalu patuh. `AGENTS.md` adalah sumber aturan, adapter tool hanya pintu masuk. Pemeriksaan AST impor, namespace CSS, scope diff dan CI memberi penegakan yang dapat diuji. Perlindungan merge tetap perlu diaktifkan pemilik repo.

## Pilih jalur

| Pengguna meminta | Buka dahulu | Edit hanya |
|---|---|---|
| Menu dashboard/QR katalog | `src/dashboard/README.md` | `src/dashboard/` |
| Carry/Kaca Berdua | `src/games/glass/README.md` | `src/games/glass/` |
| Orbit | `src/games/orbit/README.md` | `src/games/orbit/` |
| Kebun | `src/games/garden/README.md` | `src/games/garden/` |
| Kota/properti | `src/games/property/README.md` | `src/games/property/` |
| Seirama | `src/games/seirama/README.md` | `src/games/seirama/` |
| Pairing, reconnect, sesi, host/controller shell | `src/platform/README.md` | `src/platform/`, API bersama bila termasuk scope |
| Game baru | [ADD-GAME](ADD-GAME.md) | Folder baru milik ID tersebut |
| Terjemahan/panduan | README Indonesia dan [COLLABORATION](COLLABORATION.md) | Dokumen yang diminta |

Contoh task yang benar: “Scope `game:glass`, perbaiki kamera di `src/games/glass/glass-camera.ts`, pertahankan modul lain.” Contoh salah: “Sekalian rapikan seluruh `src/` dan ubah dashboard supaya tes lolos.”

## Urutan tanpa tebakan

```sh
git status --short
npm run ai:route -- --scope game:glass
npm run change:new -- --scope game:glass --summary "Perbaiki kamera pada tikungan"
# Baca AGENTS/README/STATUS modul dan kontrak bersama seperlunya.
npm test -- --scope game:glass
npm run check
npm run build
npm run check:scope -- --working
```

Pada workspace yang sudah kotor, jangan mengklaim semua diff milik tugas sendiri. Isolasikan branch/worktree dari awal atau koordinasikan scope; jangan menghapus pekerjaan yang ditemukan. Change note bukan bukti pengujian: isi `validation` dengan hasil aktual dan perbarui status modul.

## Di mana suatu perubahan berada?

- **Gameplay/server**: `server.ts` dan berkas aturan/map dalam folder game. `tick` menerima waktu yang sudah ditambah host; jangan menambah waktu dua kali. Input/aksi dideklarasikan manifest dan divalidasi host.
- **Scene laptop**: `console.ts` melalui `SceneKit`. Jangan membuat renderer/canvas global baru atau mengambil resource game lain.
- **Kontrol HP**: `controller.ts`; tombol analog tambahan memakai `axisButton` dan axis manifest. `client.ts` menggabungkan hook tanpa edit shell.
- **HUD/layar khusus**: `hud.ts`, `display.ts` bila perlu. Kunci rerender milik game; jangan membatalkan pointer hanya karena snapshot bergerak.
- **Audio**: modul game dan lifecycle `snapshot/unlockAudio/muteAudio/leave`. Tidak memodifikasi soundtrack game lain.
- **Katalog**: `manifest.json` untuk data game; `art.ts`/`assets/` untuk cover miliknya. Layout kartu dan navigasi dashboard tetap `src/dashboard/`.
- **Style**: `style.css` milik game; build menambah namespace secara otomatis. Style dashboard dibatasi `body.catalog-screen`.

Bila path yang dibutuhkan berada di luar scope, cek apakah pengguna sudah mengotorisasinya. Tanpa otorisasi itu, laporkan batas dan usulkan pekerjaan lapisan terkait; jangan mengubah file pusat sebagai jalan pintas.

## Dukungan tool dan batasnya

Pintu masuk disediakan untuk AGENTS/Codex, Claude, Gemini CLI, Copilot, Cursor, Windsurf, Cline, Roo, Aider dan Continue. Versi/konfigurasi tool dapat menentukan apakah file otomatis dimuat. Untuk tool lain atau versi yang tidak mendukung, lampirkan `AGENTS.md` dan file ini secara eksplisit. Tidak ada klaim “semua AI pasti membaca”. Lihat [rujukan resmi dan penegakan](ENFORCEMENT.md).
