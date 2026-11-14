# Spesifikasi induk — Main Bareng v0.1

Tanggal: 14 November 2026. Status: baseline persyaratan; beta pertama sudah tersedia, lihat docs/11-implementasi-beta.md. Seluruh target performa fisik tetap perlu dibuktikan.

## Tujuan dan batas

Bangun aplikasi konsol lokal untuk dua orang yang duduk di depan satu layar. Laptop menjalankan server, aturan game, render dan audio; masing-masing HP menjalankan controller browser. Tampilan katalog terinspirasi pengalaman konsol: kartu game, pratinjau, transisi halus dan profil pemain, dengan identitas visual sendiri.

Produk merupakan kumpulan game orisinal. Tidak mencakup game PlayStation asli, emulator, streaming video, akun cloud, matchmaking internet, chat/voice, pembayaran, iklan, atau kebutuhan instalasi aplikasi HP. Dukungan 3–4 pemain adalah ekspansi; dukungan delapan pemain tidak menjadi janji rilis.

## Persyaratan terukur

| ID | Kebutuhan | Bukti penerimaan |
|---|---|---|
| FR-01 | Server lokal dan satu layar konsol | Aplikasi berjalan pada laptop dan menampilkan katalog tanpa internet setelah distribusi tersedia |
| FR-02 | Pairing QR otomatis tanpa formulir/persetujuan, alamat manual memakai kode | Dua HP bergabung ke sesi yang sama, mendapatkan slot berbeda; alamat IP tidak memakai localhost pada QR |
| FR-03 | Lobby dan host | Pemain A/B otomatis, siap/belum siap, koneksi; HP A menggeser sorotan dengan analog dan memulai dengan tombol Main. Laptop display-only, termasuk penolakan mutasi di server |
| FR-04 | Controller dinamis | Controller HP memenuhi viewport tanpa header/footer; analog kiri, Home kecil, dan minimal empat aksi kanan sesuai game. Fullscreen dicoba otomatis dan melalui gesture pada browser yang mendukung. |
| FR-05 | Tiga game awal | Aturan Orbit Berdua, Kebun Berdua, Seirama sesuai katalog dan lolos tes dua HP |
| FR-06 | Siklus sesi | Tutorial, siap, countdown, main, pause, hasil, rematch dan kembali katalog tersedia dari controller |
| FR-07 | Pemulihan koneksi | Input netral saat gangguan, game pause, pemain dapat kembali ke slot lama tanpa pemain ganda |
| FR-08 | Offline | Cabut WAN selama startup, pairing, bermain dan rematch; fungsi inti tetap berjalan |
| FR-09 | Preferensi | Volume, mute, reduced motion, ukuran tombol, sisi kontrol dan mode santai tersimpan lokal bila diizinkan |
| FR-10 | Privasi | Jawaban Seirama tersembunyi sampai reveal; reset sesi menghapus jawaban dan identitas sementara |
| FR-11 | Diagnosis | Status IP/port dan heartbeat/RTT; panduan guest isolation/firewall tanpa mengubah sistem otomatis |
| FR-12 | Ekstensibilitas | Game baru dapat didaftarkan melalui manifest dan kontrak lifecycle tanpa mengubah pairing |

| ID | Target nonfungsional | Verifikasi |
|---|---|---|
| NF-01 | Render 60 FPS target, 30 FPS minimum pada profil dasar yang dinyatakan | Frame time p95 ≤33,3 ms selama 10 menit di profil dasar; laporkan perangkat sebenarnya |
| NF-02 | Sentuh-ke-gambar p95 ≤80 ms, median ≤50 ms pada jaringan referensi | Kamera ≥120 FPS dengan penanda sentuh; bukan penjumlahan jam HP/laptop |
| NF-03 | Round-trip aplikasi p95 ≤30 ms di LAN referensi | ≥1.000 ping dengan beban dua controller; ukur terpisah dari NF-02 |
| NF-04 | Dua pemain stabil ≥30 menit | Tanpa crash/input macet/kebocoran slot; uji soak 2 jam sebelum rilis |
| NF-05 | Tidak ada ketergantungan runtime cloud | Tidak ada request internet ketika bermain; aset/font/audio/controller tersaji lokal |
| NF-06 | Aksesibilitas dasar | Label dan bentuk selain warna, mode tanpa audio, reduced motion, tombol besar, skip konten |
| NF-07 | Konsol pulih dari refresh | Snapshot penuh memulihkan layar, pause sampai layar siap; tidak membuat match baru |
| NF-08 | Integrasi aman | Tidak memakai port atau konfigurasi deployment lain; default port 3210 dengan pilihan alternatif |

Profil referensi: laptop RAM 8 GB, SSD, GPU terintegrasi; dua HP fisik Android/iOS yang dicatat saat tes; laptop Ethernet atau Wi-Fi 5 GHz, HP Wi-Fi 5 GHz pada AP yang sama tanpa WAN. Ini sasaran awal, bukan minimum hardware terverifikasi. Host Linux menjadi target pertama; Windows/macOS diuji pada checkpoint distribusi.

## Definisi rilis pertama

Semua FR dan NF di atas mempunyai bukti; tiga game dapat dimainkan dua orang; startup dan QR diuji dengan WAN mati; gangguan koneksi tidak menyebabkan kontrol macet; paket sumber dan petunjuk menjalankan tersedia; aset memiliki inventaris lisensi. Jika target performa belum lulus, status tetap beta dan batasnya dilaporkan.

Detail dan keputusan berada pada dokumen yang ditautkan dari README. Perubahan angka atau aturan harus memperbarui dokumen terkait dan matriks tes; jangan menurunkan target hanya untuk meluluskan hasil.

## Perubahan interaksi beta.2 — 14 November 2026

Arahan pengguna terbaru mengganti pairing dengan persetujuan menjadi scan QR langsung diterima. Laptop menjadi display-only, cursor disembunyikan, input halaman dinonaktifkan dan role display ditolak untuk perintah mutasi. Launcher desktop membuka fullscreen kiosk; HP menampilkan controller bergaya stik dengan D-pad dan tombol aksi. Host adalah HP pertama; kapasitas tetap dua. Undangan otomatis dirotasi setelah kedaluwarsa selama katalog menunggu pemain.

## Revisi controller HP beta.3 — 14 November 2026

Controller tidak meniru bentuk stik fisik: HP menampilkan kontrol saja tanpa logo/header/footer/panel informasi. Analog kiri berfungsi untuk katalog, karakter, dan pilihan Seirama. Tombol kanan kontekstual, Home kecil di atas, serta tombol fullscreen kecil. Kebun memakai aksi langsung Tanam/Siram/Panen/Antar, ditambah Interaksi/Bibit dan Jeda. Kedua pemain dapat memakai Home untuk kembali ke katalog. Kontrol mendukung multi-touch dan netral saat cancel/resize/background.

Fullscreen dicoba saat terhubung dan pada gesture pertama. Browser yang menolak atau tidak mendukung Fullscreen API tetap mendapat viewport penuh dengan safe-area dan tanpa scroll; app tidak mengklaim dapat menghapus address bar browser tersebut. Uji perangkat fisik tetap menjadi gerbang penerimaan. Lihat docs/12-controller-hp.md.
