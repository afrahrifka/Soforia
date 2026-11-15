# 14 — Kaca Berdua dan Jeda kecil

Tanggal: 14 November 2026. Status: beta implementasi, belum diterima pada dua HP fisik.

## Tujuan dan referensi

Permintaan pengguna menambahkan permainan kooperatif mengangkut kaca rapuh, banyak stage/checkpoint, dan kontrol yang kemudian dijelaskan sebagai dua analog serta satu tombol Lompat. Kamera otomatis, layar laptop tetap display-only, dan simulasi tetap otoritatif di server LAN.

Game orisinal ini bernama **Kaca Berdua**. Referensi mekanik tingkat tinggi adalah [pengumuman pengembang Carry the Glass](https://steamcommunity.com/app/3263320/announcements/) tentang dua pembawa dan kendali ujung kaca secara independen. Tidak memakai kode, aset, nama lokasi, musik, atau peta komersial tersebut. Tidak mengklaim meniru seluruh fisika atau pemetaan tombol versi komersial; kontrol mengikuti penjelasan pengguna untuk HP.

## Kontrol

| Kontrol | Fungsi |
|---|---|
| Analog kiri | Menggerakkan karakter pada lantai; atas berarti maju pada jalur, kiri/kanan untuk menyesuaikan posisi |
| Analog kanan atas/bawah | Menaikkan atau menurunkan ujung kaca milik pemain. Posisi bertahan ketika analog dilepas. Saat ujung diturunkan, pembawa otomatis merunduk |
| Analog kanan kiri/kanan | Memutar bingkai; kontribusi kedua pemain dirata-ratakan, sehingga salah satu dapat mengarahkan dan keduanya dapat membantu |
| Lompat | Lompatan karakter sendiri; kedua pemain perlu menyamakan waktu untuk celah dan peti |
| Jeda kecil `Ⅱ` | Utilitas 44×44 di baris atas, terpisah dari analog dan tombol aksi; lanjut dengan Siap pada semua controller |
| Ulang checkpoint kecil `↻` | Memulai ulang dari checkpoint terakhir pada stage saat ini |
| Home / fullscreen / bantuan | Utilitas kecil; kamera tidak memiliki kontrol manual |

Dua analog memakai pointer capture yang terpisah. Melepas analog kiri mengirim gerak netral tanpa membatalkan kanan; cancel kanan mengirim input kaca nol. Resize, background, pause dan reconnect menetralkan input. Posisi kaca yang sudah dicapai dipertahankan saat netral/Jeda, sehingga tidak mendadak naik ke palang. Posisi bukan input yang masih tertahan.

Kamera ortografis mengikuti titik tengah tim secara halus, memandang ke arah jalur selanjutnya dari atas. Reduced motion meniadakan interpolasi dekoratif. Tidak menjanjikan sudut kamera selalu optimal pada semua perangkat; framing dan kenyamanannya tetap memerlukan playtest.

## Kampanye dan checkpoint

Enam dunia, masing-masing 10 stage:

1. Teras Pagi: jalur pengenalan, peti dan teras bunga.
2. Pelabuhan Angin: perairan dekoratif, perahu dan crane.
3. Kebun Melayang: pulau batu, pohon dan bunga.
4. Pabrik Lentera: mesin, roda dan lentera.
5. Lembah Embun: kristal dan awan rendah.
6. Puncak Fajar: puncak batu, salju dan bendera.

Total **60 layout dan 240 checkpoint**. Layout dibangun deterministik dari sepuluh motif rintangan dengan kombinasi, posisi, fase gerak, lebar celah, dan dunia yang bervariasi; bukan 60 peta yang diklaim dirancang tangan satu per satu. Stage pertama mengajarkan gerak dan checkpoint. Motif berikutnya mencakup peti untuk lompatan, palang untuk merunduk, gerbang untuk rotasi, jembatan sempit, celah, balok bergerak, zigzag, penyangga kaca dan kombinasi.

Setiap stage memiliki empat zona sepanjang sekitar 12 unit dan empat platform checkpoint lebar. Checkpoint baru aktif jika kedua pembawa melintasinya dengan kaca utuh dan sudah menapak. Ketika kaca pecah atau karakter jatuh, tim muncul kembali di checkpoint stage tersebut; checkpoint yang sudah didapat tidak dihapus. Jeda dan reconnect mempertahankan pertandingan di server.

Kedua pemain menekan Stage berikutnya untuk lanjut. Setelah stage 60, hasil melaporkan jumlah stage yang benar-benar diselesaikan pada rangkaian itu. Memilih langsung stage 60 tidak menghasilkan klaim telah menyelesaikan 60 stage. Host dapat memilih semua stage melalui pemilih stage di controller katalog; tidak perlu menekan Stage + puluhan kali.

Checkpoint bersifat sementara dalam sesi server. Home, reset ruang, atau restart server memulai pertandingan baru; belum ada save kampanye ke disk atau akun. Satu controller boleh membuka pratinjau, tetapi game dirancang untuk dua pemain tanpa bot otomatis.

## Simulasi dan aset

`src/glass.ts` menyimpan metadata peta dan aturan server. Jarak pembawa dikoreksi ke panjang bingkai 2,4 unit agar gerak saling mendorong/menarik. Kaca memiliki tinggi 1,2 unit. Server menyimulasikan gravitasi/lompatan, dukungan lantai, tubuh terhadap rintangan, tinggi ujung, kelenturan posisi terbatas, dan sampel benturan panel. Ini simulasi khusus game dengan batas yang disederhanakan, bukan mesin rigid-body/ragdoll komersial.

Panel pecah ketika menabrak rintangan, karakter jatuh, atau selisih ketinggian/tarikan melampaui batas. Respawn memiliki perlindungan singkat pada platform aman. Input analog dibatasi angka finite −1 sampai 1; client tidak mengirim posisi, checkpoint, atau keputusan tabrakan. Semua angka keseimbangan masih perlu playtest pasangan.

Aset di `src/scene3d.ts` meliputi pembawa bertopi, tangan, panel transparan berbingkai, pecahan, platform, tepi jalur, peti, palang, gerbang, balok bergerak, penyangga, bendera checkpoint dan landmark tiap dunia. Dibuat dari geometri/material orisinal berlisensi MIT proyek, memakai Three.js lokal. Resource dipakai ulang antarframe dan resource khusus dibersihkan saat pindah stage.

## Perubahan Jeda semua game

Jeda dikeluarkan dari area tombol aksi **Orbit, Kebun, Seirama, Kota Berdua, dan Kaca Berdua**, termasuk countdown. Ukurannya sama dengan Home: 44×44, pada baris utilitas atas. Bantuan yang dapat menjeda permainan juga dipindahkan ke utilitas kecil. Tidak mengklaim tombol kecil menghapus seluruh kemungkinan salah sentuh; perbaikan yang terukur adalah posisi dan ukuran tombol di luar area aksi utama.

## Verifikasi dan batas

- Pemeriksaan TypeScript, build, dan 25 tes unit/integrasi. Cakupan khusus: jumlah/keunikan peta, titik respawn, input analog kaca, lompat, jatuh, checkpoint, transisi stage, hasil kampanye sebagian, validasi jaringan, dan Jeda di bawah palang.
- `node --import tsx scripts/glass-course-check.mjs`: masing-masing dari 60 stage dilalui oleh input sintetis untuk dua pembawa sampai empat checkpoint, tanpa mengubah posisi secara paksa. Kebijakan uji mengetahui peta dan memakai rute aman; ini bukti rute dapat ditempuh dalam simulasi, bukan bukti manusia merasa game seimbang/seru.
- `node scripts/glass-browser-check.mjs`: dua controller browser, pemilih stage 1/60, dua analog bersamaan dan release/cancel, satu tombol Lompat, Jeda kecil, layout portrait/landscape, penyelesaian stage 1, dan lanjut ke stage 2.
- `node scripts/browser-check.mjs`: regresi empat game sebelumnya, dengan pemeriksaan bahwa Jeda hanya berupa utilitas kecil.
- `node --import tsx scripts/visual-3d-check.mjs`: inspeksi lima game dan enam dunia Kaca, reduced motion, serta resource setelah pergantian stage.

Laporan tersimpan di `docs/evidence/glass-course-report.json`, `glass-browser-report.json`, `pause-regression-report.json`, dan `glass-visual-report.json`. Uji ini tidak menggantikan dua HP fisik, WAN benar-benar dilepas, p95 frame time, input-to-photon, uji soak, atau playtest seluruh kampanye oleh pasangan. Titik lanjut: uji rasa kontrol kaca, lompatan bersama, tingkat kesulitan, kamera, dan frekuensi salah sentuh pada perangkat sebenarnya.

[Laporan rute 60 stage](evidence/glass-course-report.json) · [Uji controller browser](evidence/glass-browser-report.json) · [Regresi game lama/Jeda](evidence/pause-regression-report.json) · [Inspeksi lima game/enam dunia](evidence/glass-visual-report.json).

[Cuplikan gameplay sintetis](evidence/glass-gameplay.png) dan [layout controller landscape](evidence/glass-controller-landscape.png) tidak memuat undangan sesi atau jawaban pribadi.


## Revisi pembawa elastis dan aset

Implementasi di atas diperbarui mengikuti permintaan berikutnya: posisi tubuh kini independen dari pose bingkai dan dihubungkan melalui lengan beruas dengan batas jangkauan; kamera Kaca beralih ke perspektif otomatis. Pustaka model CC0 serta aturan/batas terbaru dijelaskan pada [laporan revisi](15-aset-dan-karakter-elastis.md). Penjelasan jarak tubuh terkunci dan kamera ortografis di bagian awal merupakan keadaan sebelum revisi ini.

## Pembaruan 14 November 2026 — map dan controller Kaca

Arahan pengguna terbaru mengganti dua analog Kaca dengan satu analog di sudut bawah serta tombol tahan putar/naik/turun dan tombol Lompat. Semua controller menempatkan analog dekat jangkauan jempol bawah, dengan mode cermin tangan kiri. Map, karakter dan gerak juga direvisi; lihat [laporan terbaru dan bukti](16-kaca-map-gerak-controller.md). Deskripsi kontrol/visual sebelumnya di dokumen ini merupakan riwayat sebelum revisi tersebut.

## Pembaruan 15 November 2026

Pegangan, rotasi dan kebijakan pecah pada revisi ini telah diganti: empat tangan pada empat sudut, kemiringan horizontal ↔ vertikal, pecah akibat tanah/jepitan dan rangkaian tantangan baru. Batas lengan kini 2,2 unit. Lihat [aturan terbaru serta bukti dan batas](17-kaca-empat-sudut-dan-tantangan.md).
