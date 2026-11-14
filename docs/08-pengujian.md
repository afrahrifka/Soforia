# 08 — Rencana verifikasi

## Lapisan tes

| Jenis | Kasus bermakna | Bukti |
|---|---|---|
| Unit game | collision, normalize gerak, gerbang dua pemain, recovery; pertumbuhan/panen atomik; ronde reveal/skip | Hasil tes dengan seed sintetis |
| Unit engine | fixed timestep, pause, catch-up, action dedup, stale epoch/gameInstance | Report otomatis |
| Integrasi server | pairing approval, kapasitas, host authorization, resume rotation, rate limit, timeout | Dua client sintetis dan display |
| Privasi | Cari jawaban rahasia sintetis dalam seluruh packet display/opponent sebelum reveal | Assertion payload, bukan screenshot saja |
| Browser | flow QR URL/manual, menu, controller layout, tutorial, rematch, refresh display | E2E browser otomatis dan manual |
| HP fisik | multi-touch, rotate, background, lock/unlock, panggilan, Safari/Chrome | Matriks perangkat dan catatan |
| Offline | WAN dicabut sebelum startup; HP baru tidak punya cache; tiga game sampai rematch | Network log dan checklist |
| Performa | FPS, tick lag, RTT, sentuh-ke-gambar, RAM; dua controller selama 30 menit dan soak 2 jam | Raw sample dan ringkasan p50/p95 |
| Packaging | install/build bersih, port bentrok, path berspasi, aset lengkap, shutdown | Log tiap OS yang didukung |

## Matriks penerimaan

- FR-01/08, NF-05: startup dan load HP baru dalam LAN tanpa WAN; tidak ada resource eksternal, semua game dapat selesai.
- FR-02/03: dua slot unik, pemain ketiga ditolak dengan pesan jelas, kode salah dibatasi, join tanpa approval tidak aktif. Token kedaluwarsa dan koneksi tanpa role tidak dapat bermain.
- FR-04/06, NF-06: kedua pemain dapat bergerak+aksi bersamaan, seluruh menu dari HP, tutorial ulang tersedia, orientasi berubah tanpa kontrol macet, label tidak bergantung warna.
- FR-05: seluruh acceptance G01/G02/G03 pada katalog lulus dengan dua HP fisik.
- FR-07, NF-07: putus Wi-Fi satu HP selama 1/5/60 detik, browser background, refresh display, duplikasi tab dan reconnect di tengah reveal. Input netral ≤250 ms dari state terakhir; tidak ada slot/skor ganda atau jawaban bocor; resume countdown setelah dua pemain siap.
- FR-09/10: reset dan logout menghapus sesi/credential/jawaban; file persistence hanya berisi data opt-in yang diizinkan; log tidak memuat secret.
- FR-11, NF-08: port terpakai dan interface salah memberi tindakan yang jelas; deployment lain tetap berjalan, tidak ada perubahan Tailscale/firewall otomatis.
- FR-12: modul fixture dapat didaftarkan dan dibuang dengan lifecycle yang sama; manifest invalid ditolak secara terkontrol.

## Protokol performa

Jaringan referensi dicatat dengan model AP, band, jarak, koneksi laptop, perangkat/OS/browser dan tanggal. Ukur median dan p95, bukan nilai terbaik. Jalankan sedikitnya 1.000 sampel RTT saat dua HP aktif. Target p95 ≤30 ms adalah round-trip aplikasi; laporkan timeout terpisah, jangan dibuang diam-diam.

Untuk sentuh-ke-gambar gunakan kamera minimal 120 FPS yang menangkap HP dan display bersamaan. Prototipe menyediakan marker feedback saat handler sentuh berjalan dan marker perubahan frame display. Catat keterbatasan marker: handler bukan waktu kontak fisik; jika menyebut touch fisik, rekaman harus memperlihatkan kontak jari. Ambil ≥100 input per kombinasi perangkat, target median ≤50 ms dan p95 ≤80 ms; resolusi 120 FPS sekitar 8,3 ms/frame. Jam HP dan server tidak cukup untuk membuktikan ukuran ini.

Ukur FPS di gameplay dan shell, target dasar p95 frame time ≤33,3 ms; evaluasi target 60 FPS secara terpisah. Catat ukuran bundle, penggunaan RAM dan drift selama soak; tentukan anggaran memori berdasarkan baseline CP-03 sebelum menandai performa stabil.

Uji gangguan 50/100 ms delay tambahan dan packet loss 1/3% bila alat tersedia. Hasil gangguan bukan jaringan referensi: yang diwajibkan adalah input tidak macet, pause/reconnect terkendali, tanpa score duplication. Tidak menjanjikan p95 80 ms saat jaringan sengaja diberi delay 100 ms.

## Gerbang rilis

Tidak ada crash, bug kehilangan input permanen, kebocoran jawaban, bypass host atau kegagalan offline yang diketahui. Bug kosmetik kecil boleh dicatat dengan batas yang jelas. Masing-masing tiga game wajib lolos satu sesi nyata pasangan; onboarding diuji pada sedikitnya tiga pasangan. Emulasi browser tidak menggantikan dua HP fisik.

Bukti menyertakan versi artifact, commit jika ada, perangkat, perintah/aksi, hasil, batas dan referensi issue. Jangan menyimpan wajah, nama atau jawaban peserta tanpa kebutuhan; fixture dan rekaman diagnosis gunakan identitas sintetis.
