# 22 — Tantangan fisik, bioma dan audio Kaca

Revisi 15 November 2026 menanggapi playtest pengguna: rute lama dapat diselesaikan hanya dengan analog, sehingga kelulusan simulasi lama tidak membuktikan tantangan maupun keseruan. Rangkaian map lama diganti, bukan sekadar diberi warna atau dipercepat.

## Rangkaian stage

`src/glass-levels.ts` menyimpan 60 nama dan urutan encounter yang berbeda. Ada 16 jenis tantangan, empat encounter per stage dan lima pada enam stage terakhir, total **246 checkpoint internal**. Bioma berganti setiap stage: Kota Pesisir, Rimba Sungai, Pabrik Tembaga, Ngarai Merah, Dok Orbital dan Gletser Senja. Dua belas pola rute terbuka menggantikan loop yang berulang. Tempo mesin meningkat bertahap menurut kelompok progres.

| Tantangan | Tindakan dan koordinasi |
|---|---|
| Gang sempit | Berubah dari berdampingan menjadi berbaris dan menggulingkan kaca agar lebar fisiknya muat; tidak ada angka sudut wajib |
| Muatan/peti lebar | Kedua pembawa mengambil jalur sisi dan mengangkat kaca di atas muatan; berjalan biasa terhalang |
| Palang rendah | Menurunkan pegangan dan merunduk bersama; kepala/bidang kaca tetap mempunyai collider |
| Balok lintang | Melompat bersama; balok dapat dipijak saat mendarat, tidak menjebak badan di dalamnya |
| Rak dua tinggi | Satu sisi rendah dan sisi lainnya terangkat; tetap boleh menemukan alternatif yang secara fisik muat |
| Jembatan putus | Dua celah nyata dengan pijakan tengah bertiang; lompatan berurutan, bukan berjalan melintasi tanah semu |
| Pintu piston bergantian | Dua plunger berfase berlawanan; berbaris, atur kaca, dan pilih waktu lewat satu jalur |
| Palu, kapak, batang berayun | Poros/kepala bergerak dengan collider yang sama seperti tampilan; membaca ayunan dan memberi ruang |
| Penyapu berputar | Batang rendah berputar melintasi jalur; timing dan lompatan |
| Piston tunggal | Tunggu ruang fisik terbuka untuk lewat di bawah kepala mesin |
| Kendaraan silang | Muatan bergerak melintasi jalan, termasuk keluar/masuk sisi jalan |
| Feri maju/menyamping | Naik bersama, ikut gerakan dek, lalu turun pada bukaan yang benar; feri menyamping bergerak melintang terhadap orientasi deknya |
| Lift | Ketinggian minimum/maksimum sejajar daratan bawah/atas; bergerak ke tepi saat naik dan turun ketika sejajar |

Parapet/pagar/tebing merupakan benda padat yang menutup jalur samping. Gang mempunyai ruang kepala dan lebar yang benar-benar memengaruhi bentuk kaca; kriteria menang tidak membaca sudut. Ukuran collider dekorasi ikut dipakai saat menempatkan rumah/batu pada tikungan agar tidak masuk ke jalur yang dirancang. Kaca tetap pecah hanya dari kontak nyata. Tidak ada banner petunjuk melayang, hitungan jarak tersisa, pemilih kesulitan biasa atau persetujuan lanjut stage. Checkpoint akhir langsung memindahkan map seperti revisi 21.

## Audio lokal

`src/glass-audio.ts` menyintesis musik orisinal per bioma, bass/perkusi/melodi dan lapisan ketegangan dekat mesin. Efek membedakan langkah permukaan, lompat, mendarat, motor platform, desiran benda bergerak, checkpoint, stage selesai dan pecahnya kaca. Event mengikuti snapshot permainan; tidak mengeluarkan bunyi setiap snapshot tanpa perubahan. Node selesai diputus dan gain memakai ramp serta compressor.

Audio utama berasal dari laptop. Tombol **♫** kecil pada utilitas pemain 1 mematikan/menyalakan audio game bersama; server menolak pemain 2 mengubahnya. **M** pada laptop mengubah mute lokal. Launcher kiosk sudah mengizinkan autoplay. Jika memakai browser biasa yang masih membatasi autoplay, satu gesture/tombol lokal pada laptop membuka konteks audio. Musik berhenti saat jeda/keluar/background, dan tidak ada unduhan audio runtime. Tidak ada sampel pihak ketiga baru atau materi audio komersial yang disalin.

## Referensi

Memeriksa ulang [halaman Steam resmi Carry The Glass](https://store.steampowered.com/app/3263320/Carry_The_Glass/) serta screenshot dan frame trailer resmi: susunan pijakan, perjalanan vertikal, mesin ayun dan ruang angkut. Ini pengamatan materi resmi, bukan klaim memainkan game tersebut atau memindahkan map komersialnya. Gambar referensi tetap di direktori sementara, tidak menjadi aset distribusi. Semua rute, geometri baru dan audio dibuat dalam proyek ini.

## Bukti dan batas

- **53 tes** unit/integrasi, TypeScript dan build offline lulus. Regresi memeriksa variasi stage, pose solusi 111 encounter statis, pencarian sampel arah/formasi tanpa aksi pada lima jenis penghalang, perubahan collider mesin, sambungan lift, celah jembatan, muting host serta perilaku lama yang dipertahankan.
- [60 stage / 246 checkpoint](evidence/kaca-authored-course-report.json): pengendali sintetis menggunakan analog, putar, tinggi, lompat dan prediksi waktu mesin. Dari rute yang diuji: putar digunakan pada 31 stage, perubahan tinggi pada 52 dan lompat pada 34. Angka ini aktivitas pengendali, bukan bukti tidak ada solusi alternatif manusia.
- [Kontrol negatif analog](evidence/kaca-analog-regression-report.json): pengendali yang sama tidak menyelesaikan enam stage awal ketika aksi selain analog dinonaktifkan. Ini bukan pencarian menyeluruh seluruh strategi manusia.
- [Geometri encounter](evidence/kaca-challenge-geometry-report.json): pose solusi dan posisi dalam koridor; ini terpisah dari bukti perjalanan input.
- [Visual enam bioma dan mekanik](evidence/kaca-authored-visual-report.json): fixture statis Chromium, bukan screenshot playtest dua HP atau benchmark FPS. Contoh: [angkat muatan](evidence/kaca-authored-city-raise.png), [gang berbaris](evidence/kaca-authored-orbit-roll.png), [ketinggian berbeda](evidence/kaca-authored-split.png), [piston bergantian](evidence/kaca-authored-factory-zipper.png), [jembatan putus](evidence/kaca-authored-broken-bridge.png).
- [Audio](evidence/kaca-audio-report.json): render 8 detik per bioma menggunakan sequencer produksi pada OfflineAudioContext; sinyal terukur, tidak clipping dan mute menghasilkan nol sinyal. Pratinjau WAV ada di `artifacts/kaca-audio-preview.wav`. Bukan penilaian kualitas speaker, rasa musik atau latensi fisik.
- [Kontrol keyboard](evidence/glass-keyboard-report.json), [dua controller browser](evidence/glass-direction-report.json) dan [perpindahan instan](evidence/kaca-instant-stage-report.json) mencatat cakupan sebenarnya; fixture perubahan stage bukan penuntasan rute lewat dua HP.

Keseruan, fairness, keterbacaan timing dan kenyamanan kamera wajib dinilai ulang lewat playtest pasangan. Dua HP fisik, pengukuran GPU/frame time sepuluh menit dan input-to-photon tetap belum lulus gerbang acceptance. Kelulusan bot berpengetahuan map tidak menggantikan hasil pengguna.
