# Inventaris aset Jam Berulang

Diperiksa 16 November 2026. Semua runtime memakai aset lokal; tidak ada download ketika bermain.

| Aset | Pembuat/sumber | Lisensi dan pemakaian |
|---|---|---|
| `kenney-nature/tree_default_fall` | Kenney, [Nature Kit](https://kenney.nl/assets/nature-kit) | CC0; salinan repo `public/assets/kenney-nature/models/tree_default_fall.glb`. Diakses lewat loader shared read-only, skala tinggi 1, footprint ≤0,68. Checksum di `evidence/asset-inventory.json`. |
| Lisensi model | `public/assets/kenney-nature/LICENSE.txt` | Pernyataan distribusi Kenney Nature Kit 2.1, CC0; [dedikasi CC0](https://creativecommons.org/publicdomain/zero/1.0/). Tidak mengubah salinan aset bersama. |
| Bangunan/dinding, paving, kanal, clock tower, gerbang, pelat, roda, menara tujuan | Geometri parametrik orisinal di `console.ts` | Kode sumber proyek; bukan model dari game komersial. Primitive dan person disediakan SceneKit host; pakaian, warna dan komposisi milik game ini. |
| Sampul | HTML/CSS orisinal `art.ts`, `style.css` | Tidak memakai logo atau artwork pihak ketiga. |
| Nada jam/akor | Sintesis sinus orisinal `audio.ts` | Tidak memakai sample musik atau rekaman pihak ketiga. |
| Teks, peta, palet | Orisinal `levels.ts` dan dokumentasi game | Referensi mekanik dijelaskan terpisah di DESIGN.md. |

## Revisi visual kota — 16 November 2026

- **29 model KayKit Medieval Hexagon Pack 1.0** karya Kay Lousberg, [repositori pembuat](https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0), CC0. Sepuluh bangunan, tiga pohon, empat properti, tiga tanaman kanal, tiga batu, enam model lanskap/awan. Pustaka nama berada di `scenery.ts`; revisi arena memakai subset sesuai zona, tanpa mengunduh model tambahan. Lisensi asli disertakan dalam `assets/LICENSE-KayKit.txt`.
- **Tiga peta PBR 1K** [Cobblestone Floor 001 dari Poly Haven](https://polyhaven.com/a/cobblestone_floor_001): diffuse, normal OpenGL, roughness; [CC0](https://polyhaven.com/license). Disajikan lokal dalam `assets/`, tanpa request runtime ke penyedia.
- glTF KayKit dikemas ulang dengan buffer dan gambar sebagai data URI supaya tidak mempunyai dependensi jarak jauh. Geometri, warna dan tekstur sumber dipertahankan. File unduhan yang tidak dipakai dibuang dari seleksi sebelum serah-terima.
- Inventaris URL asal, ukuran dan SHA-256: [visual-assets.json](evidence/visual-assets.json). Periksa melalui `node src/games/jam-berulang/tools/check-assets.mjs`. Total sekitar 4,4 MiB, termasuk lisensi.
- `scenery.ts` memiliki lifecycle resource per scene; hasil unduhan yang selesai setelah scene dilepas tidak dipasang kembali. Model/material/tekstur dilepas melalui hook resource host. Model asing tidak digabung dengan batch primitive statis.

Karakter membulat dan aksesori penjaga waktu tetap geometri orisinal, bukan karakter dari game AAA. Kamera perspektif, fondasi kontinu, penggabungan blok rumah, permukaan batu PBR, kanal, vegetasi, kota luar dan pencahayaan hangat/dingin menggantikan dominasi ubin/balok sebelumnya. Aset lama Nature Kit tidak lagi digunakan console ini; inventaris lama dipertahankan sebagai catatan tahap awal.

Tidak ada aset atau kode dari portofolio Web-Portfolio-3D yang disalin dalam pekerjaan ini.
