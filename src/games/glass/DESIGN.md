# Rangkaian, checkpoint dan penghalang bioma

Revisi 16 November 2026. Scope `game:glass`; dashboard sudah diselesaikan dan dicommit terpisah (`b7a9238`).

## Rujukan yang benar-benar diperiksa

Halaman resmi [Carry The Glass di Steam](https://store.steampowered.com/app/3263320/Carry_The_Glass/) dan [berita pengembang](https://steamcommunity.com/app/3263320/allnews/) menjelaskan pengangkutan kaca rapuh berdua, fisika, serta variasi checkpoint antarmode. Empat screenshot resmi diambil sementara dari API Steam untuk inspeksi visual, tidak dimasukkan sebagai aset repo:

- [Pijakan sempit berurutan dan palu](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3263320/6f1f47b133671d2e294b8044b00a564a2e6488f7/ss_6f1f47b133671d2e294b8044b00a564a2e6488f7.1920x1080.jpg): posisi kedua pembawa berbeda, jalur pijakan bersambung dan ancaman bergerak hadir bersamaan.
- [Pijakan dan perpindahan melingkari mercusuar](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3263320/3de064b51f84d8eaf7a0ab8e6a4f3e091f9ddd7f/ss_3de064b51f84d8eaf7a0ab8e6a4f3e091f9ddd7f.1920x1080.jpg): lingkungan perjalanan dan perubahan posisi pasangan membentuk tantangan.
- [Jembatan sempit dan palu pada bioma bersalju](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3263320/33bf3c84af426b40aa824666ee1e2a9ba8db35c9/ss_33bf3c84af426b40aa824666ee1e2a9ba8db35c9.1920x1080.jpg).

Kesimpulan desain kita: aksi perlu saling terkait, posisi pembawa perlu berubah, dan checkpoint menutup rangkaian bermakna. Angka 2–6 encounter per checkpoint di bawah merupakan keputusan orisinal proyek, bukan klaim menyalin jumlah/posisi checkpoint game asli. Inspeksi materi resmi bukan klaim memainkan/menonton seluruh walkthrough. Tidak menyalin map, kode, musik atau artwork game asli.

## Susunan aktif

`glass-levels.ts` mendefinisikan segmen setiap stage. Checkpoint pertama mencakup dua encounter, berikutnya tiga, empat, lima, dan enam pada stage final yang memiliki lima segmen. Nama, urutan anchor, bioma dan tempo berbeda di 60 stage. Satu encounter dapat mencakup beberapa rintangan fisik yang memerlukan aksi bersamaan; jumlah encounter bukan jumlah objek.

- `threadHop`: satu baris pembawa di lorong selebar satu orang, kaca digulingkan agar muat, lalu ambang berurutan dilompati tiap pemain pada waktu berbeda. Segmen awal memakai dua ambang, segmen lanjut tiga.
- `threadBridge`: pijakan sempit berpenyangga di sela lubang; pembawa melompat bergantian sambil menjaga guling dan jarak. Segmen awal dua celah, segmen lanjut empat celah/tiga pijakan, tanpa checkpoint di tengahnya.
- `threadHammer`: lorong satu baris/guling dan sapuan palu fisik dengan kesempatan menunggu sebelum masuk.
- Rangkaian menghubungkan ketiganya dengan muatan angkat, palang merunduk, rak beda tinggi, lalu lintas, piston, mesin bergantian, platform/feri/lift dan ancaman lain yang sudah ada. Berhasil melewati satu objek tidak langsung menyimpan progres.

Checkpoint berada di ruang jeda setelah encounter terakhir satu segmen. Retry kembali ke checkpoint terakhir, bukan ambang terakhir. Stage langsung berpindah pada checkpoint akhir; tidak ada penghitung jarak selesai, banner aturan atau pilihan kesulitan baru.

Tidak ada syarat sudut tersembunyi. Bentuk badan, kaca, tanah, bangunan, batang/cabang, batu dan mesin memakai collider yang sama dengan representasi geometrinya. Formasi/guling alternatif yang memang tidak menyentuh benda tetap sah.

## Sisi jalan merupakan lingkungan

Tidak ada properti `boundary` generik pada course baru. Kota memakai bangunan/rumah berimpit dengan variasi warna/tinggi dan fasad; pabrik memakai gudang. Hutan memakai batang/kanopi rapat, pohon tambahan bervariasi dan batu. Ngarai memakai massa batu/mesa tertanam; planet memakai batu/kristal; gletser memakai bongkah es/batuan. Lapisan batu berselang mengisi sela, bukan dinding tak terlihat. Semua benda padat tetap dapat disentuh dan memecahkan kaca.

Benda mengikuti chord tepi tikungan. Overlap ujung dibuat kecil di sisi dalam agar tidak menjepit pembawa; tikungan diperlebar radiusnya. Jangkauan papan bergerak dan dermaga tetap mempunyai ruang sapuan. Indeks spasial mengurangi kandidat collision/proyeksi pada map yang lebih panjang; tes membandingkan kontak lokal dengan geometri penuh. Ini optimasi kandidat, bukan penghapusan collision.

## Batas penerimaan

Tes geometri tidak membuktikan perjalanan; simulasi input map-aware tidak membuktikan keseruan. Laporan rute aktif memisahkan jumlah stage/checkpoint yang sungguh lulus, aksi dan kegagalan. Fixture visual bukan uji HP nyata/FPS. Playtest pasangan tetap perlu menilai keterbacaan perubahan formasi, durasi rangkaian, keadilan benturan, tempo mesin dan kamera sebelum balancing dinyatakan diterima.

## Identitas arena dan progres — revisi 16 November 2026

`glass-arenas.ts` mendefinisikan **60 siluet perjalanan authored**, bukan memilih lagi satu dari 12 rute berulang. Setiap stage mempunyai susunan arah sendiri: S dermaga, tepi sungai, siku ventilasi, tapal kuda, spiral orbit, retakan diagonal, kilat, cakar dan pola terbuka lainnya. Poligon perjalanan tetap terbuka; tikungan mempunyai plaza untuk mengubah posisi dua pembawa. Profil ketinggian dan ritme antar-encounter mengikuti data level. Jarak mesin/platform yang besar dijaga agar dermaga tidak bertumpuk dengan rintangan berikutnya.

Komposisi rangkaian tidak lagi diambil dari prefix `chains[anchor]`. Anchor dipadukan dengan companion berbeda menurut bioma, rangkaian dan bab. Jumlah encounter per stage naik **10 → 12 → 14 → 16 → 23**. Pada revisi arena awal, checkpoint menutup rangkaian dengan ruang pemulihan sedikitnya 11 unit setelah pusat encounter terakhir; aturan jarak ini diganti oleh revisi pacing di bawah. Semakin jauh babnya, semakin banyak transisi formasi dan mesin baru yang harus dilewati sebelum progres disimpan. Tidak menambah menu kesulitan/stage pada controller biasa.

Tiga bentuk mekanis baru:

- **Iris bintang:** delapan kelopak kristal menarik diri secara radial. Ruang aman benar-benar terbuka; pada fase tertutup ujung kelopak menyentuh muatan.
- **Bilah gunting:** dua bilah berporos berlawanan mengangkat bukaan dari bawah. Pembawa perlu membaca siklus dan menyeberang bersama.
- **Dinding bernapas:** dua massa bergerak ke dalam dan ke luar, mengubah lebar jalan. Memaksa keputusan menunggu atau masuk saat ruang cukup.

Ketiganya mempunyai fase bukaan yang cukup lama untuk dipelajari, lalu menutup dan membuka kembali. Collider dan renderer memakai `propParts` yang sama, termasuk kelopak gem. Pecah tetap akibat kontak volume, tidak menambah sudut wajib atau hukuman di luar sentuhan. Badan melintasi hull batu/daun memakai footprint lingkaran pada irisan tinggi badan, agar lorong diagonal tidak terhalang kotak pembatas tubuh yang lebih lebar daripada model.

Atlas `evidence/arena-atlas.svg`/PNG memperlihatkan seluruh siluet dan posisi encounter; itu peta, bukan screenshot gameplay. Fixture scene dan metadata ada pada `evidence/arena-design-report.json`. Perjalanan harus diuji terpisah melalui input/aksi tanpa teleport/kekebalan. Kelulusan mesin atau keunikan fingerprint tidak membuktikan setiap stage terasa berbeda atau sulit secara adil bagi manusia; playtest pasangan tetap diperlukan.


## Pacing aktif setelah review perjalanan — 16 November 2026

Keluhan review: terlalu banyak berjalan lurus dan jeda yang sama panjang membuat rintangan terasa berulang. Jarak lama 20–28 unit antar pusat encounter kini diganti footprint volume + ruang transisi. Dua palang ringan dapat berdekatan; perubahan dari satu baris ke dua pembawa lebar mendapat ruang untuk keluar lorong dan memutar muatan. Mesin mempunyai tempat tunggu di luar sapuan sebelumnya. Jeda tersebut tidak dimasukkan sebagai “rintangan aktif” dalam pengukuran geometri.

- **Slalom tiga bukaan (`weave`):** tiga celah berganti kiri–kanan–kiri. Pasangan menelusuri jalur berbelok sambil membawa kaca terguling. Amplitudo perpindahan meningkat antarbab; satu garis lurus tidak melewati ketiganya.
- **Tukar sisi tinggi (`tiltWeave`):** dua rak berlawanan, sehingga pembawa yang mengangkat tinggi harus bertukar peran dengan pasangannya sebelum rak kedua. Ada ruang di tengah untuk melakukan pertukaran.
- **Jembatan putar (`turntable`):** celah tanah sungguhan dengan dek berputar dan fase sejajar yang dapat dibaca. Kedua dermaga diratakan setinggi dek agar lereng tidak menjadi anak tangga yang mengunci badan. Putaran mengangkut posisi pembawa melalui transform platform runtime yang sama.

Tikungan besar tetap mengikuti profil authored, dengan resolusi arah untuk mencegah kaki rute yang dipendekkan saling menumpuk. Variasi lekukan kecil hanya ditempatkan jauh dari encounter dan checkpoint. Massa lingkungan yang memotong ruang pembawa dipindah bersama mesh/collider; massa yang tidak bisa ditempatkan dilepas. Lorong aksi memakai dinding tampak, supaya perapian lingkungan tidak menghapus kebutuhan guling/lompat.

Checkpoint biasa berjarak sekitar 3,5 unit sesudah ujung footprint terakhir; akhir formasi satu baris mendapat sekitar 8 unit untuk keluar dari lorong sebelum tikungan. Progres baru tersimpan ketika kedua pembawa sungguh melewati footprint tersebut. Jumlah encounter/rangkaian tetap meningkat 10/12/14/16/23 menurut bab. Kecepatan dasar pemain tidak dinaikkan untuk menyamarkan perjalanan kosong.

`pacing-before.json` menyimpan geometri sebelum revisi; `pacing-comparison.json` mengukur union footprint longitudinal, lubang dan envelope mesin pada empat fase. Nilai ini mengukur jarak, bukan waktu manusia harus berpikir/berkomunikasi. Bukti input sintetis dan pose renderer dilaporkan terpisah. Video arena terdahulu memperlihatkan desain lama dan tidak menjadi bukti hasil pacing baru.
