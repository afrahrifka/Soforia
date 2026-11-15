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
| FR-07 | Pemulihan koneksi | Input netral saat gangguan, game terus berjalan, pemain dapat kembali ke slot lama tanpa pemain ganda |
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
| NF-07 | Konsol pulih dari refresh | Snapshot penuh memulihkan layar tanpa pause otomatis; tidak membuat match baru |
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

## Ekspansi 3D — 14 November 2026

Atas permintaan pengguna, render permainan dialihkan ke geometri 3D WebGL lokal (Three.js), dengan controller HP dan aturan otoritatif laptop tetap berlaku. Orbit dan Kebun memakai arena 3D; Seirama mempertahankan teks dan pilihan privat sebagai antarmuka di atas latar 3D. Kota Berdua menambah duel properti orisinal dua pemain. Ini memperluas baseline tiga game; target performa wajib diukur ulang. Browser layar konsol kini memerlukan WebGL.

## Masuk dengan satu controller — 14 November 2026

Sesuai permintaan pengguna, host boleh membuka tutorial dan mulai dengan satu controller serta layar laptop. Semua controller yang sudah terdaftar harus tersambung dan siap; pemain yang terputus tetap perlu reconnect. Controller kedua boleh menyusul dan memicu jeda agar keduanya siap. Ini akses awal/pratinjau, bukan mode solo lengkap: gerbang Orbit, jawaban Seirama, dan giliran Kota Berdua masih memerlukan pemain kedua. Tidak ada bot otomatis.

## Pembenahan kualitas 3D — 14 November 2026

Permintaan pengguna menambah aset 3D representatif dan mematangkan game yang ada: model diorama orisinal, geometri/material yang dipakai ulang, label dan HUD, informasi aksi Kebun, pulsa pelindung Orbit, serta Kota Berdua dengan distrik, peningkatan, kejadian dan animasi giliran. Aturan dan inventaris ada pada docs/13-kualitas-game-3d.md. Target performa fisik dan gerbang rilis tetap perlu dibuktikan; kualitas visual otomatis tidak membuktikan keseruan atau balancing.

## Kaca Berdua dan Jeda kecil — 14 November 2026

Atas permintaan pengguna, katalog bertambah permainan angkut kaca orisinal dengan 60 layout deterministik, enam dunia, dan 240 checkpoint. Sesuai klarifikasi pengguna: analog kiri untuk karakter, kanan untuk ujung kaca/rotasi, satu tombol Lompat, serta kamera otomatis tanpa pengaturan manual. Jeda semua game pindah menjadi utilitas kecil seperti Home, di luar area aksi. Rincian aturan, aset, kontrol dan bukti berada pada docs/14-kaca-berdua.md. Fokus dua pemain LAN dengan server laptop otoritatif tetap berlaku; penerimaan perangkat fisik dan kualitas playtest belum selesai.

## Aset pihak ketiga dan pembawa elastis — 14 November 2026

Arahan pengguna terbaru mengizinkan aset CC0 yang relevan dari internet serta public/lib portofolio. Pengecualian ini tidak mengizinkan penyalinan kode/game portofolio. Pustaka 1.053 model dilengkapi sumber, lisensi dan checksum. Kaca Berdua beralih dari tubuh yang terkunci ke bingkai menjadi pose bingkai independen dan dua lengan beruas per karakter, dengan target jangkauan 1,4 unit. Kamera perspektif mengikuti tim otomatis. Detail, inventaris dan batas simulasi ada pada docs/15-aset-dan-karakter-elastis.md; acceptance fisik/performa belum berubah.

## Jeda hanya atas tindakan pengguna — 14 November 2026

Arahan terbaru mengganti kebijakan pause otomatis sebelumnya, termasuk saat controller kedua bergabung. Semua game terus berjalan saat layar konsol/controller terputus, input terlambat, tab kehilangan fokus/masuk background, bantuan dibuka, atau tick laptop terlambat. Hanya tombol Jeda pada controller yang mengirim perintah pause. Input basi/terputus dinetralkan, tanpa menghentikan simulasi. Mulai permainan tidak mensyaratkan koneksi layar laptop. Tutorial, countdown, hasil, dan retry checkpoint tetap merupakan alur permainan. Server yang berhenti atau laptop tidur tentu tidak dapat menjalankan simulasi; setelah tick kembali tidak dibuat state pause otomatis.

## Revisi map dan kontrol Kaca — 14 November 2026

Atas arahan pengguna terbaru, map Kaca memakai jalur konstruksi bertingkat dengan platform/ramp yang berbagi definisi collision dan render. Karakter memakai torso kapsul, bahu kontinu, dan interpolasi visual snapshot. Kecepatan jalan menjadi 3,8 unit/detik. Kontrol dua analog sebelumnya diganti satu analog di sudut bawah dan tombol tahan Putar kiri/kanan, Naikkan/Turunkan, serta satu tombol Lompat. Preferensi tangan kiri mencerminkan posisi. Perubahan ini menggantikan kontrol Kaca sebelumnya; kebijakan Jeda manual tetap berlaku. Rincian dan batas bukti: [revisi Kaca](docs/16-kaca-map-gerak-controller.md).

## Empat sudut dan kemiringan kaca — 15 November 2026

Klarifikasi pengguna menetapkan dua tangan pada dua sudut per pemain (empat titik pegangan total). Putaran Kaca adalah kemiringan pada bidang kaca, horizontal ↔ vertikal, bukan yaw depan–belakang. Pegangan kiri/kanan berubah menjadi bawah/atas pada ±90°. Tanah dan jepitan dua badan memecahkan kaca; tidak ada kekebalan collision spawn/checkpoint. Seluruh 60 stage disusun menjadi rangkaian tantangan sudut parsial/tegak, tinggi, lompat dan timing. Detail ambang, arti rintangan, perubahan jangkauan lengan, bukti, serta batas playtest ada pada [laporan empat sudut](docs/17-kaca-empat-sudut-dan-tantangan.md).

## Mode uji keyboard Kaca — 15 November 2026

Atas permintaan developer untuk menguji kelayakan game, layar operator lokal mempunyai pengecualian terbatas dari display-only: F2 mengaktifkan dua slot keyboard khusus Kaca tanpa HP. Aktivasi memerlukan katalog dan slot controller/pairing kosong. Pesan `dev.keyboard` hanya diterima dari display yang terautentikasi melalui port operator loopback; perintah display umum tetap ditolak. Simulasi tetap otoritatif di server. F3 mengembalikan slot untuk controller HP. Ini alat uji lokal, bukan pengganti acceptance dua HP atau pengukuran performa fisik.

## Menu konsol ungu — 15 November 2026

Atas permintaan pengguna, katalog dirombak mengikuti pola pemilihan game konsol PS5: deretan sampul horizontal, satu game terpilih dengan judul besar dan ilustrasi utama, status pemain ringkas, QR di sudut, serta teks singkat. Identitas dasar berubah menjadi ungu gelap untuk halaman menu. Artwork lokal orisinal dipakai ulang; tidak menambah ketergantungan internet. Navigasi HP, pairing, dan pengecualian mode uji keyboard Kaca tetap tersedia.

## Layar permainan penuh dan QR atas permintaan — 15 November 2026

Atas arahan pengguna, setelah membuka game layar operator hanya menampilkan arena beserta HUD/overlay permainan; navbar, judul luar arena, footer dan petunjuk keyboard permanen dihapus. Arena/canvas memenuhi viewport, termasuk tutorial, jeda dan hasil. QR tidak muncul otomatis selama game. Hanya pemain 1 mempunyai tombol utilitas kecil untuk menampilkan/menyembunyikan QR di layar laptop, tanpa pause. Undangan kedaluwarsa diperbarui saat QR dinyalakan. Pemain 2 bergabung menutup QR; saat dua slot terisi tombol dinonaktifkan. QR dashboard diperbesar menjadi 160–240 px (150 px pada viewport pendek).

## Pemulihan HP dan menu sederhana — 15 November 2026

Atas laporan pengguna, timeout heartbeat 3,5 detik kini langsung melepas koneksi macet dan menetralkan input. Slot tetap mempunyai identitas tetapi tidak dihitung sebagai koneksi aktif/penghalang scan ulang. HP menyimpan secret pemulihan acak serta token resume di penyimpanan browser lokal; scan dari tab baru pada browser/origin yang sama memulihkan slot yang sama, termasuk saat token resume terakhir sudah diputar. Identitas dapat dipulihkan selama sesi server masih ada; reset/server restart atau penggantian slot membatalkan credential lama. Ini mengganti batas resume 120 detik sebelumnya. Pengganti perangkat lewat QR hanya mengisi slot yang terputus; jawaban privat Seirama yang belum diungkap pada slot pengganti dibersihkan. Watchdog client tanpa snapshot >4 detik, event online, dan kembali dari background mencoba menyambung ulang. Tidak ada pause otomatis atau slot ketiga.

Controller biasa tidak lagi menampilkan pilihan mode/kesulitan, arena, atau pemilih stage. Server menolak perubahan `mode`/`level` dari controller biasa. Pemilihan stage hanya melalui mode developer keyboard F2 di layar operator lokal, menggunakan [ / ]. Perpindahan ke stage selanjutnya setelah menyelesaikan stage tetap merupakan progres permainan.

## Konsistensi arah angkat/putar Kaca — 15 November 2026

Pemetaan keyboard Q/E dan U/O yang terbalik terhadap HP diperbaiki melalui definisi kontrol bersama. Q/U dan Miring kiri memberi putaran berlawanan jarum jam dilihat dari kamera permainan (sisi kiri turun, kanan naik); E/O dan Miring kanan kebalikannya. Naikkan menaikkan sisi pegangan masing-masing pemain; kedua pemain mengangkat bersama menaikkan pusat kaca tanpa putaran. Render, empat pegangan dan collision tetap memakai transformasi bidang kaca yang sama. Perbaikan ini menyelaraskan kontrol yang sudah disepakati, tanpa menambah mode atau mengubah stage.

## Dashboard dikendalikan kedua pemain — 15 November 2026

Atas permintaan pengguna, kedua controller A/B dapat menggeser pilihan game dan menekan Main/Main lagi. Dashboard tetap mempunyai satu pilihan bersama yang ditentukan server sesuai urutan pesan diterima. Analog dan tombol Main tersedia pada kedua HP; tidak membutuhkan perpindahan host. Hak reset sesi/pairing tetap pada pemain 1, dan pemilih stage tetap khusus developer. Laptop tetap display-only di luar mode developer.

## Guling pada sumbu panjang, collision badan dan arena alami — 15 November 2026

Klarifikasi pengguna terbaru mengganti penafsiran putaran bidang XY sebelumnya: kaca harus berguling pada sumbu panjang di antara kedua pembawa, seperti benda telentang yang berguling. Kaca awal mendatar, dapat berputar penuh melewati 360°, dengan angkat/turun tetap terpisah dari guling. Empat tangan, render, ketebalan dan collision mengikuti pose 3D yang sama; bingkai tantangan diperbarui mengikuti guling. Ini menggantikan ketentuan sebelumnya bahwa putaran bukan depan–belakang.

Karakter tidak boleh menembus benda padat. Collision badan diperkuat untuk gerak diagonal, tembok tipis, tarikan lengan, dorongan badan dan balok bergerak. Arena diganti menjadi jalan di atas tanah, hutan dan permukaan asteroid/bulan, dengan benda lingkungan dari data collision yang sama. Detail dan bukti: [guling dan arena alami](docs/19-kaca-guling-dan-arena-alami.md). Fokus dua pemain LAN, server otoritatif, Jeda manual, dashboard dua controller dan pemilih stage khusus developer tetap berlaku.

## Revisi kontak fisik dan perjalanan Kaca — 15 November 2026

Arahan pengguna menggantikan seluruh gate sudut wajib/derajat, aperture aturan dan pecah akibat tekanan/jangkauan sebelumnya. Hanya kontak nyata bidang/bingkai dengan benda padat, tanah atau badan memecahkan kaca. Tidak ada banner dunia melayang. Retry/jatuh tanpa kontak tidak menambah pecah. Rute dunia berkelok dengan kamera otomatis relatif analog, lingkungan alami dan platform/palu/kapak fisik; otoritas server, LAN dan fokus dua pemain tetap. Rincian dan batas: docs/20-kaca-perjalanan-dan-kontak-fisik.md.

## Perpindahan stage Kaca langsung — 15 November 2026

Saat kedua pembawa mencapai checkpoint akhir dengan kaca utuh, server langsung menaikkan stage dan menempatkan tim di awal map berikutnya dalam tick yang sama. Tidak ada persetujuan pemain, countdown, panel selesai stage atau masa tunggu. Input tahan tetap aktif di controller; interpolasi visual tidak menyambungkan posisi antar-map. Stage terakhir menutup permainan melalui hasil akhir. Penghitung checkpoint, pecahan progres stage dan jarak sisa tidak ditampilkan; checkpoint internal tetap menyimpan lokasi retry. Pendekatan dermaga diluruskan dan ruang sapuan platform dibebaskan dari objek lingkungan; kontak pagar bergerak diselesaikan agar badan tidak terkunci di dalam collider.

## Tantangan fisik dan audio Kaca — 15 November 2026

Hasil playtest pengguna membatalkan anggapan bahwa kelulusan rute lama membuktikan kualitas stage. Map diganti 60 rangkaian encounter bernama, 16 jenis tantangan, enam bioma berganti per stage, rute terbuka dan 246 checkpoint internal. Benda padat membatasi jalan samping; lebar/tinggi/bukaan, celah lantai dan mesin nyata menuntut perubahan formasi, guling, angkat/turun, lompat dan timing bersama. Tidak ada syarat sudut atau pecah abstrak. Audio orisinal lokal pada laptop mencakup musik per bioma dan event permainan; host dapat mute bersama, laptop mempunyai mute lokal M. Perpindahan stage instan dan HUD tanpa jarak/progres tetap berlaku. Bukti, referensi dan batas: docs/22-kaca-tantangan-dan-audio.md.

## Keputusan arsitektur kolaborasi — 15 November 2026

Atas permintaan pengguna, dashboard, platform LAN dan setiap game dipisahkan dalam modul dengan kepemilikan path eksplisit. `src/games/<id>/manifest.json` menjadi deklarasi katalog; generator menemukan modul tanpa daftar game manual. Server, console laptop, controller HP, HUD, CSS, tes dan status game wajib berada dalam folder game itu. Scope dashboard tidak boleh mengedit game; scope game tidak boleh mengedit game lain, dashboard atau platform. Perubahan API bersama/migrasi memerlukan scope terpisah yang diotorisasi. Kontrak dan guard dijelaskan pada [laporan arsitektur](docs/23-arsitektur-modul-dan-kolaborasi.md).

Pemisahan source dan bundle mempertahankan satu proses server otoritatif, dua pemain serta operasi LAN offline. Tidak menambah cloud/matchmaking atau isolasi proses. README multibahasa dan adapter AI merupakan dokumentasi kolaborasi; penegakan dilakukan pemeriksaan batas impor/CSS/diff, tes dan review. Tidak menjanjikan kepatuhan universal AI. Proteksi merge GitHub harus diaktifkan pemilik; konfigurasi lokal bukan bukti bahwa proteksi remote sudah aktif.
