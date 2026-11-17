# Desain dan pertanggungjawaban referensi

## Sumber utama

Diperiksa 16 November 2026:

1. [Issue Soforia #41](https://github.com/oskhar/Soforia/issues/41): spesifikasi primer untuk fantasi penjaga waktu, Pelari/Perencana, loop 60 detik, jejak posisi/aksi, benda persisten, target empat/tiga loop, timeline HP, mode santai, reconnect dan larangan rekaman pribadi. Issue berstatus ide ketika implementasi dimulai; permintaan pengguna mengotorisasi implementasi ini.
2. [Mobius Digital — Outer Wilds](https://www.mobiusdigitalgames.com/outer-wilds.html): pengembang menjelaskan dunia dalam loop dan lokasi yang berubah seiring waktu. Yang diadaptasi adalah prinsip belajar dari pengulangan dan merencanakan kunjungan. Ini interpretasi desain; sumber tersebut tidak menetapkan mekanik gema, pelat atau role controller game ini.
3. [Kenney — Nature Kit](https://kenney.nl/assets/nature-kit): halaman penerbit menyatakan aset 3D Nature Kit berlisensi CC0. Model pohon digunakan dari salinan lokal yang sudah tersedia; tidak mengambil konten visual Outer Wilds.

Issue tidak mempunyai game rilis, peta acuan, gambar atau aset resmi yang dapat dicocokkan piksel demi piksel. Denah, seni jam, warna, karakter, roda, bangunan, audio, narasi distrik dan susunan teka-teki dibuat khusus untuk modul ini. Tidak mengklaim menyalin game referensi secara persis.

## Keputusan aturan

Satu posisi Pelari direkam pada interval awal 100 ms, ditambah titik akhir eksplisit. Posisi ghost pada waktu t diinterpolasi linear antar-sampel dengan pencarian biner; sebelum awal/di luar akhir menggunakan titik ujung. Menetap di titik akhir adalah mekanik jangkar yang dinyatakan pada controller dan tutorial, bukan rekaman gerak tak terbatas. Collision substep maksimal 25 ms; gerak diagonal dinormalisasi. Echo hanya menekan pelat: replay tidak memanggil aksi ambil lagi.

Kunci rekaman bersifat final untuk loop berjalan. Semua label aksi yang diarsipkan dibatasi sampai titik akhir rekaman. Boleh berjalan sesudah mengunci tanpa menambah rekaman. Saat Ulang menit, posisi kembali ke S, clock ke nol, replay dimatikan dan draft baru langsung merekam. B memilih kapan replay mulai; clock replay terpisah dari clock dunia. Menelusuri garis waktu hanya memindahkan marker pratinjau. Mematikan/ganti jejak menghapus pengaruh gema, tetapi kait permanen tetap berlaku.

Seluruh pengambilan benda hanya terjadi pada satu fungsi otoritatif yang memeriksa jarak dan ID inventaris. Menyentuh sel G/H saat terbuka mengaitnya selamanya untuk distrik berjalan. Ini menjamin pergantian jejak, rekaman yang salah, auto-loop atau penghapusan arsip lama tidak menghilangkan kunci yang dibutuhkan. Jika belum berhasil membuka suatu gerbang, P/Q tetap dapat dicapai dari sisi awal gerbang tersebut. Tidak ada konsumsi benda dan tidak ada deadline kegagalan permanen.

Empat/tiga loop menjadi sasaran medali, bukan batas yang memaksa reset puzzle. Ini keputusan eksplisit untuk mendamaikan target jumlah loop issue dengan acceptance tidak pernah mustahil. Santai memakai waktu tak terbatas; gerbang berkala menggunakan `clock % 60` sehingga jendela yang terlewat selalu datang lagi. Tidak memakai waktu sistem, RNG baru, filesystem atau network di aturan game.

Kampanye berurutan menggantikan pemilih stage biasa yang dilarang kebijakan host. Tidak ada switch ID atau registrasi manual di host. P1/P2 mempunyai role tetap; pertukaran role dapat dilakukan dengan urutan pairing pada permainan baru, belum ada tombol tukar role di tengah sesi.

## Antarmuka dan visual

Perspektif ortografik memperlihatkan seluruh denah tanpa kamera manual. Dinding rendah dan rumah dengan jeda menjaga gerbang terbaca. Jam landmark menampilkan waktu loop; tiga roda ditampilkan sebagai geometri roda bergigi. Huruf a/b/c/P/Q/G/H/E dan label A/GEMA menghindari ketergantungan warna. Pratinjau berupa lingkaran tanah, berbeda dari tubuh gema transparan. Gerbang yang tidak ada dalam jendela waktu tetap tertutup sampai waktunya.

Garis waktu HP B memiliki event, marker, cursor, pita jendela gerbang, tombol seek dan analog scrub. Render key tidak berubah mengikuti timer/cursor. Sinkronisasi hanya menyegarkan isi timeline dan status tombol; node analog dan listener pointer dipertahankan. Mode kidal/besar, Jeda, Home dan pairing tetap milik host. Ornamentasi berputar dan trail dimatikan melalui reduced motion; puzzle dan jam tetap terbaca. Audio bukan sinyal yang diwajibkan untuk solusi.

## Penerimaan dan batas

Solver BFS menggunakan peta yang sama, tetapi berjalan melalui input analog dan action server, bukan menulis posisi. Keenam distrik harus selesai, gate harus dibuka dengan jejak, dan jumlah loop ideal harus 1/2/2/2/3/3. Ini membuktikan setidaknya satu solusi, bukan balancing manusia atau target 6–9 menit. Fixture visual memeriksa scene dan controller asli, klik aksi, tidak ada error render atau request internet, serta pointer node stabil pada pembaruan timer.

Tes serialisasi membuktikan simulasi lanjutan identik setelah state disalin JSON; reconnect jaringan melalui host asli sudah diuji dengan dua client WebSocket sintetis, termasuk resume slot B, replay aktif, disconnect tanpa pause, jeda manual dan reset permainan baru. Dua perangkat fisik masih belum diuji. Screenshot adalah Chromium sintetis. FPS, latensi input-to-photon, kenyamanan sentuh, durasi puzzle dan kualitas kolaborasi wajib dipastikan melalui playtest. Status tetap beta.
