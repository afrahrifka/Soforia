# 12 — Controller HP beta.3

14 November 2026. Controller langsung terbuka setelah QR dipindai, tanpa formulir/persetujuan. Laptop tetap display-only.

## Tata letak dan aksi

Layar normal hanya berisi analog kiri, aksi kanan, Home kecil, dan tombol fullscreen kecil. Tidak ada judul game, logo, header, footer, kartu preview, panel instruksi, atau indikator jaringan berbentuk teks. Status koneksi menjadi titik kecil pada Home. Informasi game dan instruksi ada di layar laptop; bantuan/pengaturan dibuka hanya atas permintaan pemain.

| Fase/game | Analog | Tombol kanan |
|---|---|---|
| Katalog | Pilih game; host A, repeat saat ditahan | Main, Mode, Arena, Pengaturan |
| Tutorial/pause | Nonaktif | Siap, Cara main, Suara, Home |
| Orbit | Gerak dua sumbu | Jeda, Cara main, Berhenti, Suara |
| Kebun | Langkah grid menurut sumbu dominan | Tanam, Siram, Panen, Antar, Aksi/Bibit, Jeda |
| Seirama | Memilih salah satu dari empat posisi jawaban | Empat jawaban, Kunci/Ungkap, Lewati; setelah reveal: Lanjut, Jeda, Suara, Home |
| Hasil | Nonaktif | Main lagi, Pilih game, Arena lanjut, Pengaturan |

Home selalu tersedia di kiri atas dan kedua pemain dapat mengembalikan sesi ke katalog. Tidak meminta dialog konfirmasi; ronde aktif dihapus. Ini mengganti pembatasan exit hanya untuk host pada baseline sebelumnya. Host tetap satu-satunya pihak yang dapat memilih/memulai game.

Kebun memiliki aksi langsung yang memilih alat dan melakukan interaksi di dalam satu operasi server. Siram tidak dapat menyetor hasil panen secara tidak sengaja; Antar hanya bekerja jika menghadap peti. Aksi generik lama `use/tool` tetap tersedia untuk kompatibilitas.

## Input dan tata letak

- Pointer analog terpisah dari tombol aksi; aksi dikirim pada pointerdown agar sentuhan kedua bekerja saat analog ditahan. Click sintetis setelah pointerdown diabaikan agar tidak terjadi dua aksi.
- Pointer capture mempertahankan analog; dead zone 0,14, normalisasi gerak diagonal dan batas ±1. Navigasi katalog memakai ambang 0,45 serta repeat 430 ms agar tidak melompati seluruh katalog dalam satu geseran.
- Lepas/cancel, perubahan ukuran/orientasi dan background menetralkan analog. Heartbeat/stale-input server tetap berlaku. Ketika offline, Home menunjukkan titik koneksi merah.
- Area mengikuti visualViewport/100dvh, safe-area dan tidak scroll. Landscape diprioritaskan; portrait tetap dapat dimainkan. Kidal dan ukuran kontrol tetap tersedia lewat Pengaturan.

## Fullscreen dan batas browser

Aplikasi mencoba `requestFullscreen({navigationUI:'hide'})` setelah controller terhubung, lalu mencoba lagi dalam gesture sentuhan/klick yang sama saat pemain menggunakan kontrol. Tidak ada overlay atau halaman pengaktifan wajib. Tombol ⛶ tersedia untuk mengulang permintaan. Setelah fullscreen aktif, orientasi landscape diminta jika browser mendukung; kegagalan tidak memblokir permainan.

[MDN requestFullscreen](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen) menjelaskan kebutuhan aktivasi pengguna serta variasi dukungan. [MDN ScreenOrientation.lock](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock) menjelaskan pembatasan orientasi. Sumber diakses 14 November 2026. Aplikasi tidak dapat menjanjikan address bar hilang pada semua HP hanya dengan membuka QR, khususnya bila API tidak tersedia/izin ditolak. Layout tanpa chrome aplikasi tetap aktif pada kasus tersebut. Tidak mengubah jaringan HTTP LAN atau memasang aplikasi native pada HP.

## Bukti dan batas

- TypeScript check/build serta 9 tes unit/integrasi: aksi langsung Kebun, satu panen/satu deposit, Siram tidak menyetor, Home pemain B, dan regresi game/server.
- [Report browser](evidence/browser-report.json): auto-join, kontrol saja, analog katalog/game, viewport 915×412 dan 412×915 tanpa clipping/scroll, pause/reload, Home, aksi multi-touch sambil menahan analog, satu pointerdown menghasilkan satu aksi, cancel mengirim nol, dan delapan ronde Seirama. Permintaan fullscreen ditolak/tidak tersedia disimulasikan untuk menguji fallback. Tidak ada request eksternal atau page error.
- [Report API fullscreen native](evidence/mobile-fullscreen-report.json): API Chromium desktop dengan gesture nyata dan controller memenuhi viewport. Ukuran jendela desktop dikendalikan compositor; pengujian ini tidak membuktikan perilaku address bar pada Android/iOS. Layar laptop kiosk tetap mempunyai [bukti desktop terpisah](evidence/kiosk-report.json).
- Pengujian dua HP fisik, kompatibilitas browser HP nyata, sentuh-ke-gambar, pemutusan WAN fisik dan soak tetap belum selesai. Status rilis masih beta; tidak menandai gerbang fisik Lulus dari simulasi browser.
