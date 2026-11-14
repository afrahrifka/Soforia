# Pembaruan beta.3 — controller HP memenuhi layar

Lihat [laporan controller HP](12-controller-hp.md). Revisi ini mengganti tampilan stik beta.2 dengan analog + aksi kontekstual tanpa header/footer, serta menambahkan percobaan fullscreen berbasis gesture. Bukti dan batas browser HP ada di laporan tersebut.

---

# Pembaruan beta.2 — layar saja dan stik HP

14 November 2026. Ketentuan di bagian ini menggantikan alur approval beta.1 di bawah: scan QR langsung menyambungkan controller A/B tanpa formulir/persetujuan, laptop tidak memiliki kontrol, dan server menolak seluruh mutasi dari credential display. HP A memakai D-pad untuk memindahkan sorotan game, ✕ untuk mulai, □/L1 untuk mode, △/R1 untuk arena. Fullscreen otomatis melalui `open-console.sh` yang meluncurkan Chromium/Chrome kiosk dengan profil khusus aplikasi.

Pengujian otomatis mencakup auto-join tanpa form, penolakan mutasi display, tidak adanya kontrol pada DOM laptop dan input mouse/keyboard diabaikan, navigasi D-pad yang terlihat pada laptop, mulai hanya dari HP, batas dua controller, reconnect dan ketiga game. Report browser: [bukti beta.2](evidence/browser-report.json). Uji Chromium desktop kiosk mengukur area halaman 1920×1080 sama dengan ukuran layar: [bukti kiosk](evidence/kiosk-report.json). Kiosk memerlukan desktop grafis dan Chromium/Chrome; tidak ada penguncian shortcut OS. Pengujian dua HP fisik dan latency kamera tetap diperlukan.

Bagian berikut adalah catatan baseline beta.1; rincian approval dan kontrol operator di sana bersifat historis.

---

# 11 — Implementasi beta 0.1.0-beta.1

Tanggal 14 November 2026. Implementasi ini adalah build pertama yang bisa dimainkan dan dideploy ke LAN, bukan pernyataan seluruh gerbang rilis spesifikasi sudah lulus.

## Yang tersedia

- Server HTTP dan WebSocket lokal; default memilih IP LAN fisik, mengecualikan Tailscale/VPN/Docker. IP dan port dapat dipilih melalui argumen CLI.
- Launcher Linux menggunakan unit user sementara khusus `main-bareng.service`, tanpa autostart saat reboot; `start.sh` tetap dapat dipakai tanpa systemd.
- Operator hanya pada loopback port terpisah; mendapatkan hak display dari POST same-origin lokal, tanpa memasukkan bootstrap token pada URL/log. QR dan kode enam digit ditampilkan pada konsol.
- Pairing dua HP dengan approval, pemain A sebagai host controller, layout browser yang berubah sesuai game, katalog dan semua aksi utama melalui HP.
- Orbit: tiga arena, 12 energi, dua pad gerbang, bahaya di arena 2/3, bantuan pasangan dan auto-recovery.
- Kebun: 12 petak yang dapat dijangkau, dua jenis bibit, pertumbuhan 12 detik, alat, carry dan pengantaran ke peti, target 6+6.
- Seirama: 40 soal orisinal, delapan ronde tanpa ulang, jawab/tebak privat, mutual reveal, skip dan hasil. Jawaban tidak masuk snapshot display/opponent sebelum reveal.
- Tutorial dan siap dua pemain, countdown, pause, hasil, rematch, arena berikutnya, reset dan controller reload/reconnect menggunakan token yang dirotasi.
- Timeout input 250 ms dan heartbeat; replay actionSeq ditolak, state dari match/epoch lama diabaikan. Role tidak dapat ditentukan client.
- Preferensi mute, reduced motion, ukuran/kidal di browser dengan fallback saat storage tidak tersedia. Audio berupa nada sintetis lokal, artwork dibuat dengan CSS/SVG/canvas, tanpa CDN/font jaringan.
- Diagnosis RTT aplikasi dan FPS, petunjuk jaringan, source TypeScript, build bundle dan paket Linux x64 dengan runtime Node 22.23.5 beserta lisensi/notice.

## Bukti yang sudah dijalankan

- `npm run check` dan `npm run build` lulus pada Node 20.20.2 development.
- Delapan tes unit/integrasi lulus: seed/gerak/gerbang/recovery Orbit; siklus panen; akses semua petak; 40 soal dan delapan ronde unik; privasi/reveal/skip Seirama; sesi tanpa jawaban; penyelesaian Kebun melalui rute legal dua pemain; otorisasi server, pairing, gerak, timeout, resume dan privasi melalui WebSocket.
- E2E Chromium dengan satu layar dan dua browser controller mobile: QR lokal, approval, menu, gerak sentuh, pause, reload slot, peluncuran Kebun, jawaban Seirama privat, mutual reveal, penyelesaian delapan ronde sampai hasil. Tidak ada JavaScript page error atau request ke host luar. [Report yang sudah diredaksi](evidence/browser-report.json).
- Paket runtime dan launch yang terisolasi diverifikasi sesuai [report paket](evidence/package-report.json) setelah pembuatan paket. Pembuatan paket mengunduh runtime resmi satu kali, memverifikasi checksum HTTPS Node.js, dan menyertakan LICENSE serta provenance. Menjalankan paket tidak mengunduh apa pun.

Screenshot QA berada di artifacts/ yang diabaikan Git; gambar berasal dari sesi sintetis yang sudah dihentikan. Jangan menggunakan screenshot QR sesi aktif sebagai bukti publik.

## Perbedaan rancangan awal dan batas beta

- Implementasi pertama memakai bundle esbuild dan DOM/CSS TypeScript, tidak memerlukan Vite; renderer Canvas 2D. Node 22 LTS dibundel untuk runtime. Workspace multi-package belum diperlukan.
- Kontrak jaringan yang benar-benar digunakan ada di `src/server.ts` dan `src/app.ts`: `auth`, `heartbeat`, `approve/reject`, `select`, `start`, `ready`, `pause`, `exit`, `pairing`, `reset`, `input.state`, `action`. Server mengirim `auth.ok`, `pending`, `game.snapshot`, `private.state`, `action.ack`, `pong`, `error`. Blueprint endpoint resume/reset pada spesifikasi diganti aksi WebSocket terautentikasi. Auth resume memakai credential berputar, `connectionEpoch`, `lastAction` dan batas 120 detik. Tidak menerima role dari client.
- Layout controller memakai pad gerak, tombol grid atau pilihan; alternatif kontrol belum dibandingkan pada HP fisik. Input dikirim 30 Hz, simulasi 60 Hz; snapshot maksimal sekitar 30 Hz. Render memakai state terakhir, belum interpolasi/prediksi. Target latency/FPS fisik tetap harus diukur.
- Seed/inisialisasi/game-action/tick/proyeksi berada di satu registry `src/games.ts`. Belum SDK plugin terpisah, JSON Schema publik untuk semua pesan atau import plugin pihak ketiga. Contoh manifest pada specs/ masih rancangan dan tidak digunakan sebagai executable loader.
- Kebun memakai penyiram tanpa batas isi air; sumur adalah penanda visual. Seed box benar-benar mengubah jenis bibit. Layout memiliki jalan menuju setiap petak. Balancing/resep tambahan belum diuji pasangan.
- Tidak ada persistensi rekor tim, onboarding otomatis pemilihan NIC melalui GUI, transfer host ke pemain lain, atau installer native. Pemilihan NIC/port tersedia melalui CLI; preferensi tersimpan per browser.
- HTTP LAN hanya pada Wi-Fi pribadi tepercaya. Traffic tidak terenkripsi; HTTPS/WSS lanjutan belum disediakan. Fitur secure-context seperti wake lock/sensor tidak menjadi syarat.
- Uji browser dengan akses host luar diblokir membuktikan tidak ada kebutuhan asset/cloud eksternal pada alur yang diuji. Kabel WAN belum benar-benar dilepas, dua HP fisik belum diuji, benchmark kamera dan uji soak 2 jam belum dilakukan. Jangan menyebut RTT browser sebagai latency sentuh fisik.
- Sistem Linux x64 paket ini diuji di mesin pengembangan; Windows/macOS dan hardware lain belum diverifikasi. Perubahan IP saat berpindah jaringan memerlukan restart dan pairing ulang.

## Titik lanjut penerimaan

Jalankan paket pada laptop ini dengan dua HP nyata pada Wi-Fi yang sama, coba ketiga game, background/lock/unlock dan rotate; catat OS/browser dan keluhan kontrol. Setelah itu ukur NF-01/02/03, lakukan soak dan playtest tiga pasangan. Perbaiki hasilnya sebelum memberi label rilis stabil atau mengklaim 11 checkpoint selesai.
