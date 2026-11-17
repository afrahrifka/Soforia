# glass

Scope `game:glass`. Metadata katalog: manifest.json; artwork: art.ts; gaya lokal: style.css; kontrak: src/shared/game-contracts.ts (read-only untuk task game).

Aturan/gerak/kaca: `glass.ts`, `glass-collision.ts`. Rangkaian stage: `glass-levels.ts`; dunia/objek: `glass-world.ts`; jalur: `glass-route.ts`; tanah/jurang: `glass-terrain.ts`; kamera: `glass-camera.ts`; humanoid: `soft-carrier.ts`; interpolasi: `glass-presentation.ts`; audio: `glass-audio.ts`; keyboard: `glass-controls.ts`.

Untuk keluhan map, baca levels → world → route/terrain dan tes terkait. Untuk kamera cukup camera/presentation/console. Jangan mengedit dashboard, renderer umum atau game lain.

Tes: `npm test -- --scope game:glass`. Tool perjalanan: `node --import tsx src/games/glass/tools/glass-course-check.mjs`; kontrol: `node --import tsx src/games/glass/tools/glass-browser-check.mjs`; visual/audio tersedia di tools. Output baru masuk evidence milik game. Bukti historis docs/evidence dipertahankan, tidak ditimpa tugas game baru.

Revisi rangkaian/checkpoint dan penghalang bioma dijelaskan pada [DESIGN](DESIGN.md). Saat mengedit level, ubah `segments` pada `glass-levels.ts`: satu segmen menutup satu checkpoint dan berisi beberapa encounter. Jangan mengembalikan checkpoint di setiap properti. Pertahankan ruang jeda, dermaga, collision/render yang sama dan stage langsung. Rute otomatis harus memakai input/aksi, tanpa teleport/kekebalan; fixture posisi visual dilaporkan terpisah. Indeks spasial di world/route dan chunk terrain di console mempertahankan seluruh bentuk fisik/segitiga.


Revisi identitas arena sebelumnya: `glass-arenas.ts` memuat 60 siluet; rangkaian meningkat 10/12/14/16/23 encounter menurut bab dan memasukkan iris, gunting serta dinding bernapas. [Atlas seluruh stage yang dipadatkan](evidence/pacing-atlas.svg) dan [keputusan desain](DESIGN.md) membedakan peta statis dari bukti perjalanan input.

```sh
node --import tsx src/games/glass/tools/glass-arena-preview.mjs
node --import tsx src/games/glass/tools/glass-course-check.mjs --from 1 --to 20
node --import tsx src/games/glass/tools/glass-course-check.mjs --from 21 --to 40
node --import tsx src/games/glass/tools/glass-course-check.mjs --from 41 --to 60
node --import tsx src/games/glass/tools/audit-arenas.mjs
```

Audit menolak penggabungan bila hash source berbeda. Setiap rentang memakai input/aksi nyata, tanpa teleport/kekebalan. Kelulusan otomatis belum membuktikan keseruan atau acceptance dua HP fisik.


## Video gameplay untuk review

```sh
npm run build
node --import tsx src/games/glass/tools/record-review.mjs
```

Output MP4 utama dan temporer langsung di `~/Videos/Soforia`, memakai nama timestamp agar video lama tetap ada. Memerlukan Chromium, ffmpeg/libx264 dan ffprobe. Tool menuntaskan 13 stage sampel melalui driver input yang sudah diaudit; observasi state tidak mengubah jumlah tick. Montase mencakup 22 jenis rintangan dan rangkaian akhir. Cuplikan berjalan 1×, pengantar bab menahan waktu selama 1,5 detik, dan perpindahan bab memotong sebagian perjalanan.

Metadata dan penanda waktu terbaru: `evidence/video-arena-review-report.json` dan `evidence/VIDEO-ARENA-REVIEW.md`. Video 720p24 tanpa audio ini bukan seluruh kampanye 60 stage, playtest manusia atau benchmark FPS realtime. Tidak ada video yang perlu dimasukkan ke Git.


Revisi pacing terbaru memakai `glass-pacing.ts`: footprint fisik menentukan jarak, pergantian formasi mempunyai ruang persiapan, dan checkpoint menunggu kedua pembawa melewati volume terakhir. `weave` menghubungkan tiga bukaan selang-seling; `tiltWeave` menukar sisi tinggi-rendah; `turntable` memakai dek dengan fase diam dan putaran nyata. Peta dipadatkan tanpa mempercepat kecepatan pemain.

Bukti aktif: `evidence/pacing-comparison.json` (perbandingan geometri sebelum/sesudah), `evidence/pacing-progression-report.json` (perjalanan input), dan `evidence/pacing-design-report.json` (fixture renderer). Bukti `arena-*` dan video terdahulu merupakan riwayat sebelum perbaikan pacing ini. Jalankan `node --import tsx src/games/glass/tools/pacing-metrics.mjs` untuk memeriksa ulang jarak kosong; tool audit kini membaca tiga rentang `pacing-course-*`. Rekaman selanjutnya memakai nama `carry-the-glass-pacing-review-*` dan tetap disimpan di `~/Videos/Soforia`.
