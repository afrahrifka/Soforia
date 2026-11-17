# Status Jam Berulang — 16 November 2026

**Beta yang dapat dimainkan; acceptance perangkat fisik belum selesai.** Pemilik modul `game:jam-berulang`, [issue #41](https://github.com/oskhar/Soforia/issues/41). Revisi arena lintas Kaca/Jam Berulang memakai scope architecture yang diotorisasi pengguna. Dashboard, platform/shared, deployment dan registry manual tidak diubah.

## Sudah diimplementasikan

- Kampanye enam arena baru dengan ukuran dan topologi berbeda, fase jembatan/sekat, jarum bergerak, urutan kunci terbalik dan tiga gerbang pada final; lihat ARENAS.md.
- Pelari A, Perencana B, rekam posisi/aksi, kunci titik akhir, ulang menit, replay deterministik, pemilih empat jejak, scrub/seek, sampai 12 marker waktu.
- Gema menekan P/Q/R, gerbang G/H/I dan jendela waktu periodik, kait gerbang serta inventaris tiga roda persisten lintas loop. E membuka distrik berikutnya.
- Santai tanpa deadline atau batas loop; auto-loop 60 detik pada mode lainnya. Sasaran tiga loop tantangan/empat loop lainnya; overtime tetap dapat selesai tanpa kehilangan progres.
- Scene 3D, sampul orisinal, nada jam/akor lokal, reduced motion, kode huruf selain warna, timeline portrait/landscape dan garis waktu gabungan pada hasil akhir.
- Revisi visual: 29 model KayKit CC0 dan tiga peta material PBR 1K Poly Haven, kamera perspektif, jalan kontinu, rumah gabungan sesuai collision, karakter membulat, tanaman kanal, latar kota, cahaya hangat/dingin dan HUD berlatar transparan. Lihat ASSETS.md dan inventaris checksum visual.
- Pembaruan timer controller tidak mengganti node analog. Primitive statis tetap diinstansikan; model asing mempunyai lifecycle resource per scene. Hitungan render terbaru ada di `evidence/report.json`; bukan benchmark FPS.

## Verifikasi aktual

| Pemeriksaan | Hasil |
|---|---|
| `npm test -- --scope game:jam-berulang` | Lulus 17 tes, termasuk host asli dengan dua client WebSocket sintetis, fase, gerbang wajib, hold dan anggaran medali final |
| Solver enam distrik melalui input/aksi | Lulus; loop solver 1/2/2/2/3/4, tidak memakai teleportasi |
| Replay, inventaris, role, JSON restore, collision, sampel terbatas, jendela gerbang, kunci rekaman | Lulus tes aturan |
| Reconnect slot B, replay/progres tetap, disconnect tanpa pause, jeda manual, permainan baru bersih | Lulus integrasi WebSocket; bukti `evidence/network-report.json` |
| `npm run check` | Lulus discovery, batas impor/CSS dan TypeScript |
| `npm run build` | Lulus build offline |
| `node --import tsx src/games/jam-berulang/tools/preview.mjs` | Lulus enam scene, hasil bersama, klik controller, node analog stabil, viewport 740×360 dan 360×740; tidak ada error/request luar |
| `npm run check:docs` | Lulus |
| `npm run check:scope -- --working` | Tidak lulus pada workspace gabungan: enam change note, termasuk lima catatan yang sudah ada sebelum revisi arena lintas game ini |
| `validateScope` pada seluruh path baru Jam Berulang + change note miliknya | Lulus; bukti `evidence/scope-report.json`. Pemeriksaan subset ini tidak menggantikan kelulusan seluruh workspace |

Bukti visual: `evidence/district-1.png` sampai `district-6.png`, `controller-0-360.png`, `controller-0-740.png`, `controller-1-360.png`, `controller-1-740.png`, `final-timeline.png`. Semua state sintetis, tidak berisi secret/QR aktif.

## Batas dan titik lanjut

Belum playtest pasangan atau dua HP fisik, uji AP/WAN-off, soak 30 menit/dua jam, FPS GPU referensi, RTT LAN atau input-to-photon. Integrasi loopback tidak menggantikan pengukuran tersebut. Target 6–9 menit per teka-teki belum terukur; solver yang mengetahui jawaban menyelesaikan distrik sekitar 15–74 detik. Evaluasi apakah mekanik enam distrik cukup bervariasi dan peran B cukup aktif perlu observasi manusia, bukan klaim dari tes otomatis.

Batas teknis: satu gema aktif, empat arsip posisi terbaru per distrik, maksimal 1.200 sampel draft dengan pengurangan resolusi adaptif untuk sesi santai panjang, maksimal 64 event per loop, 12 marker per loop. Ringkasan hasil menyimpan durasi/event tiap loop dalam sesi; tidak ada penyimpanan rekaman ke disk atau pemulihan setelah restart server. Role tidak dapat ditukar di tengah permainan. Mode controller/stage mengikuti pembatasan host.

Tidak ada commit/push/penutupan issue yang dilakukan. Untuk review gabungan, pisahkan perubahan Kaca melalui alur pemelihara tanpa membuang pekerjaannya.

## Revisi visual dan aset internet

Menambahkan `scenery.ts`, 29 model KayKit dan tiga tekstur PBR lokal (~4,4 MiB). Model/buffer/gambar glTF dikemas embedded; tidak ada dependensi runtime internet. Pustaka bangunan dan vegetasi/properti dipakai sebagai subset per zona. Denah dan aturan server tetap sama; bangunan gabungan tidak melewati footprint sel padat. Karakter serta pencahayaan/HUD diperbaiki. Preview kini menunggu **seluruh model distrik selesai**, memeriksa kegagalan loader dan mencatat jumlah model; tidak memakai screenshot yang baru sebagian termuat.

Verifikasi revisi: 12 tes scope lulus; check, build, pemeriksaan dokumen dan integritas 32 aset lulus. Fixture enam distrik/controller dan screenshot terbaru diperiksa melalui preview. Pemeriksaan seluruh workspace tetap gagal karena tiga change note dari pekerjaan gabungan; tidak menghapus catatan/pekerjaan lama. Validasi subset folder game + catatan revisi dilaporkan terpisah pada `evidence/visual-scope-report.json`.

Arah hasil saat ini masih **3D stylized**, belum grafis fotorealistis/setara produksi AAA. Model KayKit memang memiliki bentuk low poly. Tidak menyatakan target visual AAA atau performa GPU sudah tercapai. Draw call meningkat karena model lebih detail; perlu pengukuran perangkat nyata sebelum menerima anggaran render. Belum mengubah deployment atau me-restart sesi server pengguna.

## Video simulasi untuk review developer

Tool `tools/record-review.mjs` menjalankan kampanye dari state baru melalui gerak analog dan aksi server asli, lalu merender scene/HUD asli ke MP4 H.264 1280×720, 24 fps tanpa audio. Distrik 1–2 memakai 1×; distrik 3–6 2×. Keterangan aksi A/B dan status gerbang disertakan. Jeda penjelasan membekukan waktu simulasi; rute otomatis mengetahui jawaban. Render ini bukan benchmark FPS, rekaman dua HP fisik atau playtest manusia.

Output: `~/Videos/jam-berulang-review.mp4`, petunjuk/bab `evidence/VIDEO-REVIEW.md`, metadata dan validasi `evidence/video-review-report.json`. `tools/package-review.mjs` menambahkan enam bab MP4 dan memeriksa decode seluruh video. Pengambilan memakai GPU lokal bila tersedia; `JAM_SOFTWARE_RENDER=1` memilih fallback Chromium software. Tidak merekam QR, credential sesi atau data pribadi.

Pemeriksaan tugas video: 12 tes scope, check, build dan docs lulus. Scope seluruh workspace terhalang empat change note (tiga sudah ada sebelum tugas video); subset folder game + satu catatan video lulus pada `evidence/video-scope-report.json`. Tidak mengubah aturan/server, renderer bersama, deployment atau pekerjaan Kaca.

Hasil video aktual: **215,833 detik (sekitar 3:36), 5.180 frame, 24 fps, H.264 1280×720, 7,3 MiB**, enam bab. Decode penuh lulus, tanpa error JavaScript/aset atau request internet. Cuplikan hasil encode pada detik 40 dan 210 diperiksa secara visual (`video-encoded-replay.png`, `video-encoded-final.png`). Video ini menampilkan scene dan HUD; layar hasil host/controller fisik tidak direkam.

Video review dipindahkan ke `~/Videos/jam-berulang-review.mp4`; SHA-256 sebelum/sesudah identik. Tool rekam dan packaging sekarang menulis MP4 utama maupun temporer di `~/Videos`, sehingga tidak menambah video ke repo. Metadata dan panduan kecil tetap berada di evidence.

Verifikasi pemindahan: scan repo tanpa video, checksum identik, sintaks kedua tool, 12 tes scope, check, build dan docs lulus. Check scope workspace tetap terhalang lima change note gabungan (empat sudah ada sebelum tugas pemindahan). `.gitignore` lokal game mencegah video tidak sengaja ditambahkan ke Git.


## Revisi identitas arena dan kesulitan

Enam halaman persegi diganti cincin dermaga (21×15), kepulauan (23×17), akuaduk tapal kuda (25×19), planetarium bercabang (27×21), arsip jam pasir (25×23) dan spiral empat pulau (29×25). Permukaan mengikuti sel aktif, tanpa lantai yang menutup lubang. Landmark/latar zona dipilih per arena, tidak mengulang deretan rumah luar yang sama. Kamera menyesuaikan ukuran peta.

Mekanik bertambah lewat jembatan berkala, sekat fase, jarum dengan collider badan, pelat yang ditahan, H sebelum G pada arsip dan I/R pada final. Gerbang tetap mengait permanen dan roda tidak hilang agar menunggu/mengulang arsip tidak menyebabkan softlock. Sekat yang menutup tetap bisa ditinggalkan pemain yang sudah di dalamnya.

Tes Jam Berulang mencakup seluruh rute input, larangan bypass, tahan pelat, fase dan jarum; preview enam arena/controller lulus tanpa error atau request luar. Solver final memerlukan empat loop. Durasi solver adalah rute yang sudah mengetahui jawaban, bukan target waktu manusia. Bukti screenshot diperbarui; video di `~/Videos` merupakan riwayat sebelum revisi arena, tidak diklaim sebagai gameplay baru.

Target medali final mode tantangan menjadi empat loop sesuai minimum tiga rekaman; solusi optimal tidak otomatis mendapat overtime. Regresi anggaran loop ditambahkan.


## Verifikasi akhir revisi arena

- **37 tes Kaca dan 17 tes Jam Berulang lulus (54 tes scope)**; check/TypeScript, build dan docs lulus.
- Kaca: **60 stage/246 checkpoint** pada hash source yang sama lulus input/aksi tanpa teleport/kekebalan; enam kontrol negatif analog saja terhalang. Tiga rentang digabung dan diverifikasi oleh `audit-arenas.mjs`.
- Preview: atlas 60 siluet dan sembilan scene Kaca, enam scene Jam Berulang, controller portrait/landscape, tanpa error JavaScript atau request internet.
- `npm test` gabungan belum hijau: satu tes platform pada `tests/platform/server.test.ts:30` mengasumsikan left dari Orbit menuju Glass. Katalog kini berakhir pada Jam Berulang; run ulang tes platform mereproduksi kegagalan yang sama (8/9 lulus). Tes tersebut dan program platform tidak diubah dalam perombakan arena ini.
- `check:scope --working` tetap gagal karena enam change note workspace gabungan; validasi subset architecture untuk dua folder game, roadmap dan catatan tugas ini lulus. Lima catatan sudah ada sebelum tugas. Review pemelihara tetap diwajibkan policy architecture.

Ringkasan perintah, hash source dan keterbatasan lintas dua game: `src/games/glass/evidence/arena-validation-report.json` (path dari root repo). Tidak ada klaim acceptance fisik, benchmark atau balancing manusia sudah selesai. Tidak melakukan commit/push atau restart deployment.


## Video gameplay setelah revisi arena

Video terbaru, poster validasi dan salinan panduan tersedia di **`~/Videos/Soforia`**, di luar repository. Nama video memakai timestamp sehingga riwayat tidak ditimpa. Metadata/penanda waktu kecil ada di `evidence/video-arena-review-report.json` dan `evidence/VIDEO-ARENA-REVIEW.md`.

Jam Berulang: **505,375 detik, 12.129 frame, enam bab**, 1280×720/24 fps tanpa audio. Seluruh kampanye arena baru selesai berurutan melalui input/aksi asli, **semua distrik pada 1×**, dengan jeda penjelasan yang menahan simulasi. Video riwayat sebelum revisi tetap dipertahankan di folder yang sama.

Decode seluruh video, metadata/frame count dan pemeriksaan visual dua frame hasil encode lulus; browser tidak mencatat error atau request internet. Tes scope (37 Kaca + 17 Jam Berulang), check, build dan docs lulus. Scope workspace masih terhalang tujuh change note gabungan; subset architecture tugas video divalidasi terpisah. Video ini memakai pemain sintetis yang mengetahui solusi; bukan playtest manusia, dua HP fisik, benchmark realtime atau bukti balancing sudah layak. Tidak mengubah aturan gameplay/deployment pada tugas perekaman ini.
