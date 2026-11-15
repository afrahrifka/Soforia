# 17 — Empat sudut, kaca rapuh, dan tantangan kemiringan

15 November 2026. Revisi berdasarkan permintaan pengguna dan klarifikasi bahwa setiap pemain memegang dua sudut dengan dua tangan. Dokumen ini menggantikan arti rotasi, pegangan, dan kebijakan pecah Kaca pada revisi sebelumnya. Fokus dua pemain LAN dan Jeda manual tetap berlaku.

## Pegangan dan kemiringan

Kaca adalah rectangle 2,4 × 1,2 unit dengan pivot di pusat. Pemain A memegang dua sudut sisi kiri; pemain B memegang dua sudut sisi kanan. Tombol Miring kiri/kanan mengubah sudut pada bidang XY, dari −90° hingga +90°, dengan laju 1,5 radian/detik. Kaca tidak berputar ke depan–belakang. Pada 90°, pegangan dua sudut A berada di bawah dan dua sudut B di atas; arah −90° membaliknya. Keempat tangan model ditempatkan pada sudut kaca yang sama dengan yang diperiksa simulasi.

Naikkan/Turunkan tetap mengatur tinggi dukungan masing-masing pemain; perbedaan tinggi juga memengaruhi kemiringan. Posisi awal pusat kaca 1,4 unit di atas kaki, sehingga semua tepi punya jarak aman dari lantai. Jangkauan maksimal setiap lengan kini 2,2 unit untuk memungkinkan pegangan empat sudut, termasuk sudut atas ketika kaca tegak. Ini menggantikan batas 1,4 unit sebelumnya dan tetap merupakan model elastis dengan animasi dua ruas, bukan ragdoll rigid-body penuh. Solver tidak lagi menghasilkan tarikan Z semu dari bahu depan/belakang ketika kedua badan diam sejajar.

Tinggi dan sudut bertahan ketika tombol dilepas. Input dinetralkan saat cancel, blur, resize atau koneksi terputus, tanpa pause otomatis. Tombol Miring kiri mengikuti arah ikon berlawanan jarum jam; Miring kanan mengikuti arah jarum jam. Analog dan utilitas tetap di posisi revisi controller sebelumnya.

## Kapan kaca pecah

- Kontak sudut dengan tanah memecahkan kaca langsung, termasuk saat spawn/checkpoint. Tidak ada kekebalan collision setelah respawn. Toleransi kontak lantai 0,025 unit; menurunkan terlalu jauh tidak lagi berhenti pada tinggi aman secara otomatis.
- Dua badan yang berjarak kurang dari 1,15 unit dan menekan ke dalam di sekitar kaca membangun tekanan. Dorongan kuat dua analog memecahkan kaca dalam sekitar 0,08 detik; dorongan lebih ringan yang memenuhi ambang dalam sekitar 0,13 detik. Berdekatan tanpa dorongan tidak memecahkan kaca. Indikator memberi peringatan jika tekanan meningkat; badan dipisahkan pada jarak minimum 0,68 unit.
- Kontak dengan rintangan memakai pengujian rectangle berotasi terhadap kotak pada bidang XY dan ketebalan Z. Aperture memeriksa keempat sudut pada koordinat lokal lubangnya; salah sudut atau tinggi menyebabkan benturan. Kaca tidak lagi pecah hanya karena mencapai sudut tertentu: 90° adalah posisi permainan yang sah.
- Terlalu jauh dari jangkauan tangan atau jatuh tetap memecahkan kaca. Setelah pecah, pesan menjelaskan penyebab dan tim otomatis kembali ke checkpoint terakhir, tanpa masuk state pause.

Ini simulasi permainan dengan ambang yang dapat diuji, bukan simulasi tekanan material kaca dunia nyata.

## Susunan 60 stage

Sepuluh urutan tantangan digunakan per dunia, dengan perkembangan sudut, celah, dan toleransi pada enam dunia. Setiap stage memiliki empat bagian dan minimal tiga jenis tantangan; tidak ada lagi stage yang hanya bisa dilewati dengan berjalan lurus dari awal sampai akhir.

Urutan mengenalkan ruang gerak, kemiringan sebagian, mengangkat, menurunkan secara aman, lompat, jembatan sempit, menunggu balok bergerak, kaca tegak, dua bingkai berlawanan, lalu kombinasi bingkai dan lompatan. Sudut mencakup 15°, 25°, 35°, 45°, 60°, 75°, ±90° serta variasi arah negatif. Bingkai ganda menyediakan ruang berhenti untuk mengatur ulang sebelum tantangan berikutnya. Checkpoint tetap lebar dan datar agar kegagalan tidak mengulang seluruh stage.

Bingkai kuning dan tirai gabarit transparan menunjukkan lubang serta sudut tujuan. Tirai tersebut merupakan rintangan khusus kaca; badan pembawa tidak ditabrakkan dengan tirainya. Ini aturan permainan yang disengaja, bukan dinding beton padat. Tirai/bingkai yang sudah dilewati memudar agar tidak menutupi tim dari kamera belakang. HUD menampilkan sudut saat ini dan sasaran bingkai berikutnya, petunjuk tindakan, tekanan badan, penyebab pecah, serta checkpoint.

Variasi ini memperbaiki struktur tantangan, tetapi **keseruan dan balancing belum terbukti oleh playtest pasangan**. Enam puluh stage tetap memakai sepuluh urutan dasar dengan parameter dunia, bukan 60 desain yang seluruhnya ditulis terpisah.

## Verifikasi dan bukti

- TypeScript, build, dan **41 tes unit/integrasi** lulus: pegangan empat sudut, tangan model render, kemiringan tanpa yaw, pose vertikal, pecah di tanah tanpa kekebalan, tekanan dua badan, salah/benar sudut aperture, kestabilan solver, privasi game lain dan Jeda manual.
- [Simulasi seluruh stage](evidence/kaca-corners-course-report.json): 60 stage / 240 checkpoint berhasil melalui input gerak, tinggi, sudut, menunggu, dan lompat, tanpa teleport, tanpa kekebalan dan tanpa pecah. Pengendali tes mempunyai pengetahuan peta; tidak dipasang sebagai bot dalam aplikasi.
- [Uji controller browser](evidence/kaca-corners-browser-report.json): input UI membuktikan pecah karena lantai, pecah karena terjepit, respawn tanpa pause, melewati checkpoint dan bingkai 15°, lalu mencapai pose tegak 90°. Layout empat ukuran viewport dan multi-touch tetap diuji. Tidak ada error JavaScript atau request eksternal.
- [Inspeksi enam dunia](evidence/kaca-corners-visual-report.json): render dan reduced motion lulus; jumlah geometri/tekstur kembali ke awal setelah siklus enam dunia. Fixture dibatasi ke lima render per detik untuk inspeksi statis agar tidak membebani software renderer; ini bukan pengukuran FPS aplikasi.
- [Pratinjau empat pegangan tegak](evidence/kaca-four-corners-vertical.png) merupakan fixture visual sintetis. [Bingkai miring saat bermain](evidence/kaca-corners-angle-gameplay.png) dan [pose tegak saat bermain](evidence/kaca-corners-vertical-gameplay.png) diambil dari pengujian controller browser.

## Titik lanjut

Refresh layar dan HP setelah build lokal dimuat, lalu scan QR baru. Lakukan playtest dua HP fisik untuk menguji arah tombol, koordinasi empat sudut, keterbacaan tirai, batas tekanan badan, keadilan pecah akibat tanah, serta peningkatan kesulitan dari dunia awal hingga akhir. Ukur frame time dan input-to-photon sesuai protokol; status CP-03/08/09 serta gerbang performa belum lulus. Paket distribusi perlu dikemas ulang sebelum dibagikan.
