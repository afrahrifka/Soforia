# 18 — Uji Kaca dengan keyboard dua pemain

**Klarifikasi sumbu terbaru:** Putar kiri/kanan kini menggulingkan kaca pada sumbu panjang, dapat melewati 360°. Catatan lama tentang putaran bidang XY di bawah merupakan riwayat; lihat [aturan guling terbaru](19-kaca-guling-dan-arena-alami.md).

Buka layar laptop `/console` melalui alamat operator lokal yang dicetak launcher. Saat di katalog dengan slot pemain kosong, tekan **F2**. Mode ini langsung memilih Kaca dan menyediakan dua pemain tanpa HP. Jika slot sudah dipakai, keluar dari sesi HP dahulu. **Enter** membuka tutorial, lalu **Enter** lagi memulai countdown untuk kedua pemain.

| Aksi | Pemain A | Pemain B |
|---|---|---|
| Berjalan | W/A/S/D | Panah |
| Miring kiri/kanan | Q/E | U/O |
| Naikkan/turunkan kaca | R/F | I/K |
| Lompat | Spasi | Shift kanan |
| Setuju lanjut stage | T | L |

Tahan tombol untuk berjalan, miring dan mengatur tinggi; aksi lompat/lanjut hanya satu kali per tekan. Tombol berlawanan saling menetralkan. Kamera mengikuti otomatis.

Kontrol bersama: **P** menjeda; **Enter** melanjutkan dari jeda atau mulai ulang dari hasil; **Backspace** mengulang checkpoint; **Home** kembali ke katalog; **[ / ]** memilih stage 1–60 di katalog; **F3** keluar mode dan mengosongkan slot. Pemilih stage ini khusus mode developer F2; controller HP biasa tidak menyediakan pemilih stage atau tingkat kesulitan.

Keyup melepaskan tombol masing-masing. Blur, background, dan pagehide menetralkan input kedua pemain tanpa pause otomatis. Input yang berhenti terkirim dinetralkan server setelah 250 ms. Refresh/koneksi layar putus melepas slot keyboard dan mengembalikan katalog; F2 dapat dipakai lagi. Keluar mode membuang progres pertandingan uji.

## Verifikasi dan batas

TypeScript, build, dan 42 tes unit/integrasi lulus, termasuk dua slot lokal, input tinggi kedua pemain, validasi rentang input, lompat pemain B, netral, jeda/lanjut dan pelepasan slot. Regresi display read-only dan controller HP tetap lulus. Uji browser dapat diulang dengan `node --import tsx scripts/glass-keyboard-check.mjs` setelah build; bukti tersimpan pada [laporan browser](evidence/glass-keyboard-report.json).

Uji otomatis menggunakan input sintetis Chromium. Kenyamanan kombinasi tombol, ghosting/rollover keyboard fisik, keseruan, balancing, dua HP, FPS referensi dan input-to-photon belum dibuktikan. Mode ini membantu developer melakukan playtest tersebut; status checkpoint fisik tidak berubah.

## Koreksi arah putar — 15 November 2026

Pemetaan keyboard sebelumnya membalik Q/E dan U/O terhadap controller HP. Keduanya kini memakai definisi bersama pada `src/glass-controls.ts`: **Q/U** serta tombol **Miring kiri** memutar berlawanan jarum jam dari kamera permainan; **E/O** serta **Miring kanan** memutar searah jarum jam. Sisi kiri turun dan kanan naik untuk putaran kiri, berlaku sama bagi kedua pemain. Tombol berlawanan saling menetralkan.

Mengangkat adalah aksi berbeda: R/Naikkan pemain A menaikkan sisi pegangan A, I/Naikkan pemain B menaikkan sisi B. Mengangkat kedua sisi bersama menaikkan pusat kaca tanpa mengubah kemiringan. Gerak ini tidak mengubah yaw/depan–belakang. Tes memeriksa tinggi titik pegangan, tanda sudut, input HP dan keyboard kedua pemain serta pose empat tangan; bukan sekadar mengganti ikon.

Verifikasi akhir koreksi: 47 tes unit/integrasi, TypeScript/build, [uji arah controller HP](evidence/glass-direction-report.json) dan [uji tombol keyboard](evidence/glass-keyboard-report.json) lulus. Keduanya memakai input sintetis. Uji browser rute panjang tidak dihitung lulus pada checkpoint ini: penyelarasan bingkai 15°/tinggi kedua pembawa masih sensitif terhadap timing dan perlu pemeriksaan lanjutan. Ini tidak diganti dengan klaim playtest fisik atau kelulusan seluruh rute browser.
