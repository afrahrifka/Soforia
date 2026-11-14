# 02 — Tampilan konsol dan controller

## Arah visual

Identitas: ruang bermain hangat dengan warna dasar navy/ungu, aksen coral dan mint, kartu game dengan ilustrasi orisinal, tipografi lokal dan animasi ringan. Konsep pasangan hadir melalui dua avatar/warna yang setara. Hindari merek, logo, suara startup dan aset konsol lain.

Referensi Web-Portfolio-3D terbatas pada kedalaman visual, pencahayaan dan transisi. Jangan menyalin scene, kode, aset atau gameplay. Shell boleh 3D ringan; gameplay awal top-down 2D/2.5D agar input dan aturan mudah dibaca.

## Layar utama

| Layar | Isi dan aksi |
|---|---|
| Setup | IP/antarmuka LAN, port, buka layar konsol, QR dan alamat manual |
| Lobby | Dua slot dengan nama/ikon, koneksi dan siap; join otomatis, maksimal dua controller |
| Katalog | Carousel kartu; filter Kerja Sama/Santai/Duel; durasi, pemain dan kontrol pada detail |
| Detail game | Tujuan, cara bermain singkat, mode, tutorial dan mulai |
| Gameplay | Tujuan bersama, progress, ikon pemain; tidak menutupi area permainan dengan diagnosis |
| Pause | Siapa yang terputus, reconnect, lanjut atau akhiri; informasi jaringan hanya bila relevan |
| Hasil | Pencapaian bersama, rematch, tukar peran dan kembali katalog |
| Pengaturan | Audio, reduced motion, kualitas, controller, hapus data dan diagnosis |

Laptop target 1366×768 hingga 1920×1080, uji scaling HiDPI. Game memakai koordinat logis dan letterbox saat rasio berubah. Animasi katalog tidak boleh terus mengonsumsi GPU di belakang match.

## Controller HP

Menu HP memakai stik virtual D-pad, ✕ Pilih/Mulai, ○ Kembali, □ Mode, △ Arena, L1/R1 dan OPTIONS; host diberi label jelas. Gameplay memakai layout khusus:

- `move-action`: pad sentuh relatif besar atau joystick opsional di kiri; satu aksi kontekstual di kanan. Orbit hanya membutuhkan gerak pada versi pertama.
- `grid-action`: empat arah besar, alat aktif, Gunakan dan Ganti; untuk Kebun.
- `private-choice`: pilihan teks besar, konfirmasi, status terkunci dan Lewati; untuk Seirama.

Utamakan tombol berlabel fungsi seperti Siram, Tanam atau Siap. Tidak memaksakan layout gamepad tradisional untuk semua game. Panduan [AirConsole](https://documentation.airconsole.com/smartphones-as-controllers) mengingatkan bahwa kontrol HP perlu diuji sejak prototipe; rekomendasi pad/joystick di sini adalah hipotesis yang harus dibandingkan dengan dua HP nyata.

Ukuran target sentuh ≥56×56 CSS px dengan jarak ≥8 px dan dukungan safe-area. Layout utama landscape untuk gerak; portrait tetap mempunyai versi fungsional dan petunjuk rotasi yang tidak menghalangi bermain. Seirama portrait-first. Preferensi kidal membalik posisi kontrol. Ukuran teks dan tombol tidak bergantung pixel fisik perangkat.

Gunakan Pointer Events, pointer capture per sentuhan dan `touch-action: none` hanya pada area kontrol. Gerak dan aksi dapat ditahan bersamaan. `pointercancel`, kehilangan capture, blur, visibility hidden, pergantian layout dan putus koneksi wajib menetralkan input. Lihat [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) dan [Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API).

## Ketahanan UI

Tidak bergantung pada fullscreen, screen wake lock, getaran atau orientasi sensor. Semua itu peningkatan opsional setelah deteksi kemampuan dan aksi pengguna. Jika audio autoplay ditolak, tampilkan Aktifkan Suara di laptop; controller HP tidak memainkan audio yang membuat gema. Ketika HP terkunci atau berpindah aplikasi, sesi masuk pause dan instruksi reconnect terlihat di layar utama.

Nama dibatasi 20 karakter, dirender sebagai teks; warna disertai ikon A/B. Pengaturan reduced motion meniadakan camera shake dan transisi terbang. Tidak ada kilatan wajib, teks kecil untuk instruksi penting atau petunjuk yang hanya berupa warna/audio.

## Revisi beta.2

Laptop adalah display-only: tidak ada tombol/tautan kontrol, cursor tersembunyi dan event mouse/keyboard halaman diblokir. Semua navigasi katalog dan aksi game berasal dari HP. Startup fullscreen memakai Chromium/Chrome kiosk, bukan requestFullscreen dari halaman tanpa gesture. Pembatasan ini berlaku pada aplikasi, bukan shortcut sistem operasi.
