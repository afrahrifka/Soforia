# 05 — Jaringan, pairing, protokol dan latensi

## Jaringan lokal

Server port default TCP 3210, antarmuka LAN dipilih dari daftar IP private aktif; bind ke IP terpilih, bukan membuka semua antarmuka tanpa pemberitahuan. Tampilkan IP, port dan URL manual. Loopback-only disediakan untuk development. Interface VPN/Tailscale tidak dipilih otomatis. Jaringan tanpa DHCP, VPN dengan subnet bertabrakan, AP isolation, firewall dan perubahan IP memerlukan diagnosis; kesamaan nama Wi-Fi tidak membuktikan perangkat saling terjangkau.

Koneksi utama: HTTP/WS langsung ke LAN dari halaman yang juga disajikan server LAN yang sama. Tidak memuat controller dari situs cloud kemudian mengakses IP lokal. Dukungan browser dan kebijakan local network access tetap diuji: [MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Local_network_access).

Preferensi jaringan: laptop Ethernet ke router, HP Wi-Fi 5/6 GHz bila tersedia. Laptop Wi-Fi atau hotspot dapat dipakai jika uji dua arah berhasil; bukan garansi kompatibilitas semua hotspot. Aplikasi tidak memasang Tailscale, membuka port router, mengubah firewall atau mengaktifkan UPnP.

## Pairing — revisi beta.2

1. Layar laptop hanya membaca snapshot. Credential loopback display tidak memiliki hak mutasi game atau menerima pemain.
2. QR berisi alamat LAN `/join#invite=<token>`; controller membersihkan fragment lalu otomatis POST `/api/join`, tanpa nama, form atau approval.
3. Tiket join direservasi maksimal 15 detik, dikonsumsi saat WebSocket terautentikasi dan langsung mendapat slot A/B. HP pertama menjadi host. Kapasitas mencakup reservasi sehingga permintaan paralel tidak melebihi dua pemain.
4. Kode enam digit tetap menjadi fallback URL manual. Token pemain diputar saat autentikasi/reconnect; pemain ketiga ditolak. QR otomatis diperbarui ketika kedaluwarsa selama katalog masih menunggu pemain.
5. Hanya HP A mengirim `menu.navigate`, pemilihan mode/arena dan start. Server menolak mutasi dari role display dengan `DISPLAY_READ_ONLY`; bukan sekadar menyembunyikan tombol.

Bagian blueprint endpoint/protokol di bawah merupakan rancangan umum; kontrak runtime beta.2 tercatat di docs/11-implementasi-beta.md dan src/server.ts. Endpoint operator hanya menghasilkan credential display read-only.

## Endpoint yang akan dibuat

| Endpoint | Otorisasi dan hasil |
|---|---|
| GET `/healthz` | Terbuka LAN, hanya readiness dan versi publik, tanpa token/jawaban |
| GET `/console`, `/join`, `/controller` | Aset UI; memuat halaman tidak memberi hak host/display |
| POST `/api/join` | Invite atau kode, origin yang diizinkan; kandidat pemain menunggu persetujuan |
| POST `/api/resume` | Resume token; rotasi token dan connection epoch setelah valid |
| POST `/api/reset` | Host capability; reset setelah konfirmasi UI |
| WS `/ws` | Autentikasi sebagai pesan pertama maksimal 3 detik; role ditetapkan server |

Token tidak dikirim melalui query WebSocket atau log. Semua endpoint mutasi memvalidasi Origin/Host yang dipilih server; tolak Origin asing/null, URL host tidak dikenal dan koneksi tanpa autentikasi. HTTP LAN tidak mengenkripsi token: hanya untuk jaringan pribadi tepercaya, bukan Wi-Fi publik. HTTPS/WSS lokal merupakan profil lanjutan dengan penyiapan trust sertifikat yang jelas, bukan sertifikat self-signed yang diklaim langsung mulus pada semua HP.

## Envelope dan versi

Pesan JSON versi awal: `v`, `type`, `sessionId`, `connectionEpoch`, `seq`, `gameInstanceId` jika relevan, dan `payload`. `seq` monoton per koneksi; epoch server membedakan reconnect. Tolak versi mayor tidak sesuai dengan petunjuk memuat ulang. Unknown type, payload ekstra yang berbahaya, nonfinite number, axes di luar [-1,1], slot buatan client dan frame terlalu besar ditolak.

Pesan controller: `auth`, `input.state`, `action`, `ready`, `pause.request`, `menu.select`, `answer.submit`, `reveal.ready`, `skip`, `heartbeat`, `resume`. Pesan server: `auth.ok`, `lobby.state`, `controller.layout`, `game.snapshot`, `private.state`, `pause.state`, `action.ack`, `pong`, `error`.

```json
{"v":1,"type":"input.state","sessionId":"demo-session","connectionEpoch":2,"seq":41,"gameInstanceId":"demo-match","payload":{"axes":{"x":0.3,"y":-0.7},"held":[]}}
```

Angka/nama di contoh sintetis. Schema runtime lengkap per pesan menjadi keluaran checkpoint CP-02; daftar ini tidak mengklaim implementasi validasi sudah ada.

## Input dan konsistensi

- State gerak dikirim maksimal 60 Hz selama aktif dan segera ketika berubah menjadi netral. Server menyimpan state terbaru per pemain; tidak membuat antrean semua posisi sentuh.
- `action` satu kali mempunyai actionId/actionSeq, gameInstanceId dan ack. Dedup 256 action terakhir per pemain/match. Saat reconnect, server mengembalikan actionSeq terakhir diterima; jangan replay klik lama otomatis.
- Pesan state memakai seq terbaru; stale ditolak. WS reliable/ordered, tetapi bufferedAmount tetap perlu dipantau. Ambang awal client 8 KiB: berhenti menambah state biasa dan simpan satu state terbaru; jika tertahan >250 ms, hentikan sesi input, pause dan reconnect. Jangan menganggap input netral yang masih terantre sudah sampai server.
- Input state diperbarui minimal setiap 100 ms saat match aktif. Tidak ada state baru >250 ms: server menetralkan pemain. Heartbeat tiap 1 detik; timeout 3 detik menandai disconnected. Visibility/blur dapat meminta pause lebih awal; server timeout tetap wajib.
- HTTP JSON maksimal 4 KiB dan WS frame 8 KiB; rate input normal 60/s, batas 120/s per pemain dengan burst 30. Rate join 5 percobaan/menit per IP plus batas global 30/menit; banyak HP di satu IP tidak boleh diblokir permanen. Batas adalah konfigurasi awal yang diuji.
- Reconnect backoff 0,5/1/2/4 detik, maksimum 5 detik dengan jitter. Slot dipertahankan 120 detik; setelah itu host memilih kembali lobby atau pairing ulang, tidak memasukkan bot diam-diam.
- Host disconnect tidak langsung memindahkan kuasa; game pause, host boleh resume. Pemindahan host memerlukan persetujuan operator lokal atau host lama; setiap host transfer dicatat tanpa secret.
- Satu player hanya mempunyai satu koneksi aktif. Resume sah merotasi token, menutup koneksi lama dan menetralkan input. Slot tidak diklaim hanya dari local playerId.

## Pengukuran dan alternatif transport

UI diagnosis menampilkan RTT aplikasi median/p95 dan jumlah reconnect, bukan label input latency. RTT memakai ping-pong diukur pada satu perangkat dengan performance.now; timestamp antarperangkat tidak boleh dikurangkan tanpa sinkronisasi teruji.

Sentuh-ke-gambar diukur kamera dengan visual marker pada controller dan display; log internal mengukur receive→tick→snapshot, tidak mengukur waktu layar fisik. Jaringan referensi dan hasil aktual harus ikut laporan.

WebRTC DataChannel baru dievaluasi bila WS gagal pada profil gangguan nyata. Kanal unordered dengan retransmisi terbatas dapat cocok untuk state yang tergantikan, tetapi memerlukan signaling, evaluasi ICE dan kanal reliable untuk aksi penting. Bukan jaminan lebih cepat atau keharusan memiliki TURN internet. Referensi [DataChannel](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createDataChannel).


## Kesalahan, snapshot dan pemulihan state

Error memakai `code`, `messageKey`, `retryable` dan `requestId` bila ada; tidak menyertakan token atau payload jawaban. Kode minimum: `PAIRING_CLOSED`, `INVITE_EXPIRED`, `APPROVAL_REQUIRED`, `SESSION_FULL`, `AUTH_INVALID`, `HOST_REQUIRED`, `PROTOCOL_MISMATCH`, `STALE_MATCH`, `RATE_LIMITED`, `INVALID_INPUT`, `RESUME_EXPIRED`, `DISPLAY_UNAVAILABLE`. Respons HTTP menggunakan 400 untuk schema, 401 untuk credential, 403 untuk role/origin, 409 untuk konflik sesi, 410 untuk invite/resume kedaluwarsa dan 429 untuk batas laju. Pesan manusia menggunakan Bahasa Indonesia dan memberi tindakan yang dapat dilakukan.

`game.snapshot` mencakup gameInstanceId, serverTick, snapshotSeq, phase, activeTime dan state publik lengkap untuk v0.1. Tidak memakai delta compression sebelum baseline terukur. Display yang kehilangan snapshot cukup menerima berikutnya; refresh meminta snapshot lengkap dan manifest versi yang sama. Client membuang snapshot dari match lama. Private snapshot dikirim hanya setelah autentikasi pemain dan hanya berisi data yang memang boleh diketahui pemain tersebut pada fase saat itu.

Jika resume lewat 120 detik, slot tetap tidak otomatis diisi pemain lain selama match. Host/operator mengakhiri match lalu membuka pairing baru di lobby. Jika proses server mati, token sesi lama tidak berlaku; mulai sesi baru dengan pesan bahwa match sebelumnya tidak dapat dilanjutkan. Tick/render yang berhenti karena laptop sleep menyebabkan pause; jangan memproses durasi tidur sebagai waktu bermain.

## Ekstensi input Kaca Berdua

`input.state` menerima `x`/`y` untuk karakter dan opsional `glassX`/`glassY` untuk kaca. Semua komponen harus finite pada rentang −1 sampai 1; komponen kaca yang tidak disertakan dianggap nol agar controller game lama tetap kompatibel. Server menolak nilai di luar rentang. Kaca memakai aksi `jump`, `retry`, dan `next` pada game instance aktif, dengan mekanisme actionSeq yang sama. Tinggi kaca yang sudah dicapai merupakan state simulasi; menetralkan input atau pause menghentikan perubahan tinggi/rotasi tanpa mengubah pose mendadak. Posisi karakter, checkpoint dan hasil benturan tetap ditentukan server.

Revisi Kaca 15 November: `glassX` kini mengendalikan kemiringan bidang kaca, bukan yaw. Nilai positif berlawanan jarum jam (Miring kiri), negatif searah jarum jam (Miring kanan). `glassY` negatif menaikkan dukungan, positif menurunkan. Snapshot memuat pose pusat dan `roll`, empat sudut diturunkan deterministik dari pose yang sama; `pressure` menggambarkan tekanan dua badan. Jeda tetap hanya dari perintah tombol Jeda. [Rincian aturan](17-kaca-empat-sudut-dan-tantangan.md).

## Revisi runtime 15 November — pemulihan HP terputus

Bagian ini mengganti ketentuan lama tentang reservasi 15 detik, resume 120 detik, mode/arena dari HP dan pause otomatis:

- Reservasi join berlaku 5 detik. Heartbeat tanpa kabar >3,5 detik langsung melepaskan socket, menetralkan input dan menandai pemain terputus. Input basi tetap dinetralkan setelah 250 ms tanpa pause.
- Kapasitas pairing ditentukan slot aktif/reservasi, bukan panjang daftar identitas pemain. Slot terputus dapat diisi ulang dari QR sah tanpa menambah pemain ketiga atau mereset match. QR dashboard terbuka ketika ada slot kosong/terputus. Tombol QR host juga memperhitungkan koneksi aktif.
- Secret pemulihan acak tersimpan lokal pada browser HP; server menyimpan hash. `auth` dapat menyertakan `recoveryToken`, sedangkan token resume tetap diputar. Secret memulihkan identitas yang sama selama sesi server masih ada, termasuk scan di tab baru/browser yang sama. Satu identitas hanya mempunyai satu koneksi aktif; koneksi lama ditutup dan epoch meningkat. Penyimpanan browser dibatasi origin, sehingga perubahan alamat/port atau pindah browser memerlukan scan untuk mengisi slot terputus.
- Slot yang diisi perangkat baru melalui QR mendapatkan credential baru; credential perangkat sebelumnya tidak berlaku lagi. Jawaban Seirama yang belum diungkap pada slot tersebut dihapus agar tidak diberikan kepada pemegang slot baru. Pemulihan dengan secret perangkat lama mempertahankan jawaban sendiri.
- Watchdog browser menyambung ulang jika tidak menerima snapshot >4 detik meskipun WebSocket masih berstatus OPEN. Browser juga memeriksa koneksi saat online/kembali ke foreground. Game tidak dijeda otomatis. Server restart/reset mengakhiri sesi, bukan memulihkan state dari disk.
- Controller umum hanya memilih game. Pengiriman `select` dengan `mode`/`level` ditolak `DEVELOPER_ONLY`; pemilih stage hanya tersedia pada mode developer lokal F2.

Bukti: [uji gangguan browser](evidence/reconnect-browser-report.json) dan tes integrasi pada `tests/server.test.ts`. Semua data uji sintetis; tidak mencatat credential atau jawaban pengguna. Pemutusan jaringan diuji melalui simulasi browser, belum melalui dua HP fisik.
