# 16 — Revisi map, gerak, dan controller Kaca Berdua

14 November 2026. Revisi atas keluhan pengguna mengenai map berantakan, gerak lambat/bergetar, bentuk karakter, dan posisi analog. Fokus tetap dua pemain melalui LAN dengan simulasi otoritatif di laptop. Kebijakan Jeda manual tetap berlaku.

## Hasil implementasi

Map memakai satu bahasa visual proyek konstruksi: beton, rangka baja, derek, gedung sekitar, dan pekerja berhelm. Acuan suasana adalah [halaman resmi Carry the Glass](https://store.steampowered.com/app/3263320/Carry_The_Glass/); layout, model pekerja, dan kode dibuat untuk Main Bareng. Tidak memakai kode atau aset game tersebut. Tidak ada aset baru yang memerlukan lisensi tambahan; pustaka CC0 yang sudah ada tetap dipertahankan bagi game lain.

Enam tema dan 60 stage tetap tersedia, dengan empat checkpoint per stage. Platform checkpoint lebar dan datar dihubungkan ramp menuju lantai yang lebih tinggi; penempatan rintangan mengikuti motif yang teratur. Dekorasi berada di luar lintasan. Map tetap memakai variasi motif deterministik, bukan 60 level yang seluruhnya dirancang terpisah seperti level komersial.

Lantai render dan collision diturunkan dari `glassSurfaces` serta `glassHeight` yang sama. Ini menghilangkan lantai checkpoint yang sebelumnya menumpuk dengan lantai utama dan model terrain yang bisa berbeda permukaan dari collision. Tepi jalur diberi marka kuning; celah terlihat sebagai celah sungguhan. Kaki mengikuti ketinggian ramp dan respawn memakai tinggi platform checkpoint. Gerak pada sisi rintangan dapat bergeser sepanjang dinding.

Kecepatan jalan berubah dari 2,55 menjadi 3,8 unit/detik; saat merunduk dari 1,35 menjadi 2,2 unit/detik. Diagonal tetap dinormalisasi. Satu tombol putar cukup untuk menggerakkan bingkai pada 1,5 radian/detik; dua arah berlawanan saling menetralkan. Rotasi simulasi berhenti saat tombol dilepas.

Layar menginterpolasi snapshot Kaca dengan buffer visual 50 ms. Interpolasi hanya menyentuh pose visual, tidak mengubah state atau collision server; buffer dibuang ketika match/stage berganti atau respawn berpindah jauh. Ini menambah penundaan visual yang harus dievaluasi pada pengukuran sentuh-ke-gambar fisik. Tidak ada klaim target latensi tercapai.

Torso karakter memakai satu permukaan kapsul halus; kepala/helm dan anggota tubuh memakai geometri membulat. Arah badan dan animasi langkah dihaluskan. Posisi bahu berubah kontinu mengikuti tinggi merunduk, sehingga tidak lagi meloncat ketika melewati ambang crouch. Basis tangan mengikuti normal bingkai secara kontinu. Dua lengan tetap memakai animasi dua ruas dan batas jangkauan; ini bukan simulasi ragdoll rigid-body penuh.

## Kontrol dan jangkauan jempol

Semua controller memakai analog dekat sudut kiri bawah; preferensi tangan kiri mencerminkannya ke kanan bawah. Area aksi berada di sudut bawah seberangnya. Safe area dan baris Home/Jeda/Bantuan tetap diperhitungkan.

Kaca memakai satu analog dan lima tombol: Putar kiri, Naikkan, Putar kanan, Turunkan, dan Lompat. Tombol putar/tinggi ditahan, dengan penanda aktif dan pelepasan per pointer. Melepas satu tombol tidak membatalkan analog atau tombol lain. Arah berlawanan saling menetralkan. Pointer cancel, blur, resize, pergantian layar, dan koneksi putus menetralkan input tanpa pause otomatis. Tinggi kaca dipertahankan saat tombol dilepas. Lompat tetap satu aksi per tekan. Jeda hanya melalui tombol Jeda kecil.

## Verifikasi dan bukti

- TypeScript, build offline, dan 35 tes unit/integrasi lulus, termasuk kecepatan, normalisasi diagonal, kestabilan saat diam/batas lengan, kontinuitas bahu, rotasi saat release, kesesuaian permukaan, dan interpolasi snapshot.
- [Simulasi rute](evidence/kaca-revision-course-report.json): 60 stage / 240 checkpoint dilalui dengan input sintetis, tanpa teleport atau pecah. Ini menguji keterjangkauan aturan, bukan kenyamanan manusia.
- [Uji controller browser](evidence/kaca-revision-browser-report.json): satu analog, lima tombol, multi-touch gerak/naik/putar, release per jari, cancel, tangan kiri, bantuan tanpa pause, Jeda manual, tutorial hingga empat checkpoint dan lanjut stage. Layout diperiksa pada 915×412, 740×360, 667×320, dan 412×915. Tidak ada error JavaScript atau request eksternal.
- [Regresi empat game lain](evidence/kaca-revision-regression-report.json): Orbit, Kebun, Seirama, dan 24 giliran Kota lulus dengan posisi analog baru, tanpa error JavaScript atau request eksternal.
- [Inspeksi visual enam dunia](evidence/kaca-revision-visual-report.json): render tanpa kegagalan, reduced motion statis, geometri/tekstur kembali ke jumlah awal setelah berpindah enam dunia. Ini fixture render, bukan benchmark GPU.
- Pratinjau: [controller landscape](evidence/kaca-revision-controller.png), [controller tangan kiri](evidence/kaca-revision-controller-left.png), [map konstruksi](evidence/kaca-revision-map.png), [karakter dan lintasan](evidence/kaca-revision-character.png).

## Titik lanjut

Refresh layar dan kedua controller setelah server lokal memuat build baru. Uji pasangan dengan dua HP fisik: kenyamanan analog di sudut bawah, kombinasi naik/putar/lompat, kestabilan di dekat dinding/ramp, serta tingkat kesulitan. Ukur ulang frame time dan input-to-photon, termasuk dampak buffer visual 50 ms. CP-03/08/09 dan gerbang performa tetap belum lulus; paket distribusi offline perlu dikemas ulang sebelum dibagikan.

## Pembaruan 15 November 2026

Pegangan, rotasi dan kebijakan pecah pada revisi ini telah diganti: empat tangan pada empat sudut, kemiringan horizontal ↔ vertikal, pecah akibat tanah/jepitan dan rangkaian tantangan baru. Batas lengan kini 2,2 unit. Lihat [aturan terbaru serta bukti dan batas](17-kaca-empat-sudut-dan-tantangan.md).
