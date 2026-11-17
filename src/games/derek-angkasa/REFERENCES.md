# Referensi, asal keputusan dan lisensi

Diperiksa 16 November 2026. Pemilik kebutuhan: [Soforia #22 — G36 Derek Angkasa](https://github.com/oskhar/Soforia/issues/22); salinan publik issue berada pada `evidence/issue-22.json`. Instruksi pengguna memilih issue ini untuk implementasi; status awal issue sebagai ide tidak menghalangi implementasi yang sudah diotorisasi.

## Referensi teknis primer

| Sumber yang dibaca | Hal yang didukung sumber | Penerapan di game dan batasnya |
|---|---|---|
| [Canadian Space Agency — About Canadarm2](https://www.asc-csa.gc.ca/eng/iss/canadarm2/about.asp) | Lengan dipakai untuk perakitan, pemindahan peralatan dan penangkapan; end effector mengencangkan pegangan pada fixture. | Pivot, siku, pergelangan, fixture berwarna emas dan tindakan Capit. Lengan game dua ruas/teleskopik, bukan salinan tujuh derajat kebebasan Canadarm2. |
| [CSA — Cosmic catches](https://www.asc-csa.gc.ca/eng/iss/canadarm2/cosmic-catches.asp) | Penangkapan kendaraan dengan lengan dan pemasangannya ke port merupakan tahapan terpisah. | Dua pemeriksaan server terpisah: `grip` dan `dock`, dengan translasi/orientasi di antaranya. Tidak menyatakan semua wahana nyata ditangkap lengan. |
| [NASA — Mobile Servicing System](https://www.nasa.gov/international-space-station/mobile-servicing-system/) | Sistem robotik memindahkan muatan dan membantu perakitan/servis stasiun. | Stasiun modular, penggunaan tug servis dan tiga jenis pekerjaan per ronde. NASA tidak menentukan jumlah modul, map atau mekanik tug pada game ini. |
| [CSA — Canadarm2 data sheet](https://www.asc-csa.gc.ca/eng/iss/canadarm2/data-sheet.asp) | Lengan nyata memiliki tujuh derajat kebebasan dan panjang sekitar 17 meter. | Pembatasan representasi: ini permainan bidang XZ dengan rotasi yaw, bukan simulator orbital atau digital twin berskala nyata. |

Toleransi tangkap 14°, radius tangkap 0,62 unit, sudut pasang 12°→6,5°, kapasitas propelan, massa relatif, waktu target dan durasi penguncian adalah **keputusan desain Soforia**. Bukan angka prosedur penerbangan dari NASA/CSA. Drift akibat sur-rotasi merupakan kopling RCS abstrak untuk memenuhi issue, bukan klaim bahwa torsi murni dalam vakum selalu menimbulkan translasi. Tidak memakai foto, logo, model atau rekaman NASA/CSA.

## Referensi visual dan aset yang benar-benar digunakan

| Aset | Asal/lisensi | Peran |
|---|---|---|
| `satelliteDish.glb` | Kenney Space Kit 2.0, CC0-1.0 | Relay dan antena sekunder |
| `satelliteDish_detailed.glb` | Paket dan lisensi yang sama | Antena pusat di atas bidang kerja |
| `satelliteDish_large.glb` | Paket dan lisensi yang sama | Antena besar stasiun |
| `kaykit-space/solarpanel` | [KayKit Space Base Bits](https://kaylousberg.itch.io/space-base-bits), Kay Lousberg, CC0-1.0 | Panel di bawah simpul stasiun; dimuat dari pustaka lokal yang sudah ada |
| Muatan, sayap surya bergerak, lengan, gantri, planet, artwork dan musik | Orisinal prosedural Soforia | Bentuk muatan mengikuti footprint collision; planet fiktif dengan noise, bukan peta Bumi hasil unduhan. Musik/foley disintesis lokal. |

Halaman KayKit secara eksplisit menyebut CC0, model glTF dan tekstur atlas tunggal. File `public/assets/kaykit-space/LICENSE.txt` dan inventaris bersama mempertahankan bukti lokalnya; tidak mengambil konten paket EXTRA berbayar.

**Rantai akuisisi Kenney:** [halaman publisher](https://kenney.nl/assets/space-kit) tidak dapat dibaca tool web (robots), dan arsip publisher mengembalikan HTTP 403. Karena itu tiga GLB serta `KENNEY_License.txt` asli diperoleh dari [direktori mirror pada commit 440916a](https://github.com/euuuuuuan/voidclad-public/tree/440916aabc30abe014cb33ad90bd150bfbf22dd0/assets/vendor/kenney_space_kit). File lisensi menyebut Kenney, Space Kit 2.0 dan CC0. URL unduhan per file, ukuran dan SHA-256 terdapat di `assets/inventory.json`; parser GLB/checksum ada di `tools/check-assets.mjs`. Tidak menyalin kode, map, gameplay atau lisensi kode proyek mirror. Tiga model dipilih karena antena sesuai dengan perakitan orbital; model darat, turret dan aset yang tidak dipakai tidak ditambahkan.

Tidak ada runtime internet. Build menyalin aset game ke `/games/derek-angkasa/assets/`; panel KayKit tetap dilayani dari `/assets/`. Shader/material, bintang, tekstur planet, musik dan UI dibuat lokal. Bukti browser memeriksa request eksternal dan kegagalan pemuatan.
