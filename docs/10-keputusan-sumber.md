# 10 — Keputusan, asumsi, risiko dan sumber

## Daftar keputusan

| ID | Keputusan awal | Status / kapan ditinjau |
|---|---|---|
| D01 | Nama kerja Main Bareng, folder main-bareng | Dapat diubah sebelum publikasi |
| D02 | Pasangan dua orang sebagai pengguna utama; empat pemain ekspansi | Baseline dari arahan pengguna |
| D03 | Game orisinal; portofolio hanya referensi visual | Batas pengguna, tidak mengambil gameplay/kode/aset portofolio |
| D04 | Satu server laptop otoritatif, display render, HP input | Baseline arsitektur; uji CP-01–03 |
| D05 | WebSocket LAN terlebih dahulu | Evaluasi WebRTC jika baseline/gangguan menunjukkan kebutuhan |
| D06 | TypeScript, Node LTS, Vite, Canvas 2D; Three.js opsional | Versi dan library dikunci CP-01; bukan kewajiban semua game 3D |
| D07 | HTTP LAN untuk jaringan pribadi; HTTPS/WSS profil lanjutan | Uji browser dan batas privasi sebelum distribusi |
| D08 | G01/G02/G03 target rilis awal, G04 ekspansi unggulan | Rekomendasi desain, bukan klaim user memilih setiap judul |
| D09 | MIT untuk kode/aset orisinal baru; copyright Main Bareng contributors | LICENSE ditambahkan pada beta; notice dependency/runtime disertakan pada paket |
| D10 | Linux host pertama; browser HP Android/iOS | Model HP/OS/browser dan dukungan host lain ditetapkan lewat bukti |
| D11 | Tidak ada akun/cloud/telemetry; penyimpanan rekor opt-in | Baseline privasi dan offline |

## Asumsi yang harus diuji

Laptop dan HP dapat saling menjangkau pada LAN; router tidak mengisolasi client. Browser mengizinkan akses top-level controller lokal dan WebSocket sesuai konfigurasi nyata. Pengguna bersedia menjaga browser HP aktif. Dua perangkat fisik tersedia saat acceptance; jika tidak, status pengujian fisik tetap Menunggu, jangan digantikan emulasi.

Default kontrol pad/joystick belum keputusan kenyamanan final. Panduan AirConsole justru memperingatkan kelemahan joystick virtual; CP-03 harus membandingkan pad relatif, tombol arah besar dan joystick opsional sebelum mengunci G01/G02. Grafik konsol yang bagus tidak boleh mengorbankan respons input.

## Risiko dan respons

| Risiko | Respons dan bukti yang diperlukan |
|---|---|
| HP terkunci/background menghentikan eksekusi | Server timeout netral, pause, resume teruji; wake lock hanya opsional |
| Antrean WS menunda state netral | Pantau bufferedAmount, batasi produksi, stale timeout server dan reconnect |
| Port/IP/firewall bentrok | Pilihan interface/port dan diagnosis; tidak mengubah layanan lain |
| Penundaan interpolasi/render | Ukur pipeline dan kamera, sesuaikan snapshot/interpolasi berdasarkan bukti |
| HTTP mengungkap traffic LAN | Batas jaringan tepercaya, minim data, HTTPS/WSS sebelum pemakaian lebih luas |
| Game couple terasa menghukum | Mode santai, skip tanpa penalti, tanpa leaderboard hubungan, playtest pasangan |
| Scope katalog membesar | Tiga game awal; game lain backlog dengan gerbang spesifikasi sendiri |
| Aset/lisensi tidak jelas | Aset orisinal/inventaris dan audit sebelum distribusi; portofolio tidak disalin |
| Plugin menjalankan kode tidak dipercaya | Hanya modul bundel, tidak ada upload JS dalam v0.1 |

## Sumber primer

Diakses 14 November 2026. Sumber menjelaskan kemampuan/pola teknis; angka latency, pilihan game dan balancing pada spesifikasi adalah target/usulan proyek, bukan angka yang diklaim berasal dari sumber.

- [AirConsole — Smartphones as Controllers](https://documentation.airconsole.com/smartphones-as-controllers): rancangan kontrol HP, layout kontekstual dan pentingnya playtest awal. Ringkasan interpretasi proyek: hindari menyalin gamepad secara otomatis.
- [Jackbox — How to play](https://www.jackboxgames.com/how-to-play): referensi pola layar bersama dengan controller perangkat pribadi. Infrastruktur cloud produk tersebut tidak dipakai sebagai dependency Main Bareng.
- [MDN — WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket): koneksi dua arah dan keterbatasan backpressure; dasar pembatasan antrean aplikasi.
- [MDN — Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events): pointer, capture, cancel dan kontrol sentuhan.
- [MDN — Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API): perubahan visibilitas dan pembatasan aktivitas background.
- [MDN — Secure Contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts): keterbatasan API sensitif pada origin HTTP LAN.
- [MDN — Local network access](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Local_network_access): kebijakan jaringan lokal yang perlu diuji lintas browser.
- [MDN — createDataChannel](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createDataChannel): ordered dan maxRetransmits untuk evaluasi alternatif transport.
- [Node.js — Releases](https://nodejs.org/en/about/previous-releases): memilih runtime LTS yang masih didukung saat fondasi dibuat.

Pemeriksaan lokal sebelumnya pada Web-Portfolio-3D menunjukkan Three.js/Vite, navigasi scene dan kontrol lokal. Pemeriksaan itu hanya mendukung pemahaman referensi visual; tidak mengukur kelayakan runtime aplikasi baru.
