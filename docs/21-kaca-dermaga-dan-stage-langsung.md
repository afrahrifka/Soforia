# 21 — Dermaga dan stage langsung

Revisi 15 November 2026 mengikuti permintaan perpindahan stage tanpa proses konfirmasi dan melanjutkan perbaikan map.

## Perilaku bermain

Kedua pembawa masuk checkpoint akhir dengan kaca utuh: tick itu juga mengaktifkan stage berikutnya dan posisi awal tim. Tidak ada tombol lanjut, persetujuan pasangan, countdown, overlay selesai stage atau jeda transisi. Stage 60 tetap mengakhiri permainan ke hasil akhir. Penghitung checkpoint, rasio stage/total dan indikator jarak/progres stage dihapus dari tampilan; HUD hanya menampilkan lokasi dan jumlah kaca pecah. Checkpoint internal tetap dipakai untuk retry.

Pergantian stage tidak membangun ulang DOM controller sehingga analog/tombol yang masih ditahan tidak kehilangan pointer capture. Kamera dan interpolasi snapshot memotong langsung ke map baru; tidak meluncur melintasi ruang antara dua map. Identitas scene tetap mengikuti stage agar renderer membuang dunia lama dan membangun dunia berikutnya.

## Perbaikan map

Masalah stage 32 ditelusuri ke pendekatan jalan yang membelok pada sisi dek serta pagar platform yang dapat memasuki badan dari samping. Lintasan sekarang mempunyai bagian dermaga lurus dengan transisi kurva halus sebelum/sesudahnya. Jarak lintasan dihitung ulang setelah perubahan bentuk, sehingga checkpoint, kamera dan posisi rintangan tetap mengikuti panjang busur yang benar.

Area sapuan platform maju/menyamping/lift dibebaskan dari tiang, pohon, batu dan rumah; kabel tidak menjembatani celah antar-tiang yang terlalu jauh akibat pembersihan tersebut. Benda lingkungan tetap padat di luar area mesin. Jika pagar bergerak memasuki badan, koreksi penetrasi lingkaran/kotak mengembalikan badan ke permukaan kontak terdekat dengan pemeriksaan benda lain; pemain dapat bergerak lagi. Ini tidak menambahkan kekebalan kaca atau syarat kemiringan.

## Verifikasi

- TypeScript, build offline dan **47 tes** lulus. Regresi mencakup perpindahan otomatis seluruh 60 titik akhir, input aktif pada tick berikutnya, akhir permainan, hitungan pecah/progres tersimpan, serta badan yang tertabrak pagar bergerak.
- [60 rute / 240 checkpoint](evidence/kaca-winding-course-report.json) lulus input sintetis dengan nol kaca pecah. Pengendali mengetahui map dan memprediksi waktu rintangan; tanpa teleport/kekebalan. Stage 32 sekarang lulus. Ini bukan ukuran kesulitan manusia.
- [Fixture browser transisi](evidence/kaca-instant-stage-report.json) memeriksa perpindahan dalam satu tick, HUD tanpa penghitung, tombol aksi langsung tersedia serta frame dunia lama tidak diinterpolasi. Penempatan awal dekat akhir stage merupakan fixture sintetis, bukan bukti menempuh lintasan melalui browser.
- [Keyboard browser](evidence/glass-keyboard-report.json) dan [dua controller browser](evidence/glass-direction-report.json) mencatat cakupan sebenarnya. Pemeriksaan pointer saat stage berubah memakai fixture snapshot client; tidak mengklaim penuntasan lintasan server dengan dua HP.

Playtest pasangan pada dua HP fisik, kenyamanan perpindahan/camera cut dan benchmarking frame time/input-to-photon tetap belum lulus acceptance. Pergantian scene masih memerlukan pekerjaan CPU/GPU; penghapusan layar transisi tidak dianggap bukti tanpa stutter pada perangkat nyata.

Map, bioma dan tingkat tantangan pada checkpoint ini telah dirombak berdasarkan playtest pengguna; lihat [rangkaian tantangan dan audio](22-kaca-tantangan-dan-audio.md). Perpindahan stage langsung tetap berlaku. Hasil 60 rute lama bukan bukti kualitas map baru.
