# 03 — Rekomendasi game untuk couple

Nama dan aturan di bawah adalah desain game orisinal. G01–G03 sudah tersedia pada beta pertama; status acceptance dan batas implementasi dijelaskan di [laporan beta](11-implementasi-beta.md). G04–G12 tetap usulan ekspansi. Skor kecocokan adalah penilaian desain, bukan hasil studi pengguna. Prioritas mempertimbangkan kenyamanan HP, biaya pembuatan, variasi dan peluang kerja sama.

## Katalog rekomendasi

| ID / nama kerja | Pemain; ronde | Inti dan kontrol | Alasan cocok untuk pasangan | Prioritas / kompleksitas |
|---|---|---|---|---|
| G01 Orbit Berdua | 2; 3–5 menit | Dua pesawat mengumpulkan energi dan mengaktifkan gerbang; pad gerak | Tujuan bersama, saling menolong, mudah menguji respons LAN | Rilis awal; rendah–sedang |
| G02 Kebun Berdua | 2; 5–8 menit | Bergerak di grid, tanam/siram/panen; arah + aksi | Santai, koordinasi pekerjaan, hasil visual bersama | Rilis awal; rendah–sedang |
| G03 Seirama | 2; 5–10 menit | Jawab preferensi sendiri dan tebak pasangan; pilihan privat | Lebih mengenal kebiasaan tanpa refleks cepat | Rilis awal; rendah |
| G04 Dapur Berdua | 2; 5–7 menit | Susun pesanan dengan dua stasiun; gerak + interaksi | Pembagian peran dan kekacauan lucu yang terkendali | Ekspansi pertama; sedang–tinggi |
| G05 Paket untuk Kita | 2; 3–5 menit | Angkut barang berdua melewati rute; gerak + angkat | Butuh komunikasi dan tempo bersama | Ekspansi; sedang–tinggi |
| G06 Jembatan Cahaya | 2; 5–10 menit | Sakelar dan jembatan dengan informasi berbeda; arah + aksi | Puzzle komunikasi dan bergantian memimpin | Ekspansi; sedang |
| G07 Lukis & Tebak | 2; 5–8 menit | Satu menggambar di HP, satu menebak; canvas/keyboard | Kreatif, lucu, tekanan mekanik rendah | Ekspansi; sedang |
| G08 Ritme Senja | 2; 3–4 menit | Saling melengkapi pola ketukan; dua tombol besar | Duet musikal dengan mode latihan | Ditunda hingga kalibrasi latensi; tinggi |
| G09 Rally Mini | 2; 3–5 menit | Balap top-down, kemudi kiri/kanan dan rem | Duel singkat, kontrol sederhana, rubber-band opsional | Ekspansi duel; sedang |
| G10 Bola Duo | 2; 3–5 menit | Dua pemain vs bot atau duel gawang; gerak + tendang | Olahraga arcade mudah dibaca | Ekspansi; sedang–tinggi |
| G11 Piknik Puzzle | 2; 5–10 menit | Susun barang/tangram bersama; pilih/putar/tempatkan | Santai, perencanaan bersama, toleran jaringan | Ekspansi santai; rendah–sedang |
| G12 Benteng Berdua | 2; 5–8 menit | Bertahan dari gelombang, peran gerak/dukungan; gerak + aksi | Saling melindungi dan upgrade bersama | Ekspansi; tinggi |

**Rekomendasi utama:** mulai dengan G01 untuk menguji kontrol, G02 untuk pengalaman kooperatif santai, dan G03 untuk variasi berbasis percakapan. G04 paling menarik sebagai unggulan berikutnya, tetapi sistem resep, AI antrean dan balancing membuatnya kurang tepat sebagai prototipe pertama. Jangan membuat 12 game sekaligus.

Hindari FPS kompetitif, fighting dengan combo presisi, platformer berulang yang menghukum, dan rhythm ketat sebagai game pertama. Tantangannya tidak sebanding dengan keterbatasan sentuhan dan variasi latensi. Itu keputusan cakupan produk, bukan klaim bahwa jenis game tersebut mustahil.

## G01 — Orbit Berdua: aturan rilis awal

**Fantasi:** dua penjelajah membawa cahaya pulang. Kamera top-down satu arena tanpa split-screen. P1 coral, P2 mint; keduanya setara dan dapat bertukar ikon.

- Kontrol: satu area gerak; gerak diagonal dinormalisasi. Kecepatan dasar 180 unit/detik di arena logis 1280×720. Tidak ada tembak, lompat atau kamera manual.
- Tujuan: kumpulkan 12 energi bersama, lalu aktifkan dua pad gerbang dengan menempatinya bersamaan selama 2 detik. Progress pad reset saat salah satu meninggalkan area.
- Struktur: tiga arena awal, masing-masing satu ronde. Level 1 tanpa bahaya untuk belajar; level 2 menambah puing bergerak; level 3 menambah gerbang bergantian. Posisi energi dan lintasan puing memakai seed yang dapat diuji.
- Bantuan pasangan: tabrakan puing membuat pesawat nonaktif maksimal 3 detik. Pemain lain yang mendekat selama 1 detik mempercepat pemulihan; selalu ada auto-recovery agar ronde tidak buntu. Energi terkumpul tidak hilang.
- Mode santai: tanpa deadline. Tantangan: target selesai 180 detik; jika waktu habis boleh lanjut tanpa medali. Tidak ada game over yang memaksa mengulang.
- Hasil: selesai, waktu aktif, energi terkumpul dan jumlah bantuan tim; medali tim 3 untuk ≤120 detik, 2 untuk ≤180 detik, 1 untuk selesai. Mode santai tidak dibandingkan pada leaderboard tantangan.
- Ulang: reset arena dengan seed sama; pilihan arena berikutnya di layar hasil. Collision dengan dinding membuat pemain bergeser, bukan terjebak.
- Acceptance: dua pemain berkontribusi pada gerbang; recovery bekerja; pause menghentikan timer dan puing; seed sama menghasilkan kondisi awal sama; aksi tetap nyaman dengan dua HP selama 10 menit.

**Batas aset:** tiga arena dengan variasi geometri/palet, dua pesawat sederhana, satu tipe puing, satu tipe energi, efek audio lokal. Tidak memerlukan fisika rigid-body atau model kompleks.

## G02 — Kebun Berdua: aturan rilis awal

**Fantasi:** siapkan kebun kecil untuk piknik bersama. Papan 8×6, 12 petak tanam, dua kotak bibit, sumur dan peti panen. Kedua pemain boleh melakukan semua pekerjaan; tidak ada peran permanen.

- Kontrol beta.3: analog untuk langkah grid; tombol langsung Tanam, Siram, Panen dan Antar, ditambah Aksi/Bibit serta Jeda. Pemilihan alat dilakukan atomik di server ketika aksi langsung diterima. Satu aksi per tekan; tahan arah mengulang langkah setelah 250 ms, interval 150 ms. Antrean gerak maksimal satu langkah.
- Alur petak: kosong → ditanam → disiram → tumbuh selama 12 detik waktu simulasi → matang → dipanen → kosong. Pemain perlu berdiri di petak tetangga dan menghadap petak target.
- Dua tanaman: wortel dan stroberi; pertumbuhan sama pada rilis awal. Paket piknik butuh masing-masing enam hasil panen, total 12. Satu penggunaan penyiram cukup; tidak ada tanaman mati.
- Interaksi bersamaan diselesaikan server berurutan berdasarkan tick, slot pemain lalu actionSeq. Tidak ada hasil panen ganda. Dua avatar dapat melewati satu sama lain agar tidak saling menjebak.
- Mode santai tanpa deadline; tantangan target 360 detik. Game selesai setelah peti menerima 12 hasil yang diminta; kelebihan panen tidak mengurangi skor.
- Hasil menampilkan kebun bersama dan waktu; target tantangan: 3 bintang ≤240 detik, 2 ≤360 detik, 1 selesai. Nilai balancing sementara, evaluasi lewat playtest.
- Satu peta dasar plus dua variasi penempatan stasiun setelah rilis stabil; rilis awal cukup satu peta dengan dua preset lokasi tanaman.
- Acceptance: resep panen tercapai, pertumbuhan berhenti selama pause, stok tidak negatif, klik ganda tidak menduplikasi panen, instruksi alat terbaca tanpa warna, kedua pemain dapat menyelesaikan semua jenis tugas.

## G03 — Seirama: aturan rilis awal

**Fantasi:** mengenal selera sehari-hari melalui tebakan ringan. Tidak memberikan nilai kecocokan hubungan atau diagnosis apa pun.

- Delapan ronde per sesi, empat pilihan per pertanyaan. A menjadi subjek pada ronde ganjil, B pada genap. Subjek memilih jawabannya; pasangan memilih tebakan.
- Server memilih delapan pertanyaan unik dari paket bawaan 40 pertanyaan Indonesia. Paket harus ditulis sendiri dan diperiksa untuk ambiguitas, stereotip, sensitivitas serta keterbacaan.
- Contoh: pilihan aktivitas akhir pekan, rasa camilan, suasana liburan, atau jenis film. Hindari detail seksual, trauma, konflik, uang pribadi dan informasi identitas pada paket default.
- Jawaban di HP tersembunyi dari layar bersama dan pemain lain. Setelah keduanya konfirmasi, masing-masing melihat tombol Siap Ungkap. Reveal hanya terjadi ketika keduanya menekan tombol tersebut.
- Lewati dapat dipilih siapa pun, kapan pun sebelum reveal. Ronde dilewati tidak menampilkan jawaban dan tidak dihitung sebagai salah. Tidak perlu memberikan alasan.
- Santai tanpa timer. Tantangan opsional memberi pengingat 45 detik tanpa membuka jawaban otomatis. Tidak ada penalti karena lambat.
- Hasil: jumlah tebakan sama dari ronde yang benar-benar diungkap, bukan persentase kualitas hubungan. Jika semua dilewati, tampilkan sesi selesai tanpa skor. Pertanyaan dapat menjadi bahan obrolan; keduanya menekan Lanjut untuk ronde berikutnya.
- Acceptance: packet ke display dan HP lain sebelum reveal tidak mengandung jawaban subjek; reconnect tidak membocorkan pilihan; skip menghapus jawaban ronde; rematch membersihkan jawaban sebelumnya; soal tidak berulang dalam satu sesi.

## G04 — Dapur Berdua: batas ekspansi

Satu dapur top-down, dua pemain, tiga resep maksimal tiga langkah: ambil bahan, proses di stasiun, sajikan. Dua order aktif, tanpa api/kematian; santai tanpa order kedaluwarsa, tantangan 5 menit. Aksi kontekstual satu tombol. Uji aktivitas cukup untuk dua orang dan hindari satu pemain menjadi penonton. Susun spesifikasi resep/collision dan tes baru sebelum implementasi; aturan ini belum gerbang rilis terperinci seperti G01–G03.

## Pola ekspansi

Setiap game tambahan harus mempunyai tujuan, input, jumlah pemain, durasi, mode santai, state machine, kondisi selesai, kebijakan disconnect, anggaran aset dan acceptance sendiri. Informasi privat di HP perlu proyeksi data khusus. Nilai replay diperoleh dari seed/peta/pertanyaan, bukan menambah kompleksitas tombol.
