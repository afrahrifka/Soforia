# 13 — Pembenahan permainan dan aset 3D

Tanggal: 14 November 2026. Status: implementasi beta yang sudah diuji otomatis; playtest pasangan dan penerimaan perangkat fisik masih diperlukan.

## Arah visual dan hasil implementasi

Permainan memakai diorama 3D dengan warna lembut, pencahayaan hemisphere/directional, bayangan, kamera ortografis, model geometri orisinal, dan label yang menghadap layar. Semua geometri, material, tekstur label, font sistem, dan bunyi sintetis tersedia lokal. Tidak mengambil kode atau aset dari portofolio referensi atau game komersial.

Objek dibangun ketika pertandingan berganti dan dipakai ulang selama frame berikutnya. Geometri/material dibagi antarobjek; snapshot mengubah transform, visibilitas, dan material yang sudah ada. Canvas dipertahankan ketika tutorial, countdown, keputusan dan hasil berganti. Resource label dan bayangan dibersihkan saat berpindah permainan. Ini memperbaiki versi sebelumnya yang membuat dan membuang mesh setiap frame. Stabilnya jumlah geometri/tekstur adalah bukti terbatas pengelolaan resource, bukan bukti bebas kebocoran atau jaminan 60 FPS.

## Inventaris aset orisinal

Implementasi model berada di `src/scene3d.ts`; dibuat melalui geometri Three.js, bukan berkas unduhan. Aset ini merupakan kode sumber yang ikut dibundel dan mengikuti lisensi MIT proyek.

| Permainan | Model dan fungsi |
|---|---|
| Orbit Berdua | Dua pesawat dengan badan, sayap, kokpit, hidung dan pendorong; kristal energi berputar, efek lingkaran saat diambil, asteroid bersegi, dua pad gerbang berlabel, cincin gerbang aktif, pelindung pesawat, planet bercincin, bintang dan batas arena |
| Kebun Berdua | Karakter bertopi dengan warna dan label A/B, bibit wortel/stroberi, petak beralur, tunas, wortel berdaun, semak stroberi berbuah, pertumbuhan berskala, penanda matang, sumur, peti panen, barang bawaan, penanda arah interaksi, pohon dan pagar |
| Kota Berdua | Papan 16 petak, dua karakter pion, dadu bertitik, rumah beratap, kedai berkanopi, rumah kebun atap, menara suar, observatorium berteleskop, bangunan tambahan/menara peningkatan, bendera kepemilikan, pohon, bangku, lampu dan air mancur |
| Seirama | Panggung, dua karakter, permata dekoratif; pertanyaan dan reveal berupa lapisan teks agar terbaca. Pilihan pribadi tetap hanya dikirim ke controller yang berhak |
| Antarmuka | Artwork katalog Kota Berdua orisinal HTML/CSS, scoreboard, kartu keputusan, riwayat transaksi, progress tujuan, informasi panen dan QR pemain kedua |

Three.js adalah dependency pihak ketiga berlisensi MIT dan tercatat di package/lockfile; proses packaging mengambil notice dari dependency. Font dan emoji berasal dari sistem pengguna. Tidak ada tekstur foto, audio rekaman, atau model pihak ketiga baru.

## Perubahan permainan

**Kota Berdua:** 12 ronde setara (24 giliran); saldo awal masing-masing 650. Empat distrik berisi masing-masing tiga properti. Harga properti mengikuti `100 + 30 × floor(indeks / 4) + 20 × (indeks % 4 − 1)` pada petak properti. Lengkap satu distrik menggandakan sewa. Properti dapat ditingkatkan maksimal dua kali ketika pemilik singgah; biaya tiap peningkatan 60% harga beli, dibulatkan. Sewa dasar 20% harga beli, dibulatkan, dikalikan `(1 + tingkat)` dan bonus distrik. Nilai akhir adalah saldo + harga beli + biaya peningkatan.

Dadu tampil berputar 0,65 detik; pion melangkah setiap 0,2 detik sebelum transaksi diselesaikan server. Aksi selama animasi dan aksi pemain di luar giliran diabaikan. Petak kosong menawarkan beli/lewati; milik sendiri menawarkan tingkatkan/lewati bila terjangkau. Festival memberi kartu kejadian deterministik; taman memberi 55; melewati awal memberi 120. Sewa dan potongan tidak membuat saldo negatif; tidak ada eliminasi. Seed rematch menghasilkan urutan dadu yang sama. Pengujian balancing dengan pemain tetap diperlukan; tidak ada klaim bahwa pilihan strategi sudah seimbang.

**Orbit:** pulsa pelindung pada HP melindungi diri selama dua detik dan menolong pasangan yang berjarak kurang dari 200 unit; cooldown delapan detik. Aturan gerbang, energi, tiga arena dan bantuan kedekatan tetap berlaku. Warna, label A/B, cincin dan instruksi membedakan objek penting.

**Kebun:** feedback aksi menjelaskan kapan harus menanam, menyiram, menunggu pertumbuhan, memanen atau mengantar. Karakter menghadap arah interaksi; lingkaran menunjukkan target. Status bibit dan barang bawaan tampak pada HUD. Sumur tetap penanda visual; air tidak dibatasi.

**Seirama:** aturan privasi, reveal, skip dan delapan ronde dipertahankan. Bunyi pendek kontekstual di controller membantu menandai hasil aksi tanpa menjadi syarat bermain; mute tetap tersedia.

## Aksesibilitas dan batas

Preferensi reduced motion dan media query sistem menonaktifkan gerakan dekoratif serta interpolasi; perpindahan state permainan tetap tampak. HUD memakai teks dan label selain warna; progress memakai elemen semantik dan tidak bergantung pada inline style yang diblokir CSP. Kegagalan WebGL menampilkan petunjuk pada layar konsol. Tidak mengklaim dukungan GPU/browser yang belum diuji.

Satu controller boleh masuk dan mulai sebagai pratinjau; game tetap dirancang untuk dua orang. QR pemain kedua tersedia pada layar game saat slot kedua kosong. Tidak ada bot otomatis.

## Bukti dan titik lanjut

Verifikasi lokal mencakup pemeriksaan TypeScript, 17 tes unit/integrasi, build offline, serta E2E Chromium. Tes aturan mencakup pergantian giliran, spam aksi saat animasi, pembelian, peningkatan, sewa distrik, saldo, bonus, hasil akhir dan rematch deterministik. Tes browser memeriksa empat game, 24 giliran Kota Berdua, jumlah geometri/tekstur, layout 1920×1080 dan 1366×768, reduced motion, error JavaScript/console, dan request eksternal. Lihat [hasil E2E](evidence/quality-3d-report.json) dan [cuplikan gameplay kota](evidence/quality-city-gameplay.png).

Gerbang berikutnya: jalankan pada dua HP fisik dan laptop sasaran; nilai keterbacaan serta kenyamanan, lakukan playtest pasangan untuk strategi/durasi, ukur frame time p95 selama 10 menit dan input-to-photon dengan kamera, uji soak, lalu kemas distribusi baru. Paket offline lama tidak otomatis menjadi paket versi ini.

### Menjalankan ulang pemeriksaan

```sh
npm run check
npm test
npm run build
node scripts/browser-check.mjs
node --import tsx scripts/visual-3d-check.mjs
```

`browser-check.mjs` menjalankan server uji dan dua controller browser sintetis. `visual-3d-check.mjs` memuat model dalam fixture lokal terpisah, termasuk semua tingkat bangunan dan tahap tanaman, lalu membandingkan frame reduced motion. Script kedua tidak membuktikan state fixture dapat dicapai melalui gameplay; aturan dan transaksinya diuji terpisah.

[Laporan inspeksi aset](evidence/visual-3d-report.json), [pratinjau model kota](evidence/assets-property-3d.png), dan [pratinjau model kebun](evidence/assets-garden-3d.png) memakai fixture sintetis tanpa credential atau QR aktif.


## Revisi sumber aset

Arahan pengguna berikutnya mengizinkan penggunaan aset pihak ketiga CC0 dari internet dan folder lib lokal portofolio. Pernyataan aset seluruhnya orisinal pada laporan awal ini tidak menggambarkan pustaka terbaru. Sumber, lisensi dan perubahan karakter dicatat pada [revisi aset](15-aset-dan-karakter-elastis.md).
