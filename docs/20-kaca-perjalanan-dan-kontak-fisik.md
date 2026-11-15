# 20 — Perjalanan berkelok dan kontak fisik Kaca

Revisi 15 November 2026 menggantikan aturan sudut, aperture, tekanan dan jangkauan pada laporan 14–19. Arahan pengguna: tantangannya menjaga kaca dari benturan nyata, bukan memenuhi angka kemiringan.

Kaca bebas digulingkan sepanjang 360° atau ditahan pada sudut apa pun. Tidak ada banner melayang, sudut wajib, toleransi derajat, atau pecah akibat tekanan/jangkauan lengan. Naik/turun tetap mengubah tinggi pegangan. Kaca pecah jika bidang atau bingkai sungguh menyentuh benda padat, tanah, atau badan pembawa. Retry manual serta jatuh ke jurang merupakan pemulihan checkpoint, bukan tambahan hitungan pecah.

Geometri tampilan dan collider berasal dari bagian dunia yang sama. Bidang tipis serta empat batang bingkai diuji terpisah; daun kerucut, batu bersegi dan atap prisma memakai convex hull agar sudut kosong bounding box tidak dianggap benturan. Badan berjalan dengan sweep dan bergeser di sisi rintangan. Ini simulasi permainan deterministik, bukan mesin rigid-body umum.

## Dunia dan kamera

Enam dunia dan 60 stage memakai spline berkelok, hairpin dan perubahan arah; empat checkpoint harus didatangi pada koordinat dunia. Kamera mengikuti pusat tim dengan pandangan ke tikungan berikutnya, perubahan heading halus, jarak berdasarkan tikungan/separasi, serta pemeriksaan halangan. Analog bergerak relatif kamera.

Mobil parkir, tiang listrik berkabel, rumah, pohon, batang tumbang dan batu menggantikan gate aturan. Stage lanjut mempunyai lubang tanah nyata dengan platform maju, menyamping atau lift vertikal. Penumpang mengikuti translasi/rotasi platform. Palu berputar dan kapak mengayun memiliki poros, penopang dan kepala collider bergerak, bukan hitbox abstrak. Tidak ada pergantian stage atau kesulitan pada controller biasa.

## Referensi dan aset

Memeriksa screenshot resmi dan cuplikan trailer pada [Steam Carry The Glass](https://store.steampowered.com/app/3263320/Carry_The_Glass/): lintasan lingkungan, perjalanan vertikal/platform dan rintangan mekanis. Ini pemeriksaan materi resmi, bukan klaim sudah memainkan game tersebut. Pencarian repositori dengan nama persis tidak menemukan peta sumber terbuka yang lisensinya dapat diverifikasi. Peta implementasi ini orisinal; tidak menyalin peta atau aset game komersial. Gambar referensi hanya di direktori sementara, tidak didistribusikan. Geometri baru dibuat prosedural dalam proyek tanpa tambahan aset pihak ketiga.

## Bukti dan batas

- TypeScript/build dan 45 tes lulus; regresi kontak nyata, guling bebas, tanah, badan, bentuk convex, kamera, checkpoint dan platform pada `tests/glass.test.ts`.
- [Fixture visual enam dunia](evidence/kaca-winding-visual-report.json), [tinjauan rute](evidence/kaca-winding-overview.png): fixture statis, bukan bukti menempuh rute.
- [Pemeriksaan rute](evidence/kaca-winding-course-report.json): lihat status dan jumlah aktual dalam laporan. Pengendali sintetis mengetahui geometri dan memprediksi waktu; tidak memakai teleport/kekebalan. Ini bukan ukuran kesulitan manusia.
- [Keyboard browser](evidence/glass-keyboard-report.json): dua slot sintetis; bukan dua keyboard/HP fisik.

Playtest pasangan, dua HP nyata, rasa kamera pada tikungan, balancing rintangan dan pengukuran frame time/input-to-photon tetap perlu dilakukan. Target acceptance fisik tidak dinyatakan lulus berdasarkan simulasi.

Pemeriksaan lintasan terakhir meluluskan 31 stage/124 checkpoint, lalu pengendali sintetis tersangkut di platform menyamping stage 32. Hasil seluruh 60 stage belum lulus; perlu membedakan keterbatasan pengendali uji dan masalah boarding/keluar railing melalui playtest lanjutan. Tidak menyatakan platform semua stage telah terverifikasi.

Status lanjutan: masalah dermaga/stage 32 dan hasil pemeriksaan terkini dilaporkan di [revisi dermaga dan stage langsung](21-kaca-dermaga-dan-stage-langsung.md). Angka 31 stage di atas adalah hasil checkpoint historis sebelum perbaikan, bukan status terbaru.
