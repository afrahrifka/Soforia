# Status Kaca Berdua

Scope: `game:glass`. Revisi 16 November 2026.

60 stage kini mempunyai **60 siluet arena authored, 882 encounter dari 22 jenis, dan 246 checkpoint**. Total encounter per stage naik menurut bab: **10 → 12 → 14 → 16 → 23**, bukan prefix 2/3/4/5 yang sama di semua stage. Melewati satu rintangan tidak langsung menyimpan progres. `threadHop`, `threadBridge`, dan `threadHammer` menggabungkan satu baris pembawa/guling dengan lompatan terpisah, beberapa pijakan sempit atau sapuan palu. Segmen lanjut menambah ambang/celah di encounter gabungan, bukan sekadar memindahkan satu blok.

Pembatas `boundary` generik dihapus: rumah berimpit, gudang, kelompok batu/pohon, mesa, es dan kristal menjadi penghalang bioma yang benar-benar mempunyai collider. Pohon tidak dijadikan deretan batang kotak yang menutupi layar; batas hutan menggabungkan batu tertanam, kanopi dan pohon tambahan. Tikungan lebih lapang dan ujung objek dekat dermaga tidak menutup jalur. Semua pecah tetap karena kontak fisik; tidak ada derajat wajib, banner aturan, mode mudah/sulit, atau penghitung jarak stage. Checkpoint akhir tetap memindahkan stage langsung.

Map yang lebih panjang memakai indeks kandidat collision/proyeksi dan mesh tanah/jalan per chunk agar bagian jauh dapat di-frustum-cull. Ini bukan bukti FPS. Kontrak dan program dashboard/game lain tidak diubah. Dashboard sudah dicommit terlebih dahulu pada `b7a9238`.

Bukti sebelum revisi arena ini: seluruh 60 stage/246 checkpoint dan 68 tes. Hasil tersebut tidak otomatis membuktikan revisi arena baru. Tes baru memeriksa rangkaian, pemulihan checkpoint, gabungan lompat/guling melalui geometri, dan kesetaraan kandidat collision dengan kontak geometri penuh. Bukti rute: evidence/kaca-authored-course-report.json; fixture visual: evidence/kaca-authored-visual-report.json. Bukti akhir dan batas: evidence/kaca-chain-report.json. Referensi visual resmi dan keputusan desain: DESIGN.md.

Titik lanjut: playtest pasangan untuk durasi rangkaian, transisi formasi, keadilan benturan dan kemiringan yang terasa alami; uji keyboard fisik/dua HP dan ukur GPU/frame time/input-to-photon. Simulasi tidak membuktikan keseruan atau acceptance perangkat fisik. Laporan revisi 22 dan bukti lama merupakan riwayat, bukan bukti seluruh rancangan baru.


## Revisi arena lintas dua game — 16 November 2026

Diotorisasi pengguna dalam scope architecture untuk Kaca dan Jam Berulang. Penulisan tetap pada folder masing-masing game dan roadmap; host/shared, dashboard, sistem dan deployment tidak diubah. Pekerjaan Kaca yang sudah ada di workspace dipertahankan.

Mengganti pemilihan 12 jalur dengan 60 profil arah; tinggi, ritme penempatan encounter dan kombinasi rangkaian berubah per level. Tiga mesin baru — iris bintang, bilah gunting dan dinding bernapas — mempunyai bukaan dan kontak fisik yang dapat diperiksa. Plaza tikungan disiapkan untuk mengubah formasi; massa tepi yang memotong jalur digeser tanpa menghapus bentuk collider. Footprint badan terhadap batu/daun menggunakan lingkaran pada irisan tinggi tubuh agar jalan diagonal tidak dijepit kotak tubuh buatan. Uji negatif tetap menuntut guling/lompat/angkat, tidak membiarkan pelebaran jalan menjadi bypass.

Atlas seluruh arena: `evidence/arena-atlas.svg` dan PNG. Fixture sembilan scene termasuk tiga mesin baru: `evidence/arena-design-report.json`. Pose screenshot adalah sintetis; bukan bukti perjalanan. Laporan perjalanan final harus berasal dari hash source yang sama pada ketiga rentang 1–20, 21–40 dan 41–60 sebelum digabung oleh `tools/audit-arenas.mjs` ke `evidence/arena-progression-report.json`.

Peningkatan hitungan dan keunikan geometri bukan bukti keseruan. Titik lanjut tetap playtest pasangan untuk rasa asing tiap zona, panjang rangkaian, jendela aman, komunikasi, kamera dan keadilan retry, serta pengukuran perangkat fisik. Video review tetap di `~/Videos`; tidak menambah video ke repo.


## Verifikasi akhir revisi arena

- **37 tes Kaca dan 17 tes Jam Berulang lulus (54 tes scope)**; check/TypeScript, build dan docs lulus.
- Kaca: **60 stage/246 checkpoint** pada hash source yang sama lulus input/aksi tanpa teleport/kekebalan; enam kontrol negatif analog saja terhalang. Tiga rentang digabung dan diverifikasi oleh `audit-arenas.mjs`.
- Preview: atlas 60 siluet dan sembilan scene Kaca, enam scene Jam Berulang, controller portrait/landscape, tanpa error JavaScript atau request internet.
- `npm test` gabungan belum hijau: satu tes platform pada `tests/platform/server.test.ts:30` mengasumsikan left dari Orbit menuju Glass. Katalog kini berakhir pada Jam Berulang; run ulang tes platform mereproduksi kegagalan yang sama (8/9 lulus). Tes tersebut dan program platform tidak diubah dalam perombakan arena ini.
- `check:scope --working` tetap gagal karena enam change note workspace gabungan; validasi subset architecture untuk dua folder game, roadmap dan catatan tugas ini lulus. Lima catatan sudah ada sebelum tugas. Review pemelihara tetap diwajibkan policy architecture.

Ringkasan perintah, hash source dan keterbatasan lintas dua game: `src/games/glass/evidence/arena-validation-report.json` (path dari root repo). Tidak ada klaim acceptance fisik, benchmark atau balancing manusia sudah selesai. Tidak melakukan commit/push atau restart deployment.


## Video gameplay setelah revisi arena

Video terbaru, poster validasi dan salinan panduan tersedia di **`~/Videos/Soforia`**, di luar repository. Nama video memakai timestamp sehingga riwayat tidak ditimpa. Metadata/penanda waktu kecil ada di `evidence/video-arena-review-report.json` dan `evidence/VIDEO-ARENA-REVIEW.md`.

Carry the Glass: **302,625 detik, 7.263 frame, 24 bab**, 1280×720/24 fps tanpa audio. Montase mencakup **13 stage sampel dan seluruh 22 jenis rintangan**, termasuk enam bioma, tiga mesin baru dan rangkaian akhir. Tiap stage sampel dijalankan utuh dari spawn sampai selesai tanpa teleport/kekebalan. Jumlah tick identik dengan audit untuk seluruh 13 stage. Video memotong sebagian perjalanan antar-bab; cuplikan bergerak 1× dan pengantar menahan waktu 1,5 detik. Bukan video seluruh kampanye 60 stage.

Decode seluruh video, metadata/frame count dan pemeriksaan visual dua frame hasil encode lulus; browser tidak mencatat error atau request internet. Tes scope (37 Kaca + 17 Jam Berulang), check, build dan docs lulus. Scope workspace masih terhalang tujuh change note gabungan; subset architecture tugas video divalidasi terpisah. Video ini memakai pemain sintetis yang mengetahui solusi; bukan playtest manusia, dua HP fisik, benchmark realtime atau bukti balancing sudah layak. Tidak mengubah aturan gameplay/deployment pada tugas perekaman ini.

## Pacing setelah keluhan map monoton — 16 November 2026

Scope `game:glass`, fokus `src/games/glass/` dan satu change note baru. Tidak mengubah Jam Berulang, host, shared atau roadmap pada tugas ini; perubahan sebelumnya di workspace dipertahankan.

- Seluruh 60 stage memakai jarak berdasarkan footprint + kebutuhan transisi, menggantikan interval seragam 20–28 unit. Tidak mempercepat gerak pemain. Jumlah encounter tetap 882 dan checkpoint 246.
- Tiga tantangan tambahan membawa variasi aksi menjadi 25 jenis: slalom tiga bukaan, rak dengan pergantian sisi tinggi-rendah, dan jembatan putar dengan dermaga datar. Pemulihan setelah lorong satu baris dipisahkan dari jeda palang biasa. Checkpoint menunggu kedua pembawa melewati volume terakhir.
- Perbandingan final: rata-rata panjang 398,98 → 213,16 unit (**−46,6%**); jarak kosong rata-rata 347,53 → 158,60 (**−54,4%**); bentang kosong terpanjang 40,32 → 20,74 (**−48,6%**). Ruang antar panel slalom/rak tetap dihitung sebagai kosong; envelope mesin diambil dari empat fase. Ini jarak geometri, bukan durasi atau bukti keseruan manusia.
- Bukti perjalanan aktif: `evidence/pacing-progression-report.json`, menggabungkan tiga rentang pada hash yang sama: **60/60 stage, 246 checkpoint, nol pecah**, ditambah enam kontrol negatif analog saja terhalang. Pengendali mengetahui peta dan merencanakan fase; bukan manusia atau dua HP fisik.
- Bukti visual: `evidence/pacing-atlas.svg`/PNG, 12 fixture renderer dan `evidence/pacing-design-report.json`. Fixture memakai pose sintetis, bukan perjalanan. Perbandingan geometri: `evidence/pacing-before.json` dan `evidence/pacing-comparison.json`.
- Video review arena terdahulu tetap merupakan bukti desain lama. Tidak membuat video baru atau menaruh video dalam repo pada tugas ini; tool rekam disesuaikan dengan 25 jenis dan tetap menulis ke `~/Videos/Soforia`.

Hasil pemeriksaan akhir dicatat dalam `evidence/pacing-validation-report.json`. Playtest pasangan masih diperlukan untuk menilai durasi pergantian pegangan, keterbacaan bentuk, waktu tunggu dan rasa menantang. Kelulusan otomatis tidak menyatakan balancing manusia telah diterima.
