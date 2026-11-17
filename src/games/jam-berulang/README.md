# Jam Berulang

Implementasi modular [issue #41 — G55](https://github.com/oskhar/Soforia/issues/41). Dua penjaga waktu memulihkan enam distrik kota yang terjebak pada satu menit. Server laptop menjalankan aturan; HP A menjadi Pelari, HP B menjadi Perencana. Seluruh aset, teks dan audio tersedia lokal setelah build.

## Bermain

1. Dari katalog pilih **Jam Berulang**, buka tutorial, lalu siap melalui controller. Mulai dengan satu controller tetap mengikuti kebijakan host; teka-teki bergema memerlukan Perencana kedua, tidak ada bot.
2. A memakai analog untuk berjalan. Dekati roda `a/b/c`, tekan **Ambil / pasang**. Dekati `E` setelah tiga roda terkumpul untuk menyelesaikan distrik. Roda tersimpan melewati loop; tidak bisa diambil dua kali.
3. Pada distrik dengan `P`, A berjalan ke pelat tersebut. B menekan **Kunci rekaman**, lalu **Ulang menit**. Rekaman yang terkunci tidak dapat dilanjutkan di tengah menit: ini mencegah gerak yang tidak direkam menjadi jejak palsu.
4. B menekan **Putar jejak**. Gema memutar posisi yang benar-benar direkam dan menetap di posisi terakhir. Ketika gema berada di `P`, `G` dapat terbuka. `Q` berpasangan dengan `H`, `R` dengan `I`.
5. A menyeberangi gerbang ketika terbuka. Gerbang langsung terkait permanen, termasuk pada loop selanjutnya. Untuk gerbang kedua, buat rekaman baru di Q. B dapat memilih empat jejak terbaru dengan **Ganti jejak**.
6. Analog B menelusuri pratinjau posisi di garis waktu, bukan menggerakkan A atau mengubah waktu simulasi. Tombol 0/15/30/45/60 detik menyediakan akses langsung; **Tandai waktu** menyimpan sampai 12 tanda pada menit berjalan. Lingkaran di kota menunjukkan pratinjau; karakter tembus pandang berlabel GEMA adalah replay yang memengaruhi pelat.

Mode santai tidak mempunyai deadline atau batas loop, dan menit hanya diulang ketika B meminta. Jendela gerbang mengulang setiap 60 detik; menunggu tidak menghilangkan progres. Mode non-santai otomatis mengulang pada 60 detik. Sasaran tantangan tiga loop, dinaikkan menjadi empat pada final yang memerlukan tiga rekaman; mode non-santai lain empat. Melebihi sasaran tetap mengizinkan penyelesaian dengan satu bintang. Kebijakan tanpa softlock diprioritaskan terhadap game over. Tidak ada menu mode/stage baru pada controller biasa.

Jeda dan Home menggunakan utilitas host. Putus koneksi menetralkan input lewat host dan tidak menghapus progres atau menghentikan simulasi. Rekaman hanya memuat posisi Pelari dan label aksi dalam sesi; tidak merekam layar, suara, identitas atau data perangkat. Main lagi membuat sesi permainan baru.

## Kampanye authored

Enam arena kini berbeda ukuran dan topologi: cincin dermaga, kepulauan, akuaduk tapal kuda, orbit bercabang, arsip jam pasir dan spiral empat pulau. Rincian bentuk, urutan kunci, fase dan alasan peningkatan kesulitan ada pada [ARENAS.md](ARENAS.md).

P/Q/R mengendalikan G/H/I. Arena lanjut menambahkan pelat yang perlu ditahan, sekat V, jembatan pulsa = dan jarum bergerak. Perencana membaca fase melalui HUD/timeline dan memilih kapan mengulang/memutar jejak. Sekat menolak masuk saat tertutup, tetapi tetap mengizinkan keluar. Gerbang dan inventaris persisten mencegah softlock ketika arsip diganti.

Satu sel 0,8 unit render. Sel kosong, #, ~ dan T padat/tidak dapat dilalui. Roda a/b/c hanya diambil Pelari; gema tidak mengulang mutasi inventaris. Sasaran durasi manusia belum diukur.

## Berkas dan bukti

- `levels.ts`: denah, palet, petunjuk dan jendela waktu tiap distrik.
- `server.ts`: state loop, replay interpolasi, collision, inventaris, hasil dan proyeksi state.
- `console.ts` dan `scenery.ts`: kota perspektif dengan 29 model KayKit CC0, paving PBR Poly Haven, bangunan yang mengikuti footprint collision, kanal, jam, roda, gerbang, karakter membulat, gema dan pratinjau; primitive statis diinstansikan per material.
- `controller.ts`: dua peran, garis waktu HP, pembaruan lokal yang menjaga pointer analog.
- `audio.ts`: nada jam dan akor perpindahan distrik hasil sintesis lokal orisinal.
- [DESIGN.md](DESIGN.md): keputusan dan referensi yang dapat diperiksa.
- [ASSETS.md](ASSETS.md): sumber, lisensi dan inventaris aset.
- [STATUS.md](STATUS.md): hasil pemeriksaan dan batas penerimaan.
- [evidence/report.json](evidence/report.json): solver, render dan fixture controller; PNG enam distrik serta dua ukuran HP berada di folder yang sama.

```sh
npm test -- --scope game:jam-berulang
npm run check
npm run build
node src/games/jam-berulang/tools/check-assets.mjs
node --import tsx src/games/jam-berulang/tools/preview.mjs
npm run check:scope -- --working
```

Alat preview memerlukan Chromium lokal (`PLAYWRIGHT_CHROMIUM_EXECUTABLE`, default `/usr/sbin/chromium`). PNG memakai state sintetis tanpa credential sesi. Ini bukan acceptance dua HP fisik, benchmark atau bukti keseruan. Tidak mengubah deployment, port, host atau game lain.

## Video review developer

Untuk menghasilkan video MP4 dari renderer dan server asli:

```sh
npm run build
node --import tsx src/games/jam-berulang/tools/record-review.mjs
```

Memerlukan Chromium, `ffmpeg` dengan libx264 dan `ffprobe`. Output video terbaru langsung di `~/Videos/Soforia/jam-berulang-arena-review-<timestamp>.mp4`, beserta poster per distrik. Metadata, bab dan hasil validasi terbaru ada di `evidence/video-arena-review-report.json`; penanda waktu di `evidence/VIDEO-ARENA-REVIEW.md`. Video lama dipertahankan sebagai riwayat.

Enam distrik diselesaikan melalui input analog/aksi, seluruhnya pada kecepatan 1×. Jeda penjelasan membekukan simulasi. Video render offline 24 fps tanpa audio ini bukan pengukuran performa realtime atau playtest manusia. Label A/B dan status gerbang membantu review mekanik; koordinat memakai satuan sel peta. Seluruh MP4 utama/temporer berada di luar repository.
