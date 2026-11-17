# Derek Angkasa — G36 / issue #22

Implementasi [Soforia #22](https://github.com/oskhar/Soforia/issues/22), scope `game:derek-angkasa`. Dua operator merakit tiga modul dengan lengan robotik dan propulsi dalam simulasi 2.5D. **12 misi authored, enam zona, 36 pemasangan per mode**; mode santai dan tantangan. Game berjalan offline setelah build, dengan aturan otoritatif di laptop dan dua controller browser HP.

## Cara bermain

1. Masuk dari katalog seperti game lain, tekan Siap di kedua HP. Di briefing, A memilih misi dan Mulai santai / Mulai tantangan. Analog dapat memutar pratinjau.
2. A mendekatkan ujung capit ke fixture emas di atas modul. A membaca **jarak** pada HP-nya. B membaca **selisih sudut tangkap** pada HP B dan memutar modul dengan analog kiri/kanan. Rem meredam putaran dan drift.
3. A menekan **Tutup / buka capit** setelah cukup dekat; tangkapan tidak menempel jika sudut/kecepatan belum aman. Setelah mengunci, A membawa modul ke port bernomor yang menyala. Tahan **Gerak pelan** untuk presisi.
4. B menyelaraskan **sudut pasang**, yang dapat berbeda dari sudut tangkap. Dorong/mundur mengikuti arah moncong modul, bukan arah layar. Gunakan impuls singkat, kemudian Rem.
5. A menekan **Siapkan pasang**. Kedua operator menyelaraskan dan mendiamkan modul; B menahan **Rem**. Cincin mengisi hanya saat posisi, sudut, kecepatan dan capit memenuhi syarat. Tiap pemasangan memulihkan bahan bakar.
6. **Panggil tug servis** selalu dapat memulihkan modul aktif; modul terpasang tetap aman. Bahan bakar kosong juga memicu servis setelah lima detik. Tidak ada kerusakan permanen atau game over.
7. Setelah tiga modul terpasang, hasil tampil sebagai **showcase interaktif**. Kedua analog dapat memutar/memiringkan stasiun. A memilih misi berikut, rakit konfigurasi baru, atau Selesai menuju hasil host.

Santai tidak mempunyai deadline. Tantangan memberi 75 unit propelan per modul (santai 100) dan target waktu 7–9 menit menurut misi; target lewat tetap boleh lanjut. Angka 6–9 menit pada issue adalah sasaran playtest manusia, **belum acceptance durasi**. Bot map-aware menyelesaikan ronde jauh lebih cepat. Lihat nilai aktual dan batas pada [STATUS](STATUS.md).

## Peta dan tingkat kesulitan

| Misi | Bentuk map / pekerjaan utama |
|---|---|
| 01 Tangkapan Fajar | Dermaga terbuka untuk belajar menangkap, memindah, mengerem dan memasang |
| 02 Garpu Helios | Dua cabang radiator; pilih sisi yang cukup lebar untuk panel surya |
| 03 Pelabuhan Sabit | Batu membentuk perjalanan melengkung dengan ruang putar di luar sabit |
| 04 Celah Gerhana | Lorong dua radiator dan pendekatan lintang |
| 05 Dermaga Kembar | Jalur asimetris, reaktor lebih berat dan koreksi drift lebih awal |
| 06 Kelopak Aurora | Tiga sirip diagonal menutup pintasan ke simpul pusat |
| 07 Jarum Cincin | Dua gantri menyapu perlahan, dengan kantong tunggu di tepinya |
| 08 Tangga Meridian | Empat sirip berselang untuk slalom dan perubahan arah pendekatan |
| 09 Jembatan Retak | Pecahan es dengan ukuran berbeda dan kantong putar muatan berat |
| 10 Sabuk Pelintas | Batu dan dua sapuan dengan fase berbeda |
| 11 Mandala Observatorium | Tiga port diagonal, teleskop dan array dengan sudut tangkap/pasang berbeda |
| 12 Mahkota Bersama | Gabungan radiator/batu/sapuan, tiga massa dan toleransi terkecil |

[Atlas 12 map](evidence/map-atlas.svg) memperlihatkan spawn, port dan rintangan. Garis putus adalah relasi asal–port, **bukan rute solusi**. Level lanjut memperketat sudut pasang 12°→6,5°, memperpanjang penguncian 1,4→2,3 detik dan menambah massa/gantri; bukan sekadar menambah nomor pada layout yang sama.

## Mode developer keyboard

F2 mengaktifkan dua slot keyboard lewat host; F3 melepasnya. A: WASD, Shift pelan, F capit, G pasang, R servis. B: ←/→ putar, ↑/↓ dorong/mundur, Spasi rem. Briefing: 1 santai / 2 tantangan, N berikut / B sebelumnya. Showcase: analog untuk meninjau, Z rakit ulang, N misi berikut, X selesai, V pulihkan kamera. P tetap Jeda host; Home kembali katalog. Ini alternatif pengujian, bukan klaim dua HP fisik.

## Struktur dan verifikasi

`maps.ts`: authoring per misi; `physics.ts`: footprint OBB/lingkaran; `server.ts`: capit, integrasi, docking, bahan bakar, recovery, snapshot publik/privat. `console.ts`/`models.ts`: render, IK lengan, aset dan lifecycle; `controller.ts`/`hud.ts`: informasi dua peran; `audio.ts`: ambient dan foley orisinal; `client.ts`: lifecycle/keyboard.

```sh
npm test -- --scope game:derek-angkasa
npm run check
npm run build
node --import tsx src/games/derek-angkasa/tools/course-check.mjs
node --import tsx src/games/derek-angkasa/tools/course-check.mjs --challenge
node --import tsx src/games/derek-angkasa/tools/audit.mjs
node src/games/derek-angkasa/tools/check-assets.mjs
node --import tsx src/games/derek-angkasa/tools/preview.mjs
node --import tsx src/games/derek-angkasa/tools/lan-check.mjs
npm run check:docs
npm run check:scope -- --working
```

Bukti baru disimpan dalam `evidence/` milik game. Semua video review, bila dibuat, wajib di **`~/Videos/Soforia`**, bukan repo. Aset baru hanya tiga GLB terpakai sekitar 60 KiB, dengan lisensi dan checksum pada [inventaris](assets/inventory.json). Sumber teknis, pemetaan referensi dan keterbatasan fisika: [REFERENCES](REFERENCES.md). Matriks kebutuhan dan keputusan level: [DESIGN](DESIGN.md). Tidak memodifikasi host, dashboard, game lain atau deployment.
