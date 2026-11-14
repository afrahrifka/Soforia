# 07 — Operasional, privasi dan distribusi

## Offline yang dimaksud

Mengunduh sumber/dependency atau memperoleh paket pertama dapat membutuhkan internet. Setelah build/paket lengkap tersedia, startup server, load UI pada HP baru, QR, tutorial, main, audio, hasil dan rematch harus bekerja tanpa WAN. Gunakan kamera sistem HP untuk scan QR; tidak ada scanner kamera dalam halaman controller.

Semua font, ilustrasi, musik dan pertanyaan dibundel lokal. Tidak ada CDN, remote font, telemetry, login luar atau request update yang menjadi syarat bermain. Service worker/PWA tidak menjadi syarat dan tidak diaktifkan di v0.1 agar controller tidak tertahan cache versi lama. Health/protocol mismatch menyediakan petunjuk reload.

HTTP pada IP LAN tidak diperlakukan sama dengan localhost untuk API secure-context. Wake lock, sensor, kamera web dan fitur browser tertentu dapat memerlukan HTTPS atau izin. Jangan bergantung pada fitur tersebut. [Secure Contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts).

## Keamanan sesuai batas lokal

Jaringan pribadi tetap dapat mempunyai perangkat lain. Ancaman yang ditangani: join tidak diinginkan, role spoofing, input/aksi ganda, injeksi nama, jawaban bocor ke display, token di log, koneksi usang, dan situs asing mencoba mengendalikan server.

Mitigasi: persetujuan host, invite berumur pendek, token per role di memori, allowlist Host/Origin, rate limit dan ukuran payload, render textContent, schema validation, proyeksi privat, tanpa endpoint berkas arbitrer/command shell. Bootstrap operator lokal berbeda dari join credential. CSP same-origin; hindari inline script dan remote code. Paket dapat dimatikan kapan saja; reset merotasi seluruh credential.

Batas HTTP LAN: pihak yang dapat mengamati jaringan dapat mengintip traffic. Mode v0.1 hanya untuk LAN tepercaya dan konten ringan. HTTPS/WSS dan trust lokal dipersiapkan sebagai profil distribusi tambahan sebelum perluasan penggunaan publik. Jangan mendeskripsikan jawaban HTTP sebagai terenkripsi atau rahasia dari administrator jaringan.

## Operasional harian

Target alur: satu perintah/launcher membuka konsol lokal, memilih interface dan port, menunjukkan QR. Startup memeriksa port; bila 3210 terpakai, tampilkan pilihan port lain tanpa menghentikan proses yang ada. Shutdown menutup socket, menetralkan input, menghapus sesi dan menulis preferensi secara atomik.

Status panel membedakan: server belum siap, tidak ada IP LAN, halaman controller gagal dijangkau, WebSocket ditolak, timeout, versi berbeda, dan display tidak aktif. Panduan firewall menyebut port aplikasi yang dipilih, tanpa perintah membuka semua port. Perubahan IP me-pause match, memperbarui QR setelah konfirmasi operator dan meminta controller bergabung kembali; jangan menjanjikan roaming otomatis.

Autostart/systemd bukan default. Bila nanti diminta, gunakan unit khusus Main Bareng. Jangan mengubah deployment Buku Kas, Couple Life, portofolio, Home Drive atau konfigurasi Tailscale yang sudah berjalan.

## Open-source dan aset

Lisensi kode/aset orisinal baru: MIT, dengan copyright Main Bareng contributors; lihat ../LICENSE. Notice dependency dan runtime terpisah di paket distribusi. Tidak menyalin kode portofolio dengan menganggap lisensinya otomatis berubah.

Buat inventaris aset: path, pembuat, URL sumber, lisensi, atribusi, modifikasi dan bukti izin redistribusi. Prioritaskan geometri/ilustrasi/audio buatan proyek atau aset yang mengizinkan redistribusi. Contoh dan soal memakai konten orisinal. Tidak membundel ROM, logo, soundtrack atau merek konsol lain.

Rilis menyertakan source, lockfile, instruksi build/run, daftar lisensi pihak ketiga, checksum artifact, daftar platform yang benar-benar diuji, known issues dan changelog. Tidak ada auto-update saat match. Rilis Windows/macOS dan installer memerlukan tes sendiri; spesifikasi lintas platform belum bukti dukungan.
