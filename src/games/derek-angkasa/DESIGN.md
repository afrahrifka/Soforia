# Desain dan acceptance Derek Angkasa

Sumber kebutuhan: [issue #22](https://github.com/oskhar/Soforia/issues/22). Ini permainan perakitan kooperatif dengan tiga modul per ronde, bukan simulator orbital penuh. Rujukan primer dan asal aset dipetakan pada [REFERENCES](REFERENCES.md).

## Pemetaan issue → perilaku yang diterapkan

| Kebutuhan issue | Implementasi | Bukti |
|---|---|---|
| A mengendalikan lengan/capit | Analog XY menggerakkan ujung lengan IK; tindakan tangkap/lepas dan penguncian port | Tes otorisasi, integrasi dua browser dan perjalanan input |
| B mengendalikan rotasi, dorong halus dan rem | Torsi yaw, impuls maju/mundur menurut orientasi, redaman putaran/translasi | Tes input fisik, batas laju, rem dan drift; integrasi analog/rem |
| 3 modul per perakitan | Urutan habitat, surya, teleskop, reaktor, kebun dan relay sesuai misi | 12 misi × 3 pengiriman pada setiap mode |
| Selaras sebelum capit menutup | Jarak ≤0,62 u, galat sudut ≤14°, laju ≤0,42 u/s, putaran ≤0,18 rad/s | Kasus negatif independen dan tangkapan sah |
| Rotasi berlebihan membuat modul menjauh perlahan | Kopling RCS kecil di atas 0,55 rad/s; tidak menghancurkan muatan | Tes drift lalu pemulihan melalui rem |
| Bahan bakar terbatas, pulih di checkpoint | Kapasitas 100 santai / 75 tantangan; terisi setelah pemasangan; konsumsi mengikuti input aktual | Audit sisa bahan bakar semua modul dan tes checkpoint |
| Tidak ada game over / soft-lock | Tabrakan menahan/mendorong; recall tanpa batas; kosong memanggil tug setelah 5 detik; servis 3 detik | Tes batas, bahan bakar kosong dan checkpoint tetap |
| Informasi dua pemain berbeda | Sensor jarak A; galat sudut, spin dan laju B melalui privateState | Tes skema snapshot, DOM kedua controller, integrasi LAN |
| Garis bantu penyelarasan di TV | Cincin bernomor, arah port, fixture emas, halo aktif dan progres penguncian | Fixture 12 map dan sampel carry/showcase |
| Santai tanpa timer; tantangan waktu/bahan bakar | Timer aktif hanya saat merakit, target 420–540 detik; lewat target tetap bisa menyelesaikan | Tes deadline nonterminal dan kedua mode |
| Hasil, waktu, fuel dan stasiun dapat diputar | Showcase sebelum finish host: tiga modul, waktu ronde, catatan propelan/checkpoint pada state, inspeksi analog | Perjalanan sampai showcase, tes inspeksi dan next/replay/finish |
| Replay konfigurasi baru | Aksi replay menaikkan variant; orientasi dan sedikit posisi awal berubah deterministik | Audit replay nyata setelah menyelesaikan ronde awal |
| 6–9 menit per ronde | Sasaran pengalaman manusia, bukan penundaan buatan | **Belum diterima:** bot map-aware lebih cepat; perlu playtest pasangan |

Angka game di atas ditulis orisinal, bukan batas operasi wahana nyata. Rotasi hanya satu sumbu pada bidang kerja XZ. Lengan bergerak di atas bidang; truss dan panel dekoratif berada di bawahnya; antena sekunder berada di atas volume muatan. Jadi detail visual non-collider tidak menyamar sebagai penghalang pada ketinggian yang sama.

## Ruang kerja dan rintangan

`maps.ts` memuat koordinat spawn/port, bentuk, massa relatif, sudut tangkap/pasang, serta setiap batu, radiator dan sapuan per misi. Lingkungan tidak dibentuk dari satu map dengan perubahan seed. Enam zona mempunyai palet/planet/audio berbeda. Bentuk muatan menentukan footprint OBB: panel surya lebar, teleskop panjang, reaktor berat; rotasi mengubah ruang yang muat.

Batu memakai footprint lingkaran; radiator dan gantri memakai OBB yang sama dimensi/yawnya dengan render. Stasiun pusat solid. Modul terpasang menjadi volume solid untuk modul berikutnya. Batas mencegah payload hilang. Server membagi tick menjadi langkah ≤1/120 detik, memeriksa translasi dan rotasi, dan membatasi kecepatan. Sapuan yang memasuki beban diam mendorong perlahan; tidak menghitung kehancuran. Recall tetap tersedia bila operator memilih jalan yang buntu.

Area port diuji di sekeliling **seluruh radius toleransi pemasangan**, pada semua fase yang disampel, serta dengan modul sebelumnya terpasang. Spawn menyediakan ruang putar penuh. Tempat tunggu tidak ditempatkan di dalam sapuan. Selalu tersedia jalan memutar; memilih celah sempit dapat lebih singkat tetapi memerlukan orientasi yang tepat. Map-aware driver memilih jalur konservatif dan bukan pembuktian semua strategi manusia sama nyaman.

## Rasa kontrol dan progres

A memindahkan kepala lengan, bukan menulis langsung posisi beban. Pegas dengan massa relatif menggerakkan modul; menarik lebih dari tiga unit melepas capit secara aman. B memutar dan memberi impuls; rem menurunkan laju, namun A tetap bisa menarik pelan. Dwell docking reset jika posisi, sudut, gerak atau rem tidak lagi memenuhi kondisi. Permintaan Pasang dapat dibatalkan.

Ketiga modul berbeda target dan sudut, dengan checkpoint per pemasangan, bukan reset seluruh ronde. Level awal memberi ruang untuk memahami fixture; level lanjut menambah pemilihan rute, inersia, fase sapuan dan port diagonal. Tidak menambahkan ledakan/kematian sebagai pengganti kesulitan. Waktu briefing dan inspeksi tidak dimasukkan ke waktu perakitan.

Mode lokal di briefing adalah bagian game ini; tidak membuka kembali pemilih mode/stage global atau mengubah host. Showcase tetap berada dalam lifecycle game agar dua HP dapat memutar hasil sebelum operator A memilih finish menuju hasil host. Home/Jeda tetap milik host. Tidak ada pause otomatis ketika koneksi/tab hilang; input host menjadi netral, sedangkan drift fisik berlanjut.

## Privasi, aset, offline dan aksesibilitas

Angka sensor dibagi lewat privateState dan masing-masing DOM hanya menampilkan perannya. Posisi/yaw fisik tetap publik untuk render TV; ini asimetri informasi antarmuka, bukan enkripsi terhadap pembacaan geometri. Tidak ada jawaban pribadi, token, QR atau kredensial di fixture.

Semua model, shader/tekstur prosedural dan audio tersaji lokal. Antena Kenney dan panel KayKit CC0 dilengkapi chain sumber/lisensi/checksum; model yang tidak dipakai tidak diunduh ke repo. Muatan, lengan, planet fiktif, grid navigasi, artwork dan musik/foley adalah karya prosedural game ini. Lihat inventaris aset.

Label A/B, nomor port, arah dan teks melengkapi warna. Dua mode tidak membutuhkan audio. Ukuran kontrol mengikuti preferensi host; gesture multi-touch, release, snapshot dan Home menggunakan kontrak platform. Reduced motion mengurangi dekorasi, bukan mengubah fase rintangan atau aturan. Mute/lifecycle audio tersedia. Tidak mengklaim pemenuhan standar aksesibilitas atau performa perangkat fisik tanpa pengujian.

## Batas penerimaan

Hasil bot bukan durasi manusia. Bukti browser bukan dua HP fisik. Draw call/memory snapshot bukan pengukuran FPS. Sebelum dinyatakan matang: playtest pasangan untuk target 6–9 menit, kenyamanan sudut/impuls/pegas, keterbacaan titik tangkap dan fuel; uji kedua HP Android/iOS; ukur frame time/input-to-photon dan perpindahan misi pada laptop referensi. Status dan hasil aktual diperbarui pada STATUS, bukan roadmap pusat.
