# 24 — Mode Tailscale dan TV mirror

Permintaan pengguna 16 November 2026 menambah mode bermain melalui tailnet untuk pasangan di tempat berbeda. Mode LAN offline tetap menjadi default. Server otoritatif tetap satu proses di laptop; dua HP menjadi controller. Beberapa TV dapat menonton sesi yang sama secara bersamaan.

## Perintah start

Dari source, instal dependency sekali dan bangun aplikasi:

```sh
npm ci
npm run build
```

Mode normal LAN, tanpa kiosk:

```sh
npm run start:normal
# Alias lama tetap: npm start atau ./start.sh
```

Buka URL `/console` lokal yang dicetak terminal. TV lain pada LAN dapat membuka `http://IP-LAN-LAPTOP:3210/tv`; QR mengarah ke alamat LAN untuk controller. Untuk kiosk laptop gunakan `./play.sh`, lalu `./stop.sh` untuk launcher tersebut. Port dapat berganti jika dipakai; ikuti keluaran terminal.

Mode Tailscale:

```sh
npm run start:tailscale
```

Launcher menemukan hostname MagicDNS mesin saat ini, memeriksa konflik port dan menyalakan:

| Komponen | Alamat bawaan |
|---|---|
| TV mirror, termasuk TV pasangan | `https://NAMA-MESIN.NAMA-TAILNET.ts.net:12443/tv` |
| Controller HP / masuk kode | `https://NAMA-MESIN.NAMA-TAILNET.ts.net:12443/join` |
| Operator developer lokal | `http://127.0.0.1:3211/console` |
| Backend proxy | `http://127.0.0.1:3210` — hanya loopback |

Alamat nyata dicetak di terminal. Setiap QR memakai origin HTTPS yang sama dengan URL TV, diikuti `/join#invite=...`. Undangan aktif jangan disalin ke log, Git atau screenshot. Share **link `/tv`** kepada pasangan; biarkan HP memindai QR yang terlihat pada TV. Saat game berjalan QR mengikuti kebijakan host: hanya muncul ketika pemain 1 meminta, dan ditutup ketika dua controller terisi.

Untuk mengganti port:

```sh
npm run start:normal -- --host 192.168.1.20 --port 3220 --operator-port 3221
npm run start:tailscale -- --port 3220 --operator-port 3221 --https-port 13443
```

Contoh tersebut adalah alternatif, bukan dua proses yang harus dijalankan bersamaan. Jangan menjalankan normal dan Tailscale pada pasangan port backend yang sama. Satu sesi Tailscale memakai metadata PID di `.runtime/tailscale-session.json` agar launcher kedua tidak membuat sesi ganda.

Hentikan proses foreground dengan Ctrl+C. Dari terminal lain:

```sh
npm run stop:tailscale
```

Stop memeriksa PID, direktori dan command launcher folder ini sebelum mengirim SIGTERM. Handler Serve mode ini terikat proses foreground anak launcher; ketika launcher berhenti handler tersebut dilepas. Tidak menjalankan `tailscale serve reset`, tidak mengubah Funnel, firewall, route, login, ACL, systemd atau handler proyek lain. Tidak memasang autostart saat reboot. Jika server dimulai ulang, sesi permainan/pairing juga baru.

Pada paket yang menyertakan runtime, `./runtime/bin/node scripts/start-tailscale.mjs` dapat digunakan tanpa npm. Tailscale CLI/daemon harus sudah terpasang dan aktif pada mesin host. Mode Tailscale memerlukan jaringan Tailscale yang bekerja dan bukan fitur bermain offline tanpa jaringan.

## Menghubungkan pasangan dan TV

1. Laptop server, HP A, HP B, dan perangkat yang membuka layar TV harus mempunyai akses ke tailnet yang sama atau akses node yang dibagikan dan diizinkan kebijakan Tailscale.
2. Buka link `/tv` pada kedua layar. Masing-masing mendapat role **mirror**, bukan pemain. Tidak ada tombol aksi permainan atau kontrol lewat klik, remote, Enter maupun F2.
3. Scan QR menggunakan HP masing-masing. HP pertama mengisi A, HP kedua mengisi B. Controller menjalankan menu, Siap, game, Jeda dan Home. Membuka TV tambahan tidak memindahkan slot HP.
4. Kedua TV menerima snapshot pertandingan yang sama: pilihan game, countdown, progres, hasil dan QR tersinkron dari satu server. Refresh/putusnya TV tidak mengganti pertandingan, menghentikan game, atau menutup TV lain.

TV memerlukan browser WebGL yang dapat menjangkau tailnet. Jika TV tidak mendukung Tailscale/browser yang sesuai, buka link pada laptop/mini PC yang menjalankan Tailscale, lalu hubungkan HDMI ke TV. Mengetik `.ts.net` pada TV yang belum mempunyai jalur jaringan Tailscale tidak otomatis membuatnya tersambung. Alternatif router/site-to-site memerlukan konfigurasi jaringan tersendiri; launcher tidak mengaturnya.

Mirror di sini adalah render dari **state pertandingan yang sama**, bukan stream/capture video desktop. Render, kemampuan GPU, audio dan frame timing terjadi pada masing-masing layar; tidak menjanjikan frame piksel identik atau latensi LAN saat pasangan berada jauh. Audio mengikuti pembatasan autoplay browser; gesture lokal dapat membuka audio tanpa mengirim aksi game. Mode developer F2 tetap terbatas pada `/console` di operator loopback, dan tidak tersedia pada `/tv`, termasuk jika `/tv` dibuka di laptop server.

## Batas akses

Tailscale Serve memberikan HTTPS privat dalam tailnet, bukan publik melalui Funnel. Launcher memilih port 12443 secara default dan menolak port yang sudah mempunyai konfigurasi Serve. Ia tidak mengambil alih 443/8443 atau service lain. URL frontend dipisahkan dari listener backend; origin HTTP palsu/hostname lain ditolak, sedangkan reverse proxy HTTPS dan WebSocket origin yang tepat diterima.

Endpoint `/api/display` hanya memberi credential role mirror sekali pakai, berlaku 30 detik sebelum autentikasi. Role mirror hanya dapat mengirim heartbeat; server menolak aksi mutasi walaupun klien dimodifikasi. Credential operator tidak disajikan melalui proxy Tailscale. Tidak ada proyeksi jawaban pribadi controller ke TV. Tailnet/LAN tetap jaringan tepercaya: orang yang diizinkan membuka `/tv` dapat melihat QR dan mencoba ikut mengisi dua slot pemain.

## Pemeriksaan dan troubleshooting

```sh
npm test -- --scope platform
npm test -- --scope tooling
npm run check
npm run build
node --import tsx src/platform/tools/tv-browser.mjs
```

Uji browser terhadap sesi Tailscale yang **khusus pengujian dan belum dipakai pemain**:

```sh
node --import tsx src/platform/tools/tv-browser.mjs --base https://NAMA-MESIN.NAMA-TAILNET.ts.net:12443
```

Alat tersebut membuka TV/controller sintetis dan memulai pertandingan. Jangan jalankan pada sesi pasangan yang sedang dimainkan. Bukti tanpa token/QR ada di `src/platform/evidence/lan-tv-browser-report.json` dan `tailscale-tv-browser-report.json`; status aktual di `src/platform/STATUS.md`.

- Gagal sebelum startup: periksa `tailscale status`, MagicDNS dan executable Tailscale. Launcher tidak melakukan login/up secara otomatis.
- Port dipakai: pilih `--https-port` lain; untuk backend pilih `--port` dan `--operator-port` lain. Jangan mereset Serve atau menghentikan aplikasi lain.
- URL TV tidak terbuka: aktifkan Tailscale pada perangkat layar dan pastikan grant/ACL mengizinkan port HTTPS yang dipilih. Laptop server harus tetap aktif.
- QR membuka alamat LAN: pastikan proses yang berjalan memakai `start:tailscale`, lalu refresh `/tv`. Jangan membuka build/server LAN lama pada port lain.
- TV tidak ada WebGL: gunakan perangkat browser lain melalui HDMI.
- HP ganti origin/port: credential browser terikat origin; gunakan QR sesi terbaru. Maksimal tetap dua pemain.

## Referensi primer

Diperiksa 16 November 2026:

- [Tailscale Serve CLI](https://tailscale.com/docs/reference/tailscale-cli/serve): proxy HTTPS, pemilihan port, foreground/background dan pengelolaan handler.
- [Tailscale Serve](https://tailscale.com/docs/features/tailscale-serve): akses privat dalam tailnet dan perbedaan dengan Funnel.
- [Berbagi development server](https://tailscale.com/docs/use-cases/application-testing/share-local-dev-server-with-team): akses aplikasi melalui URL HTTPS tailnet.

Uji otomatis membuktikan alur browser/otorisasi, bukan penerimaan dua HP/TV fisik, performa WAN atau input-to-photon.
