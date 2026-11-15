# 23 — Arsitektur modul dan kolaborasi

Tanggal: 15 November 2026. Cakupan migrasi lintas modul diotorisasi pengguna. Tujuan: satu kontributor dapat memperbaiki satu game atau dashboard tanpa mengubah modul milik kontributor lain. Perubahan tantangan/audio Kaca yang sudah ada dipertahankan; migrasi ini bukan putaran desain level baru.

## Program dan kepemilikan

- `src/dashboard/`: pemilihan game dan QR katalog. Tidak mengimpor program game; artwork diinjeksi host dan metadata berasal dari manifest.
- `src/games/<id>/`: manifest, server otoritatif, client, console laptop, controller HP, HUD, artwork, gaya, map/audio, tes, tool, bukti dan status milik game tersebut.
- `src/platform/`: sesi LAN, pairing/reconnect, input, lifecycle dan resource renderer bersama. `src/shared/`: kontrak, helper matematika dan aset renderer bersama.
- `src/generated/`: katalog dan registry otomatis, diabaikan Git. Facade tipis `src/*.ts` serta wrapper tool lama dipertahankan agar rujukan historis tidak langsung putus; bukan path implementasi baru.

Build menghasilkan `dist/games/<id>/server.mjs`, `dist/public/games/<id>/client.js` serta entry dashboard/host dan chunk bersama. Semua tetap berjalan pada satu server LAN otoritatif dan browser, bukan proses OS terisolasi atau sandbox keamanan. HTTP hanya menyajikan modul browser/aset yang diizinkan, bukan sumber server.

## Satu aturan penambahan game

**Satu ID unik, satu folder pemilik, satu manifest, satu PR dengan satu change note unik.** Jalankan `npm run game:new -- --id <slug> --title "Judul"`. Tidak mengedit array katalog, switch dashboard, registry atau daftar scope commit pusat. Generator memvalidasi kontrak, identitas, input dan file/tes wajib; urutan seri ditentukan `order` lalu ID sehingga nilai order yang sama tidak menimbulkan konflik registrasi. Starter merupakan contoh yang dapat dimainkan, bukan game matang yang sudah diterima pasangan.

## Panduan dan penegakan

[AGENTS](../AGENTS.md) di root dan setiap modul, [peta AI](architecture/AI-START.md), [kontrak modul](architecture/MODULES.md), [kolaborasi](architecture/COLLABORATION.md), [penambahan game](architecture/ADD-GAME.md) dan [batas penegakan](architecture/ENFORCEMENT.md) adalah jalur baca. Adapter tersedia untuk Codex, Claude, Gemini, Copilot, Cursor dan petunjuk kompatibilitas tool lain. README tersedia dalam Indonesia, English, Español, Português, 日本語 dan 简体中文. Bahasa dokumentasi proyek tetap Indonesia; terjemahan mengikuti permintaan pengguna.

Pemeriksaan AST menolak dependensi lintas game dan browser→server; build membatasi CSS ke pemilik dan memberi namespace animasi. Validator diff memeriksa scope dan tepat satu change note; CI menggunakan validator/policy base yang dipercaya setelah bootstrap pertama. Konfigurasi commit mengambil scope game dari manifest. Test helper/scaffolder tidak mensyaratkan pengeditan daftar jumlah game saat menambah game berikutnya.

Tidak ada file yang dapat menjamin semua jenis AI membacanya atau selalu patuh. Ini juga bukan sandbox kode berbahaya. Scope `architecture` memerlukan alasan dan review pemilik; flag bukan bukti persetujuan. CODEOWNERS dan workflow sudah disiapkan, tetapi pemilik harus mengaktifkan proteksi branch/required checks di GitHub. Hook lokal opt-in dengan `npm run hooks:install`, tidak diam-diam mengubah konfigurasi Git pengguna.

## Verifikasi dan batas

**60 tes lulus**, termasuk enam tes tooling. TypeScript, build, scope diff dan 33 dokumen/pintu masuk diperiksa; paket node-required berhasil dibuat. Hasil akhir dicatat pada [laporan mesin](evidence/modular-architecture-report.json). Tes meliputi regresi aturan lima game, pairing/reconnect/privasi, batas impor/CSS/scope, serta game sintetis baru dalam direktori sementara: host/dashboard tidak berubah, registry/build/entry server-client/aset tersedia dan starter selesai melalui input. Direktori sintetis dibersihkan; tidak menjadi game keenam di repo.

Regresi browser menjalankan dashboard, QR, dua controller browser, layout, perpindahan game, privasi Seirama dan putaran Kota. Hasil tersebut bukan uji dua HP fisik, penerimaan desain Kaca, pengukuran FPS atau input-to-photon. Bukti perilaku Kaca sebelumnya tetap di [laporan 22](22-kaca-tantangan-dan-audio.md); tools aktif dan bukti baru berada di folder game.

Titik lanjut: aktifkan proteksi merge oleh pemilik, uji onboarding satu kontributor dengan scope game tunggal, dan lanjutkan playtest pasangan/perangkat nyata dari status setiap game. Tidak mengubah firewall, Tailscale, systemd atau deployment lain.

Build terbaru dimuat ulang ke proses lokal Soforia pada controller 3210/operator 3211; health, entry app dan chunk modul merespons HTTP 200. Refresh layar/HP dan scan QR baru karena sesi proses sebelumnya berakhir.
