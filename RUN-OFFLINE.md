# Menjalankan Main Bareng tanpa internet

## Paket Linux x64 dengan runtime bawaan

Ekstrak `main-bareng-0.1.0-beta.3-linux-x64-offline.tar.gz` lalu buka terminal di folder hasil ekstraksi:

```sh
./play.sh
```

Launcher menyalakan server. Launcher menyimpan PID dan log di `.runtime/` serta melepas proses melalui nohup/setsid bila tersedia, tanpa memasang unit systemd. Launcher juga membuka layar laptop otomatis dalam mode kiosk fullscreen Chromium/Chrome dengan profil aplikasi terpisah. Browser perlu sudah terpasang pada laptop; tidak dibutuhkan instalasi di HP. Tidak membutuhkan npm, unduhan dependency, akun, atau internet saat menjalankan paket. Runtime Node.js LTS sudah disertakan; sistem masih membutuhkan Linux x64 kompatibel dengan runtime resmi Node 22 (glibc dan libstdc++ sistem). Paket ini bukan installer universal Android/Windows/macOS.

Untuk berjalan di foreground:

```sh
./start.sh
```

Setelah startup, terminal menampilkan dua URL:

- **Layar laptop:** `http://127.0.0.1:3211/console`.
- **Controller HP:** `http://IP-WIFI-LAPTOP:3210/join`.

1. Hubungkan laptop dan kedua HP ke router Wi-Fi yang sama. Router boleh tidak mempunyai koneksi internet. Pesan HP “Wi-Fi tanpa internet” normal; pilih tetap terhubung bila diminta.
2. Buka layar laptop. Scan QR dari kedua HP dengan kamera bawaan, atau buka alamat controller dan isi kode ruang.
3. Setelah scan QR, HP langsung masuk ke controller A/B tanpa nama, formulir, atau persetujuan. Maksimal dua controller. Alamat manual tetap memakai kode ruang.
4. Gunakan D-pad controller untuk memilih game. Tekan **Main**, lalu pemain yang terhubung menekan **Siap**. Mode/stage tidak dipilih dari controller biasa.
5. Lihat permainan pada laptop/TV; HP menjadi controller. Seluruh menu permainan dapat dioperasikan dari HP A.

Tidak ada streaming video ke HP. Aturan game, timer dan collision berjalan di laptop. Jawaban Seirama dikirim hanya kepada pemiliknya sampai kedua pemain siap mengungkap.

## Memilih alamat Wi-Fi atau port

Aplikasi memilih IP LAN pertama dan mengecualikan interface VPN/Tailscale/Docker. Jika laptop memiliki beberapa adapter/alamat, pilih IP yang berada pada jaringan HP:

```sh
./play.sh --host 192.168.1.20 --port 3210 --operator-port 3211
```

Ganti contoh IP dengan IP nyata laptop. QR menyesuaikan alamat tersebut. Jika port terpakai, pilih pasangan port lain; jangan menghentikan layanan lain. Pilihan IP tidak tersimpan otomatis: berikan lagi saat startup berikutnya. IP dapat berubah setelah pindah Wi-Fi; hentikan dan jalankan kembali aplikasi agar QR diperbarui.

## Menghentikan

```sh
./stop.sh
```

Untuk foreground gunakan Ctrl+C. Tidak ada autostart saat reboot; jalankan launcher lagi setelah menyalakan laptop. Untuk proses foreground gunakan `./start.sh` di terminal yang dibiarkan terbuka. Log startup dan PID launcher ada di `.runtime/`, tanpa token atau jawaban. Menutup proses menghapus sesi; scan QR ulang setelah server dinyalakan kembali.

## Jika HP gagal terhubung

- Pastikan URL di HP memakai IP Wi-Fi laptop, bukan `localhost` atau `127.0.0.1`.
- Hindari guest Wi-Fi atau router yang mengaktifkan client/AP isolation.
- Izinkan akses jaringan lokal jika browser meminta.
- Periksa firewall TCP port game yang dipilih (default 3210) pada jaringan pribadi. Port operator 3211 hanya loopback dan tidak perlu dibuka untuk HP.
- Hotspot HP/laptop boleh dicoba jika perangkat benar-benar saling dapat mengakses; dukungannya berbeda antarperangkat.
- Jangan mengunci HP atau berpindah aplikasi ketika bermain. Input terputus dinetralkan; permainan terus berjalan tanpa pause otomatis. Kembali ke controller untuk reconnect.
- Browser/origin yang sama menyimpan credential pemulihan; reload atau scan ulang dapat memulihkan slot selama sesi server masih ada.

HTTP LAN ditujukan untuk Wi-Fi pribadi tepercaya; traffic tidak terenkripsi. Tidak perlu dan tidak ada perubahan Tailscale, port forwarding router, UPnP, atau deployment lain.

## Dari source

Untuk persiapan pertama, npm ci membutuhkan dependency sudah tersedia atau akses internet. Setelah build, npm/node_modules tidak diperlukan untuk runtime bundle:

```sh
npm ci
npm run check
npm test
npm run build
./play.sh
```

Source membutuhkan Node; Node 22 LTS disarankan. `node dist/server.mjs` juga dapat dijalankan langsung. Jangan menghapus `dist/public` dari paket.

## Membuat paket

```sh
npm run package:offline
# Varian lengkap dengan runtime Linux x64 resmi:
node scripts/package.mjs --with-runtime
```

Perintah pertama membuat bundle yang masih memerlukan Node pada laptop tujuan. Perintah kedua mengunduh runtime resmi satu kali dan memeriksa SHA-256 dari Node.js, kemudian membuat paket yang dapat dijalankan offline. Paket tidak menyertakan nama pemain, jawaban, invitation atau data sesi. Lihat lisensi dependency pada THIRD_PARTY_NOTICES.md dan runtime/LICENSE.

## Mode layar saja dan fullscreen

`./play.sh` menjalankan server dan membuka `./open-console.sh`. Browser Chromium/Chrome diluncurkan dengan `--kiosk --start-fullscreen`, memakai profil khusus `.runtime/kiosk-profile`. Tidak mengubah profil browser pribadi. Jika server sudah aktif, `./open-console.sh` cukup untuk membuka layar. Variabel `MAIN_BARENG_BROWSER` dapat menunjuk executable Chromium/Chrome lain.

Laptop tidak memiliki tombol/tautan kontrol; mouse/keyboard di halaman diabaikan. Credential display juga ditolak server untuk seluruh aksi mutasi game. Ini pembatasan aplikasi, bukan penguncian sistem operasi: Alt+F4 atau kontrol OS tetap dapat menutup jendela. Gunakan `./stop.sh` untuk menutup layar dan server milik aplikasi. Layanan layar bernama `main-bareng-screen.service` terpisah dari server.

Fullscreen otomatis memerlukan sesi desktop grafis dan Chromium/Chrome terpasang. Tab browser biasa tetap display-only tetapi kebijakan browser tidak mengizinkan halaman memaksa fullscreen tanpa gesture. Kiosk launcher yang memenuhi mode fullscreen otomatis.

## Controller HP beta.3

Scan QR langsung masuk kontrol tanpa header/footer. Analog kiri memilih game pada katalog atau menggerakkan karakter; empat hingga enam tombol kanan berubah sesuai game. Home kecil di kiri atas kembali ke katalog, tombol ⛶ di kanan atas mencoba fullscreen.

Aplikasi mencoba fullscreen saat terhubung dan pada sentuhan pertama, serta meminta orientasi landscape bila didukung setelah fullscreen aktif. Tidak ada overlay wajib untuk mengaktifkan kontrol. Chrome/Safari/Firefox dan versi OS dapat menerapkan aturan yang berbeda; app tidak dapat memaksa browser yang tidak mengizinkan fullscreen. Jika address bar masih terlihat, tombol ⛶ boleh dicoba; layout tetap memenuhi area halaman yang tersedia. [Detail pengujian](docs/12-controller-hp.md).

Menahan analog dan menekan aksi memakai pointer terpisah. Perubahan orientasi/ukuran layar, pointercancel dan keluar tab menetralkan input. Home dapat dipakai kedua pemain, sehingga ronde aktif akan dihentikan bila salah satu kembali ke katalog.

### Jika ada salinan Main Bareng lain yang berjalan

`./play.sh` kini berjalan mandiri tanpa unit systemd. Jika port 3210/3211 terpakai, launcher memilih pasangan kosong berikutnya dan mencetak alamat baru. Gunakan QR dari layar yang baru dibuka. Untuk menentukan port sendiri, gunakan `./play.sh --port 3220 --operator-port 3221`. Pemanggilan ulang memakai proses milik folder yang sama; `./stop.sh` hanya menghentikan server dengan jalur yang sesuai folder ini.


## TV tambahan dan mode Tailscale opsional

Mode normal tetap `./start.sh` atau `npm run start:normal` dari source. TV LAN tambahan membuka `http://IP-LAN-LAPTOP:PORT/tv`. Untuk pasangan melalui tailnet, setelah build jalankan `npm run start:tailscale` (atau `./runtime/bin/node scripts/start-tailscale.mjs` pada paket dengan runtime). Mode Tailscale memerlukan Tailscale aktif dan jaringan yang bekerja; tidak termasuk klaim offline di atas. Semua TV hanya mirror; QR menyesuaikan mode. [Panduan lengkap, start/stop dan port](docs/24-tailscale-dan-tv.md).
