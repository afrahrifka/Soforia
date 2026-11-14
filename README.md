# Main Bareng

Konsol game LAN offline untuk dua orang. **Laptop/TV menampilkan game; dua HP menjadi controller melalui browser di Wi-Fi yang sama.** Tidak memerlukan internet, akun, aplikasi HP, Tailscale atau server cloud saat bermain.

Versi **0.1.0-beta.3**, 14 November 2026. Implementasi pertama sudah tersedia; pengujian dua HP fisik, latency kamera dan acceptance pasangan masih diperlukan sebelum dinyatakan rilis stabil.

## Langsung main di laptop ini

```sh
cd ~/Github/main-bareng
./play.sh
```

Launcher membuka Chromium/Chrome dalam fullscreen kiosk. Laptop hanya menampilkan gambar; seluruh kontrol ada di HP. Jika layar belum terbuka, jalankan `./open-console.sh`. URL alternatif: **http://127.0.0.1:3211/console** (tab biasa tidak bisa memaksa fullscreen otomatis). QR dan alamat controller HP mengikuti IP Wi-Fi yang dipilih server. Default port controller adalah 3210; port operator 3211 hanya dapat diakses dari laptop.

1. Hubungkan laptop dan kedua HP ke satu router/Wi-Fi, meskipun router tidak tersambung internet.
2. Scan QR di layar laptop; HP langsung menjadi controller A/B tanpa formulir atau persetujuan.
3. HP A memilih game dengan analog, tekan Main untuk mulai; keduanya menekan Siap.
4. Main sambil melihat laptop atau TV melalui HDMI.

Hentikan dengan `./stop.sh`. Untuk foreground gunakan `./start.sh` dan Ctrl+C. Jika ada banyak adapter/IP, gunakan `./play.sh --host IP-WIFI-LAPTOP`. Tidak ada autostart atau perubahan konfigurasi deployment lain.

## Controller HP

Setelah scan, HP menampilkan kontrol saja: analog kiri, tombol aksi kanan, Home kecil dan tombol fullscreen. Menu memakai analog + Main/Mode/Arena. Kebun memiliki Tanam/Siram/Panen/Antar langsung; Seirama menyediakan empat pilihan serta Kunci/Ungkap/Lewati. Mendukung dua sentuhan bersamaan dan layout portrait/landscape.

Fullscreen dicoba otomatis dan saat sentuhan pertama; dukungannya ditentukan browser HP. Jika perlu tekan ⛶. Pada browser yang menolak API, kontrol tetap memenuhi viewport tanpa panel tambahan. [Rincian dan batas fullscreen](docs/12-controller-hp.md).

## Tiga game yang tersedia

| Game | Pengalaman |
|---|---|
| **Orbit Berdua** | Kumpulkan 12 cahaya, tolong pasangan yang terkena puing dan buka dua gerbang bersama; tiga arena |
| **Kebun Berdua** | Tanam, siram, panen enam wortel dan enam stroberi, lalu antar ke peti bersama |
| **Seirama** | Delapan ronde dari 40 soal orisinal, pilihan pribadi, tebak pasangan, reveal bersama dan skip tanpa penalti |

Tersedia mode santai/tantangan, tutorial, countdown, pause, hasil, rematch, menu HP, pairing otomatis, reconnect, pengaturan kontrol dan diagnosis RTT. Aturan game berjalan di server laptop; HP tidak menerima video. Jawaban Seirama belum diungkap tidak dikirim ke layar atau HP pasangan.

## Paket offline

Paket siap ekstrak untuk Linux x64 dengan Node.js LTS bawaan:

`artifacts/main-bareng-0.1.0-beta.3-linux-x64-offline.tar.gz`

Paket ini berjalan tanpa `npm install` maupun Node yang terpasang global. Memerlukan sistem Linux x64 yang kompatibel dengan runtime resmi Node 22. Baca **[RUN-OFFLINE.md](RUN-OFFLINE.md)** untuk ekstraksi, pemilihan IP/port, penggunaan hotspot dan diagnosis Wi-Fi. Windows/macOS belum diverifikasi.

## Pengembangan dan pemeriksaan

```sh
npm ci
npm run check
npm test
npm run build
./start.sh
```

Instalasi dependency awal membutuhkan internet/cache, sedangkan runtime bundle tidak. Node 22 LTS disarankan; kode juga telah dibuild/dites dengan Node 20.20.2 pada lingkungan development ini.

```sh
# Paket dengan Node yang tersedia di laptop tujuan:
npm run package:offline
# Paket Linux x64 berisi runtime resmi; persiapan ini mengunduh runtime satu kali:
node scripts/package.mjs --with-runtime
# E2E Chromium, ubah PLAYWRIGHT_CHROMIUM_EXECUTABLE jika diperlukan:
node scripts/browser-check.mjs
```

Source TypeScript berada di `src/`, antarmuka lokal di `public/`, dan bundle offline di `dist/`. Detail implementasi dan keterbatasan: **[laporan beta](docs/11-implementasi-beta.md)**. Lisensi kode/aset orisinal proyek: [MIT](LICENSE); paket distribusi menyertakan notice dependency dan lisensi runtime.

## Spesifikasi dan pengembangan berikutnya

- [Spesifikasi induk](SPEC.md).
- [Produk untuk pasangan](docs/01-produk.md) dan [UX/controller](docs/02-ux-controller.md).
- [12 rekomendasi game dan aturan](docs/03-katalog-game.md); Dapur Berdua adalah ekspansi berikutnya.
- [Arsitektur](docs/04-arsitektur.md), [jaringan/protokol](docs/05-jaringan-protokol.md), [data/SDK](docs/06-data-sdk.md).
- [Operasional/privasi](docs/07-operasional-privasi.md), [pengujian](docs/08-pengujian.md), [roadmap](docs/09-roadmap.md), [keputusan/sumber](docs/10-keputusan-sumber.md).

`Web-Portfolio-3D` hanya referensi kualitas visual. Seluruh game, artwork CSS/SVG/canvas dan soal dibuat terpisah; tidak menyalin portofolio atau membundel game PlayStation.

## Berkontribusi dan dukungan sukarela

Ide dan pengalaman bermain sangat kami hargai, bahkan tanpa kemampuan coding. Buka **Issues → New issue** dan pilih formulir yang sesuai; panduannya ada di [Panduan Kolaborasi](collaboration_guide.md). Semua peserta diharapkan mengikuti [Kode Etik](CODE_OF_CONDUCT.md). Kontribusi tersedia di bawah [lisensi MIT](LICENSE).

Jika ingin mendukung proyek secara sukarela, kamu dapat [mentraktir melalui Trakteer](https://trakteer.id/oskhar). Dukungan ini tidak wajib untuk menggunakan atau berkontribusi pada proyek.
