# 09 — Roadmap dan checkpoint

## Status saat ini

14 November 2026: **beta 0.1.0-beta.3 sudah diimplementasikan**: server LAN, dua controller HP, tiga game, UI konsol, reconnect dan distribusi offline. **1 dari 11 checkpoint Lulus**, yang lain Dikerjakan/Menunggu sesuai bukti. Rincian dan batas: [laporan beta](11-implementasi-beta.md). Kelulusan penuh memerlukan dua HP fisik dan pengukuran performa; uji browser bukan penggantinya.

Prioritas pengguna: konsol lokal open-source dengan controller HP dan rekomendasi terutama untuk couple. Portofolio hanya referensi visual. Tiga game target v0.1: Orbit Berdua, Kebun Berdua, Seirama. Dapur Berdua berikutnya.

## Checkpoint implementasi

| ID | Hasil | Gerbang penerimaan | Status |
|---|---|---|---|
| CP-01 | Fondasi workspace dan server lokal | Dependency dikunci; build UI/server; health dan pilihan IP/port bekerja tanpa mengganggu deployment lain | Lulus |
| CP-02 | Pairing dan sesi dua controller | QR otomatis/manual, display read-only, host, auth, schema protokol lengkap, timeout/resume, tes integrasi | Dikerjakan |
| CP-03 | Prototipe input dan metrik | Dua HP nyata, pad vs tombol diuji, input netral, baseline RTT/FPS/sentuh-ke-gambar dan keputusan kelayakan | Dikerjakan |
| CP-04 | Launcher dan controller final dasar | Katalog, siap, tutorial, pause, hasil, layout dinamis dan navigasi penuh dari HP | Dikerjakan |
| CP-05 | Orbit Berdua | Seluruh aturan G01, tiga arena, tes dua HP dan performa | Dikerjakan |
| CP-06 | Kebun Berdua | Seluruh aturan G02, panen atomik, pause growth, playtest pasangan | Dikerjakan |
| CP-07 | Seirama | 40 soal, delapan ronde, private projection, reveal/skip/reconnect dan tes kebocoran | Dikerjakan |
| CP-08 | Pemulihan, offline dan aksesibilitas | Matriks gangguan dan WAN-off, reset/persistence, reduced motion dan safe area | Dikerjakan |
| CP-09 | Hardening dan acceptance couple | Semua target performa, soak 2 jam, tiga pasangan, bug penghalang selesai | Dikerjakan |
| CP-10 | Distribusi open-source | Lisensi diputuskan, inventaris aset, source/lockfile/runbook, artifact/checksum dan OS matrix | Dikerjakan |
| CP-11 | Rilis v0.1 | Semua FR/NF punya bukti, known issues, checklist rilis dan artifact reviewable | Menunggu |

Urutan CP-01→02→03 membuktikan koneksi sebelum investasi katalog/game. CP-04 memakai hasil CP-03. CP-05/06/07 memerlukan kontrak modul dan engine stabil. CP-08 mengonsolidasikan recovery yang sudah ada sejak CP-02, bukan menundanya hingga akhir. CP-09–11 memerlukan semua game lulus. Tidak ada estimasi hari yang dianggap komitmen sebelum baseline CP-03.

## Ekspansi setelah v0.1

E01: Dapur Berdua. E02: Jembatan Cahaya dan Piknik Puzzle. E03: Rally Mini dan Paket untuk Kita. E04: Lukis & Tebak. Ritme Senja menunggu kalibrasi latency/audio; Bola Duo dan Benteng Berdua menunggu balancing/AI. Empat pemain dan native installer dipertimbangkan terpisah setelah dua pemain stabil. Urutan dapat diubah berdasarkan playtest.

## Titik lanjut

Lanjutkan penerimaan CP-03 dengan dua HP fisik dari paket offline. Uji kontrol dan reconnect, ukur RTT/FPS dan sentuh-ke-gambar sesuai protokol. CP-02 masih membutuhkan schema formal/tes hardening lebih luas; CP-04–08 memerlukan acceptance fisik/game; CP-09 soak/playtest; CP-10 matriks distribusi OS dan audit akhir. CP-11 Menunggu semua gerbang. Tidak ada perubahan deployment lain.

## Riwayat

- 2026-11-14: membuat folder proyek baru dan spesifikasi terpisah dari portofolio. Menambahkan fokus couple, 12 rekomendasi, aturan rinci tiga game awal, UX, arsitektur, protokol, data, privasi, offline, pengujian, keputusan dan roadmap. Belum ada implementasi/tes runtime.

- 2026-11-14: implementasi beta dapat dimainkan: TypeScript/Node/Canvas, QR/approval, Orbit/Kebun/Seirama, kontrol mobile, timeout/reconnect, privasi dan paket runtime Linux offline. Build/check, 8 tes unit/integrasi, E2E tiga game tanpa request luar, serta smoke paket terisolasi menjadi bukti otomatis. Acceptance dua HP, WAN fisik dan benchmark kamera belum dilakukan.

- 2026-11-14 (beta.2): sesuai perubahan pengguna, laptop hanya layar dan startup kiosk fullscreen, QR langsung menjadi controller A/B tanpa formulir/persetujuan, menu HP diganti stik virtual D-pad/✕/○/□/△. Server menolak mutasi dari display; HP A mengendalikan sorotan dan mulai game. Bukti otomatis diperbarui; acceptance dua HP/latensi fisik tetap belum selesai. Kiosk desktop sudah lulus uji 1920×1080; titik lanjut: kontrol dua HP nyata; status gerbang fisik tidak berubah.

- 2026-11-14 (beta.3): controller HP diubah menjadi kontrol saja, analog kiri untuk katalog/game, Home kecil dan aksi kanan kontekstual. Aksi Kebun memilih alat secara atomik; Home tersedia untuk dua pemain. Fullscreen dicoba ketika terhubung dan melalui gesture, dengan fallback browser yang menolak/tidak mendukung. Verifikasi: check/build, 9 tes unit/integrasi, browser portrait/landscape, multi-touch tanpa aksi ganda, cancel netral, semua ronde Seirama serta API fullscreen Chromium desktop. Pengujian HP nyata tetap Menunggu; batasnya tercatat di [laporan controller](12-controller-hp.md). Titik lanjut tetap penerimaan kontrol/latensi pada dua HP fisik.

- 2026-11-14: persiapan kolaborasi open-source diperbarui: formulir ide, masalah, dan panduan berbahasa Indonesia; template PR, kode etik, panduan kolaborasi, gitignore, dan tautan dukungan sukarela. Ini melengkapi sebagian pekerjaan CP-10, bukan bukti distribusi atau rilis. Verifikasi struktur formulir, tautan lokal, dan aturan ignore dilakukan secara lokal; tampilan dan pengaturan GitHub setelah publikasi masih perlu diperiksa. Titik lanjut CP-10 tetap audit aset, matriks OS, artifact dan checksum.
