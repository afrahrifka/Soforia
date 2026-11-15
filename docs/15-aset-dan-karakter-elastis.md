# 15 — Pustaka aset CC0 dan pembawa kaca elastis

Tanggal: 14 November 2026. Status: implementasi beta; penerimaan dua HP dan playtest manusia tetap belum selesai.

## Arahan pengguna dan cakupan

Pengguna mengizinkan pengambilan aset representatif dari internet dan dari `/home/oskhar/Github/portofolio/Web-Portfolio-3D/public/lib`. Ini pengecualian baru terhadap larangan penggunaan aset portofolio sebelumnya: yang diambil adalah paket pihak ketiga yang disertai lisensi CC0, bukan kode, gameplay, identitas, atau konten portofolio. AGENTS dan SPEC diperbarui agar izin ini jelas untuk pekerjaan berikutnya.

Keluhan bahwa pembawa kaca sebelumnya tidak menyerupai karakter humanoid menjadi dasar revisi: tubuh dan kepala membulat, dua lengan beruas dengan siku/telapak yang mengikuti bingkai, dan jangkauan terbatas. Karakter merupakan model orisinal melalui kode `src/soft-carrier.ts`, bukan salinan model Human: Fall Flat atau Carry the Glass. Tidak mengklaim implementasi ini memiliki seluruh ragdoll/fisika game komersial tersebut.

## Pustaka model

**1.053 model**, delapan paket, sekitar **54 MiB** untuk pustaka runtime. Angka ini adalah jumlah model yang tersedia dalam katalog, bukan jumlah yang ditampilkan sekaligus atau klaim bahwa setiap model telah diuji visual di semua kondisi.

| Paket | Model di repositori | Pembuat | Asal |
|---|---:|---|---|
| Kenney Platformer Kit | 153 | Kenney | Diunduh melalui alur gratis resmi |
| Kenney Nature Kit | 329 | Kenney | Diunduh melalui alur gratis resmi |
| Stylized Nature MegaKit Standard | 68 | Quaternius | Paket CC0 dari folder lokal yang diizinkan |
| Downtown City MegaKit Standard | 153 | Quaternius | Paket CC0 dari folder lokal yang diizinkan |
| Medieval Village MegaKit Standard | 176 | Quaternius | Paket CC0 dari folder lokal yang diizinkan |
| City Builder Bits Free | 41 | Kay Lousberg | Paket CC0 dari folder lokal yang diizinkan |
| Resource Bits Free | 76 | Kay Lousberg | Paket CC0 dari folder lokal yang diizinkan |
| Space Base Bits Free | 57 | Kay Lousberg | Paket CC0 dari folder lokal yang diizinkan |

Lihat [inventaris pembuat/sumber](../public/assets/ATTRIBUTION.md), [manifest dan checksum](../public/assets/catalog.json), serta `LICENSE.txt` di masing-masing folder paket. Lisensi kode/aset orisinal tetap MIT; model pihak ketiga tetap CC0. Tidak mengimpor berkas home/FBX atau aset lain tanpa bukti lisensi hanya karena berkasnya tersedia lokal.

Tekstur eksternal lokal yang besar diturunkan hingga maksimal 512 px. Hash sumber dan hasil transform dicatat. Model glTF/GLB tetap disertai buffer/gambar yang diperlukan. Material disesuaikan saat runtime: properti nonlogam menggunakan metalness rendah agar ekspor dengan metalness=1 tidak tampak hitam tanpa environment map. Skala dekorasi disesuaikan menurut jenisnya; bunga tidak dibesarkan setinggi bangunan.

## Pemakaian dalam game

- **Kaca:** terrain, peti, dinding, rumah/kota, pohon, bunga, bangku, pallet, kain, tong, kargo, mesin, batu, dan vegetasi salju. Collider permainan tetap menentukan ukuran lantai/rintangan; model yang menggantikan collider dipasang mengikuti bounds tersebut. Dekorasi ditempatkan di luar jalur yang dapat diinjak.
- **Orbit:** model lander/pesawat dan batu ruang angkasa, dengan efek pendorong, energi dan gerbang proyek sendiri.
- **Kebun:** pohon, bunga dan tumpukan kayu; tanaman, alat/stasiun serta feedback gameplay tetap tersedia.
- **Kota:** model bangunan dan pohon; bendera pemilik, tambahan tingkat, label, dadu, dan transaksi tetap mengikuti aturan server.
- Model yang belum dipakai scene tetap tersedia sebagai pustaka; tidak dianggap sebagai fitur game yang sudah diimplementasikan.

`src/assets3d.ts` memuat model secara asinkron dari URL lokal; tidak ada CDN saat bermain. Template dipakai ulang, instance dilepas ketika pindah scene, dan cache LRU menargetkan 64 template dengan mempertahankan model yang masih aktif. Geometri/tekstur dapat bertambah saat model baru dimuat; yang diuji adalah stabilitas saat idle dan batas cache pada scene yang diperiksa, bukan angka geometri yang harus sama sebelum/sesudah seluruh pustaka dihangatkan.

Jika model gagal dimuat, bentuk cadangan tetap tersedia dan status kegagalan tercatat untuk QA. Tes browser mensyaratkan tidak ada kegagalan aset pada alur yang diuji; keberadaan fallback bukan bukti model berhasil terpasang.

## Perubahan simulasi pembawa kaca

Sebelumnya posisi dua karakter dikoreksi langsung ke jarak tetap 2,4 unit, sehingga karakter menyerupai penanda pada bingkai. Kini:

1. Bingkai memiliki posisi, tinggi, yaw, dan roll sendiri. Geraknya mengikuti target tangan dengan respons pegas teredam.
2. Karakter dapat berjalan independen dalam ruang jangkauan. Analog kanan mengubah pose kaca, bukan memutar tubuh secara kaku sebagai satu benda.
3. Setiap pembawa mempunyai dua bahu, siku dan telapak. Telapak menuju sisi bingkai; dua ruas lengan menekuk saat dekat dan memanjang ketika jauh.
4. Target panjang maksimal satu lengan **1,4 unit simulasi**. Model visual dibatasi pada nilai tersebut; solver menarik tubuh/bingkai ketika batas tercapai. Kondisi terhalang memakai toleransi solver; kelebihan jangkauan yang menetap memecahkan kaca dan memicu respawn.
5. Perbedaan tinggi diserap kemiringan bingkai dan lengan, sehingga satu karakter bisa melompat tanpa langsung memecahkan kaca. Benturan panel, jatuh, dan jangkauan berlebih tetap berbahaya.
6. Karakter mempunyai kepala besar, badan membulat, tangan dan kaki lembut, ayunan berjalan, kemiringan badan dan sikap merunduk. Ini rig prosedural dengan kendala khusus game, bukan rigid-body ragdoll penuh; siku tidak memiliki collider fisik mandiri.

Kontrol tetap sesuai klarifikasi pengguna: analog kiri karakter, analog kanan kaca, satu Lompat. Jeda tetap utilitas kecil 44×44 pada semua game. Posisi tinggi kaca dipertahankan ketika input netral/Jeda. Kamera Kaca kini perspektif dari belakang-atas, mengikuti tim, memandang jalur selanjutnya, dan menaikkan sudut secara halus jika rintangan di belakang berpotensi menutupi pandangan. Bayangan mengikuti area tim.

## Persiapan ulang dan verifikasi

Untuk menjalankan source yang sudah berisi aset, cukup `npm ci && npm run build`; Python/internet tidak dibutuhkan saat bermain.

Untuk mengambil ulang pustaka dari sumber persiapan:

```sh
python3 -m pip install -r scripts/requirements-assets.txt
python3 scripts/download-assets.py
python3 scripts/import-assets.py --portfolio-root /home/oskhar/Github/portofolio/Web-Portfolio-3D/public/lib
python3 scripts/validate-assets.py
```

Downloader memakai alur resmi gratis dan tidak menyimpan URL unduhan bertanda tangan. Importer membutuhkan enam paket CC0 lokal tersebut; sumber publik dan hash arsip/model tersedia pada katalog. Inventaris menyertakan versi berkas yang benar-benar diimpor, bukan semua model dari edisi premium pembuatnya.

Verifikasi implementasi mencakup:

- Integritas 1.053 model/1.702 berkas, teks lisensi CC0, checksum, serta seluruh referensi buffer/gambar lokal.
- TypeScript/build dan 28 tes unit/integrasi: tubuh bebas sebelum batas lengan, batas regangan, analog kaca independen, lompatan satu pembawa, checkpoint, validasi protokol, MIME GLB dan penolakan traversal direktori.
- Seluruh 60 rute/240 checkpoint dilalui ulang dalam simulasi dengan input sintetis; kebijakan uji kini menyesuaikan formasi tubuh dan orientasi bingkai, tanpa mengubah posisi secara paksa.
- E2E dua controller browser untuk game baru dan regresi empat game lama; model terpilih benar-benar dimuat, tidak ada kegagalan aset/error/request internet pada alur yang lulus.
- Fixture visual lima game/enam dunia, termasuk pose lengan memanjang, reduced motion dan cache. Daftar model yang benar-benar diparse pada inspeksi tercantum di laporan; tidak mengklaim seluruh pustaka 1.053 model diuji visual.

Uji renderer software paralel sempat melewati batas waktu; pengulangan Kaca secara terisolasi lulus. Ini bukan bukti telah memenuhi p95 frame time GPU laptop target. Dua HP fisik, input-to-photon, uji soak, kenyamanan lengan/kamera dan balancing kampanye tetap menjadi titik lanjut. Paket offline lama belum otomatis berisi perubahan ini.

## Bukti tersimpan

- [Integritas pustaka model](evidence/asset-import-report.json).
- [Browser Kaca Berdua](evidence/elastic-browser-report.json) dan [seluruh rute setelah perubahan fisika](evidence/elastic-course-report.json).
- [Regresi game lain dengan model impor](evidence/asset-regression-report.json).
- [Inspeksi visual dan daftar 88 model yang diparse](evidence/imported-assets-visual-report.json).
- [Pratinjau lengan memanjang](evidence/glass-arms-extended.png): fixture pose sintetis, bukan bukti input HP fisik.
- [Cuplikan gameplay browser](evidence/glass-elastic-gameplay.png): dua controller browser sintetis, tanpa QR/credential sesi.

## Pembaruan 14 November 2026 — map dan controller Kaca

Arahan pengguna terbaru mengganti dua analog Kaca dengan satu analog di sudut bawah serta tombol tahan putar/naik/turun dan tombol Lompat. Semua controller menempatkan analog dekat jangkauan jempol bawah, dengan mode cermin tangan kiri. Map, karakter dan gerak juga direvisi; lihat [laporan terbaru dan bukti](16-kaca-map-gerak-controller.md). Deskripsi kontrol/visual sebelumnya di dokumen ini merupakan riwayat sebelum revisi tersebut.

## Pembaruan 15 November 2026

Pegangan, rotasi dan kebijakan pecah pada revisi ini telah diganti: empat tangan pada empat sudut, kemiringan horizontal ↔ vertikal, pecah akibat tanah/jepitan dan rangkaian tantangan baru. Batas lengan kini 2,2 unit. Lihat [aturan terbaru serta bukti dan batas](17-kaca-empat-sudut-dan-tantangan.md).
