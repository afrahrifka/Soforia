# Status platform

15 November 2026 — perbaikan tes CI: tes integrasi server mengambil aset dari `public/` yang dilacak Git, bukan `dist/public/` yang hanya tersedia setelah build. Kegagalan GitHub `404 !== 200` terjadi saat meminta model crate pada checkout baru. Tes tetap memeriksa status HTTP, MIME GLB, header biner dan penolakan traversal; pairing, reconnect, otorisasi dan privasi tidak dilonggarkan. Program platform dan seluruh game tidak diubah.

Verifikasi sebelum/sesudah dilakukan pada salinan file Git yang bersih tanpa `dist/`, memakai dependensi lokal yang sama. Sebelum perbaikan 7/8 tes platform lulus; setelahnya seluruh 60 tes lulus tanpa dist pada Node 24 dan Node 22.23.5. Urutan CI check → test → check:docs → build juga lulus. Bukti ada di evidence/ci-test-report.json; run GitHub baru belum dijalankan. Uji sumber ini tidak menggantikan build/regresi browser atau dua HP fisik.

## 16 November 2026 — Tailscale dan beberapa TV mirror

Permintaan pengguna mengotorisasi scope architecture untuk host, launcher, tes dan dokumentasi, termasuk deployment Soforia pada Tailscale yang sudah aktif. Mode LAN tetap default; mode Tailscale menambahkan HTTPS Serve pada port khusus dengan backend loopback. Tidak mengubah login, ACL, firewall, route, Funnel, systemd atau deployment lain.

`/tv` dan `/console` remote memakai role mirror terpisah dari operator developer lokal. Dua TV atau lebih dapat menerima snapshot sesi yang sama tanpa menggantikan layar lain, mengambil slot pemain, mendapat jawaban privat, atau mengirim aksi mutasi. QR memakai origin mode aktif: LAN atau HTTPS Tailscale. HP tetap dua controller A/B. Mode keyboard developer hanya tersedia pada operator loopback `/console`, bukan `/tv`.

Perintah: `npm run start:normal` (alias `npm start`), `npm run start:tailscale`, dan `npm run stop:tailscale`. Launcher Tailscale memeriksa konfigurasi background **dan foreground** agar port handler proyek lain tidak ditimpa. Handler milik sesi ini terikat lifecycle proses; stop memeriksa PID/command/cwd milik folder ini. [Runbook](../../docs/24-tailscale-dan-tv.md).

Verifikasi aktual:

- `npm test`: **113/113 lulus**, termasuk seluruh game, dashboard, platform dan tooling pada workspace saat ini.
- Scope platform **14/14** lulus; scope tooling **9 tes** tercakup dalam suite global. Tes baru memeriksa origin HTTPS/proxy, pemisahan operator, dua mirror serentak, mutasi ditolak, isi SVG QR sesuai origin, dua slot dan refresh tanpa pause.
- Tes katalog platform lama diperbaiki dari asumsi game terakhir selalu Kaca menjadi ID terakhir dari katalog snapshot. Pemeriksaan wrap navigasi tetap ada; manifest baru tidak membuat tes salah gagal.
- `npm run check`, `npm run build`, `npm run check:docs`, serta `git diff --check` lulus.
- Browser Chromium LAN dan link Tailscale HTTPS/WSS nyata pada mesin host lulus: dua TV, dua controller melalui UI asli, pertandingan sama, QR origin sesuai, F2/klik/Enter tidak mengirim mutasi, refresh dan membuka TV dari browser controller tidak merebut slot. Tidak menyimpan QR, token atau snapshot. [Bukti LAN](evidence/lan-tv-browser-report.json), [bukti Tailscale](evidence/tailscale-tv-browser-report.json).
- Lifecycle nyata start/stop Tailscale berhasil: HTTPS health 200; konfigurasi Serve setelah stop persis sama dengan sebelum startup; handler lama dipertahankan saat sesi aktif. [Bukti deployment](evidence/tailscale-deployment-report.json).
- `npm run check:scope -- --working` belum lulus karena workspace gabungan mempunyai 10 change note (9 sudah ada sebelum tugas ini), termasuk perubahan game lain. Validasi subset path milik tugas architecture lulus; bukan klaim bahwa seluruh diff workspace berasal dari tugas ini.

Deployment ditinggalkan aktif pada HTTPS port 12443; URL hostname mesin dicetak launcher dan disampaikan kepada pengguna, tidak disimpan dalam evidence Git. Tidak memasang autostart saat reboot. Pengujian Tailscale berasal dari browser pada mesin host sendiri, bukan TV/dua HP fisik atau bukti jalur WAN antarkota. Browser TV harus mendukung WebGL dan punya jalur akses tailnet; gunakan perangkat Tailscale melalui HDMI bila TV tidak mendukung. Mirror memakai state yang sama, bukan video desktop/pixel-identik. FPS, RTT WAN, input-to-photon dan penerimaan pasangan jarak jauh belum diukur. Commit/push tidak dilakukan.
