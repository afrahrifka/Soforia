# Status Derek Angkasa — 16 November 2026

**Implementasi issue #22 dapat dimainkan dan ditinjau; belum acceptance playtest pasangan/perangkat fisik.** Scope `game:derek-angkasa`, hanya folder ini dan `.changes/2026-11-16-game-derek-angkasa-f9d644a7.json`. Tidak mengubah game lain, host/dashboard/shared, daftar pusat atau deployment. Perubahan workspace sebelumnya dipertahankan.

## Yang tersedia

- 12 misi authored / enam zona / tiga modul per ronde; total 36 pemasangan per mode. Enam bentuk muatan dengan footprint, massa, sudut tangkap/pasang dan port masing-masing. Lihat README dan atlas.
- A mengendalikan lengan IK, capit, presisi dan permintaan pasang; B rotasi, impuls maju/mundur dan rem. Sensor jarak hanya ditampilkan di HP A; angka sudut/laju di HP B. TV mempunyai fixture, cincin port dan panduan arah.
- Penangkapan dan docking diperiksa terpisah; docking memakai posisi, sudut, laju, spin, rem B dan dwell kontinu. Tidak ada attach hanya karena dekat, kerusakan permanen atau game over.
- Propelan terbatas; checkpoint mengisi ulang. Tug servis manual/otomatis menyelamatkan modul aktif dengan animasi pengangkatan, mempertahankan modul terpasang. Sur-rotasi memberi drift kecil yang bisa direm.
- Briefing lokal dengan pilihan misi/santai/tantangan; showcase stasiun dapat diputar oleh kedua operator; next, replay deterministik dan finish tersedia. Keyboard developer terintegrasi F2/F3 tanpa mengambil alih P/Jeda host.
- Antena Kenney CC0 (tiga GLB, sekitar 60 KiB) dan panel KayKit CC0 yang sudah tersedia, beserta inventaris/lisensi/SHA-256. Muatan, lengan, planet fiktif bertekstur prosedural, artwork, musik ambient enam zona dan foley dibuat lokal. Tidak menambah video ke repo.

## Bukti aktual

- **16/16 tes scope lulus:** peran/otorisasi, capitan salah jarak/sudut/laju/spin, docking negatif dan reset dwell, checkpoint, servis/fuel kosong, batas/nonfinite, pemisahan sensor dan salinan snapshot, deadline nonterminal, showcase/replay, OBB/gantri, drift, presisi dan konflik keyboard.
- **12/12 misi santai dan 12/12 tantangan**, masing-masing **36 pemasangan**, dari briefing melalui input/aksi sampai showcase, tanpa teleport/mutasi state/kekebalan/fuel gratis. Tidak perlu recall pada rute tersebut. Bot mengetahui peta dan memakai jalur konservatif.
- **12 replay tambahan / 36 pemasangan** setelah menyelesaikan ronde awal; konfigurasi variant 1 juga selesai tanpa recall. Dua kontrol negatif A saja dan B saja terhalang pada modul pertama.
- Sisa propelan terendah pada checkpoint tantangan: **54,31 dari 75 unit**. Ini membuktikan rute yang diuji mempunyai cadangan, bukan semua strategi manusia pasti hemat.
- Waktu bot santai **61,67–121,59 detik**, rata-rata **93,04 detik** per ronde. **Target manusia 6–9 menit dari issue belum dibuktikan**, tidak ditutup-tutupi dengan waktu tunggu paksa atau klaim balancing sudah diterima.
- Fixture renderer: **12 scene misi, carry/showcase/briefing**, empat viewport/peran controller (740×360, 360×740), pemuatan aset lokal dan pembersihan cache model. Screenshot adalah fixture/sampel input yang dilabeli, bukan playtest manusia atau benchmark.
- Dua konteks browser melalui server aplikasi asli: discovery katalog, pairing dua slot, tutorial/siap, pilih mode, sensor privat, tangkapan jauh ditolak, analog B, rem tahan B, analog A, tangkapan sah, pointer B tetap tertahan melalui snapshot capitan, permintaan pasang jauh tidak menyimpan, release/netral dan Home. Tidak menyimpan token, QR atau URL undangan.
- `npm run check`, `npm run build`, pemeriksaan aset dan dokumentasi lulus. Build menemukan game ketujuh dari manifest tanpa cabang/import game manual pada host/dashboard.

Bukti: `evidence/courses-relaxed-1-12.json`, `courses-challenge-1-12.json`, `campaign-audit.json`, `assets-report.json`, `visual-report.json`, `lan-report.json`, `validation-report.json`, `scope-report.json`. Hash runtime/UI yang sama diverifikasi pada laporan aktif; inventaris mencatat hash aset secara terpisah. `map-atlas.svg` adalah peta authoring, bukan rekaman perjalanan. Video berikutnya, bila diminta, hanya di `~/Videos/Soforia`.

## Batas workspace dan penerimaan

`npm test` seluruh workspace: **105/106 lulus**. Kegagalan berada di `tests/platform/server.test.ts:30`: navigasi left dari Orbit masih menunggu Glass, padahal katalog sudah bertambah. Ini mereproduksi asumsi tes platform yang sudah dilaporkan pada STATUS Kaca sebelum tugas; tes tersebut tidak diubah dalam scope game baru. Integrasi server khusus Derek Angkasa lulus melalui pencarian katalog, tanpa asumsi urutan itu.

`npm run check:scope -- --working` gagal karena **sembilan change note** workspace gabungan (delapan telah ada sebelum tugas). Validasi subset folder Derek Angkasa + satu catatan baru lulus. Ini bukan klaim seluruh diff workspace milik tugas ini atau CI remote sudah hijau.

Lanjutkan playtest pasangan untuk target durasi, keterbacaan lengan/cincin, ergonomi dua HP, rasa pegas/massa, kenyamanan rem dan kurva tantangan. Uji HP Android/iOS fisik dan kinerja laptop, frame time, input-to-photon, soak serta audio fisik masih diperlukan. Tidak membuat commit/push, menutup issue, memuat ulang layanan proyek atau mengubah sistem/jaringan/deployment.
