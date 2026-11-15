# Panduan Kolaborasi

Terima kasih sudah membantu Main Bareng! Kamu tidak perlu bisa memprogram: ide game, laporan masalah, perbaikan tulisan, dan pengalaman bermain semuanya berguna. Baca juga [Kode Etik](CODE_OF_CONDUCT.md).

## Berbagi ide atau melaporkan masalah

1. Buka tab **Issues** di GitHub, lalu pilih **New issue**.
2. Pilih **Bagikan ide**, **Laporkan masalah**, atau **Perbaikan panduan**. Cari issue yang sudah ada terlebih dahulu; jika sama, tambahkan pengalamanmu di sana.
3. Isi judul dan pertanyaan wajib dengan kata-katamu sendiri. Bagian opsional boleh dikosongkan. Sertakan contoh bila membantu.
4. Kirim issue. Pemelihara dapat meminta penjelasan, mengelompokkan, atau menggabungkannya dengan issue lain. Tidak semua ide pasti dikerjakan; prioritas mengikuti roadmap dan kapasitas.

Issue dan lampirannya terbuka untuk publik. Jangan bagikan kode QR, secret sesi, jawaban pribadi pemain, atau informasi pribadi. Gunakan contoh sintetis. Laporkan masalah keamanan secara pribadi kepada pemelihara melalui kanal di [profil @oskhar](https://github.com/oskhar); jika kanal pribadi belum tersedia, tanyakan cara menghubungi tanpa mempublikasikan rincian celah.

## Mengusulkan perubahan melalui pull request

1. Untuk perubahan besar atau perubahan cakupan, diskusikan dulu melalui issue. Baca [spesifikasi](SPEC.md), [katalog game](docs/03-katalog-game.md), dan [roadmap](docs/09-roadmap.md).
2. Fork repositori, buat branch dari branch utama repositori, lalu kerjakan perubahan yang terfokus. Jangan mengasumsikan branch `dev` tersedia.
3. Siapkan Node.js 20.19 atau lebih baru dan jalankan `npm ci`. Ikuti petunjuk pengembangan di [README](README.md).
4. Jalankan pemeriksaan yang relevan: `npm run check`, `npm test`, dan `npm run build` untuk perubahan kode. Jelaskan pemeriksaan yang tidak dapat dijalankan. Untuk perubahan dokumentasi, periksa tautan dan isi yang berubah.
5. Jika ingin membuat pesan commit dengan panduan interaktif, jalankan `npm run commit` setelah melakukan `git add`. Commitizen dan cz-git tersedia melalui `npm ci`; instalasi global tidak diperlukan.
6. Perbarui dokumentasi dan roadmap jika relevan. Catat bukti sebenarnya: pengujian browser bukan pengujian dua HP fisik, dan RTT bukan waktu sentuh-ke-gambar.
7. Push branch dan buka pull request memakai template. Gunakan judul seperti `feat: tambah pilihan arena`, `fix: perbaiki koneksi`, atau `docs: perjelas panduan`. Scope opsional, misalnya `fix(ui): perbaiki tombol`. Validator judul memeriksa jenis dan scope yang diizinkan di [workflow](.github/workflows/pr-title-validator.yml).
8. Tanggapi tinjauan dengan terbuka. Pemelihara akan meninjau dan memutuskan penggabungan; jangan menganggap persetujuan atau waktu respons tertentu dijamin.

Kontribusi harus merupakan karya sendiri atau disertai izin dan lisensi yang sesuai. Proyek menggunakan [lisensi MIT](LICENSE). Fokus produk adalah dua pemain, LAN offline, controller browser HP, dan server otoritatif di laptop. Portofolio referensi bukan sumber kode, aset, atau konten untuk disalin. Jangan sertakan secret atau jawaban pribadi dalam kode, log, fixture, dan bukti.
