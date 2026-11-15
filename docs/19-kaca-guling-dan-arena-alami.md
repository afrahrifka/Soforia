# 19 — Kaca berguling dan arena alami

> Riwayat revisi: aturan sudut, tekanan/jangkauan, yaw tetap dan lintasan pada dokumen ini telah digantikan [revisi kontak fisik dan perjalanan](20-kaca-perjalanan-dan-kontak-fisik.md).

Revisi 15 November 2026 mengikuti klarifikasi pengguna. Bagian ini **menggantikan putaran pada bidang XY** yang dijelaskan pada laporan sebelumnya.

## Gerak kaca

Kaca awalnya mendatar di antara kedua pembawa. Putar kiri/kanan menggulingkan permukaan pada **sumbu panjang yang menghubungkan kedua pembawa**, seperti benda telentang yang berguling. Posisi tengah pegangan kiri dan kanan tidak bertukar tinggi akibat tombol putar. Putaran dapat diteruskan melewati 360°, dibalik arah, dan berhenti ketika tombol dilepas.

Naikkan/Turunkan merupakan aksi terpisah. Mengangkat satu pembawa menaikkan sisi pegangannya; mengangkat bersama menaikkan pusat kaca. `pane.roll` menyimpan sudut guling kontinu, `pane.slope` kemiringan akibat perbedaan tinggi pegangan, dan yaw tetap nol. Kaca mendatar pada 0°/180° dan tegak pada 90°/270°.

Empat sudut, empat tangan dan collision memakai transformasi yang sama. Model memakai urutan rotasi ZYX: kemiringan pegangan lalu guling pada sumbu panjang. Interpolasi snapshot juga mencakup slope. Satu tepi bingkai berwarna ungu agar gerakan berbalik mudah terlihat.

Kontrol HP: **Putar kiri / Putar kanan**, Naikkan/Turunkan dan Lompat. Keyboard developer tetap **Q/E** untuk A, **U/O** untuk B, **R/F** serta **I/K** untuk tinggi. Tidak menambahkan pemilih stage atau mode kesulitan ke controller biasa.

## Badan dan benda padat

- Radius badan 0,34 unit; tinggi berdiri 1,67 unit dan menyesuaikan posisi merunduk model.
- Gerak dibagi menjadi langkah maksimal 0,08 unit, kemudian diselesaikan per sumbu untuk bergeser sepanjang tembok. Gerak diagonal tidak melompati tembok tipis.
- Tarikan lengan dan dorongan antar pemain memakai jalur gerak aman yang sama. Balok bergerak atau overlap awal mengeluarkan badan ke sisi terdekat.
- Tembok, batang pohon, batu, gedung, kerucut penanda dan tiang memakai deskriptor posisi/ukuran bersama untuk collision dan render. Batas batu memakai kotak pembatas konservatif; daun merupakan dekorasi di atas batang.
- Empat batang bingkai 3D memakai profil ukuran bersama pada render dan collision badan. Collision kaca terhadap benda padat memakai pengujian kotak berorientasi 3D (SAT), termasuk bentang kedalaman ketika kaca mendatar.
- Kaca tetap dapat pecah akibat tanah, rintangan, tekanan dua badan dan jangkauan lengan. Kontak tanah memperhitungkan ketebalan kaca. Tidak menambahkan kekebalan spawn atau teleport untuk meluluskan rute.

Bingkai tantangan sekarang menunjukkan bidang 3D sesuai sudut guling tujuan. Atur sudut, posisi dan tinggi sebelum melintas. Toleransi pengukur orientasi 0,13 radian, dihitung modulo setengah putaran karena bidang kaca yang dibalik mempunyai bentuk geometris sama. Ini aturan tantangan eksplisit, bukan simulasi rigid-body lengkap.

## Lingkungan

| Stage | Lingkungan |
|---|---|
| 1–10 | Jalan Kota: aspal, marka, tembok beton dan gedung |
| 11–20 | Hutan Pinus: jalur tanah, bukit dan batang pohon padat |
| 21–30 | Jalan Pegunungan |
| 31–40 | Hutan Senja |
| 41–50 | Lembah Asteroid: permukaan batu, bongkah, planet dan bintang |
| 51–60 | Kawah Bulan |

Tanah jalur umumnya selebar 60 unit, tersambung ke lapisan bumi di bawahnya. Jalan/jalur tanah mengikuti tinggi permukaan fisik. Awal dan akhir tanah diperpanjang agar kamera tidak menghadap ujung papan. Fondasi rangka, kaki papan melayang dan derek dekoratif versi sebelumnya dihapus. Celah dan jembatan tertentu tetap merupakan rintangan melintasi air/retakan, dengan tanah di sekelilingnya.

Lingkungan memakai geometri prosedural orisinal proyek: gedung, tembok, pinus, batu bersegi, marka dan planet. Tidak mengimpor aset/kode portofolio atau aset pihak ketiga baru. Kamera perspektif otomatis diturunkan agar lingkungan dan langit terlihat. Tidak menambahkan kontrol kamera manual.

## Verifikasi dan batas

TypeScript/build dan **53 tes unit/integrasi** lulus. Tes mencakup guling 360°, pemisahan guling dari angkat, kecocokan transformasi render/collision, empat tangan, tembok tipis, diagonal, tarikan, batang pohon, batu, bingkai serta benda bergerak. **60 stage / 240 checkpoint** lulus simulasi input dengan pengetahuan peta tanpa teleport: [laporan rute](evidence/kaca-grounded-course-report.json).

Pengendali rute sintetis diperbarui untuk menjaga lebar formasi saat berguling, melewati seluruh kedalaman bingkai sebelum mengubah formasi, dan menunggu jendela aman balok ayun. Penyesuaian pengendali ini tidak menurunkan collision atau memberi kekebalan pada game.

Bukti browser dan visual:

- [Keyboard dan kontak dinding](evidence/glass-keyboard-report.json).
- [Dua controller browser: putar dan angkat](evidence/glass-direction-report.json).
- [Inspeksi visual enam dunia](evidence/kaca-grounded-visual-report.json).
- [Jalan kota](evidence/kaca-grounded-road.png), [hutan](evidence/kaca-grounded-forest.png), [asteroid](evidence/kaca-grounded-space.png).
- [Guling 45°](evidence/kaca-guling-45.png), [guling 90°](evidence/kaca-guling-90.png), [kontak karakter dengan tembok](evidence/kaca-grounded-wall-contact.png).

Inspeksi visual memakai fixture, uji controller memakai input browser sintetis. Keduanya bukan dua HP fisik, playtest kenyamanan/keseruan atau pengukuran FPS/input-to-photon. Evaluasi manusia tetap diperlukan untuk rasa guling, kamera, kepadatan rintangan, toleransi bingkai dan balancing. Status checkpoint fisik tetap belum lulus.
