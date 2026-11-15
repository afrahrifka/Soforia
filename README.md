# Main Bareng · Soforia

Konsol game lokal untuk dua orang: laptop menjadi layar dan server otoritatif, dua browser HP menjadi controller melalui Wi-Fi/LAN yang sama. Setelah build tersedia, permainan tidak membutuhkan internet atau akun cloud.

**Bahasa / Languages:** [Indonesia](README.md) · [English](docs/i18n/README.en.md) · [Español](docs/i18n/README.es.md) · [Português](docs/i18n/README.pt.md) · [日本語](docs/i18n/README.ja.md) · [简体中文](docs/i18n/README.zh-CN.md)

**Kontributor dan AI:** mulai dari [AGENTS.md](AGENTS.md), [peta fokus](docs/architecture/AI-START.md) dan [panduan kolaborasi](collaboration_guide.md). Perbaikan satu game tidak boleh mengedit dashboard, game lain atau API bersama tanpa cakupan yang sesuai.

## Memainkan

Prasyarat pengembangan: Node.js **20.19+**, npm, browser laptop dengan WebGL, serta dua HP pada LAN yang sama. Linux menjadi host launcher utama; kenyamanan dua HP/performa lintas perangkat belum dinyatakan lulus acceptance.

```sh
npm ci
npm run check
npm test
npm run build
./play.sh
```

Launcher mencetak URL layar operator lokal dan controller LAN serta membuka layar konsol. Scan QR dari masing-masing HP; alamat IP/port mengikuti keluaran launcher, bukan URL localhost pada HP. Kedua pemain dapat memilih game di dashboard dan menekan Main. Jeda hanya melalui tindakan pemain, bukan otomatis ketika HP terputus.

Jika menjalankan server tanpa kiosk:

```sh
npm start
# Buka URL /console lokal yang dicetak terminal.
```

Untuk distribusi terbangun/offline lihat [RUN-OFFLINE](RUN-OFFLINE.md). Paket beta lama bukan otomatis build source terbaru. Jika perlu, bangun ulang dengan `npm run package:offline`. Jangan mengubah firewall/Tailscale/systemd atau deployment lain untuk menjalankan proyek ini.

## Permainan yang tersedia

| Game | Kerja sama/tantangan |
|---|---|
| Orbit Berdua | Mengumpulkan cahaya, membantu pasangan dan membuka gerbang bersama |
| Kebun Berdua | Membagi tugas tanam, siram, panen dan antar hasil |
| Seirama | Jawaban pribadi dan tebakan pasangan, hanya dibuka saat siap |
| Kota Berdua | Duel properti, distrik, peningkatan dan keputusan ekonomi |
| Kaca Berdua | 60 rangkaian tantangan fisik, enam bioma, angkat/guling/merunduk/lompat, mesin bergerak dan audio lokal |

Kaca tidak memakai aturan sudut wajib atau pecah abstrak karena tekanan/jangkauan. Checkpoint akhir langsung berpindah stage. Tombol **♫** pemain 1 mengatur audio game bersama; **M** pada laptop mengatur mute lokal. Untuk uji dua pemain keyboard, di katalog dengan slot kosong tekan **F2**, lalu **Enter** untuk tutorial/mulai; **F3** keluar. [Kontrol lengkap](docs/18-kaca-keyboard.md).

## Arsitektur untuk mengurangi konflik

```text
src/dashboard/          menu dan layout katalog
src/platform/           sesi LAN, shell browser, dispatcher, renderer umum
src/shared/             kontrak, helper, matematika dan loader aset bersama
src/games/<id>/         program server, console, controller, HUD, audio, CSS,
                        aset, tes, tools, evidence dan status game itu
src/generated/          registry otomatis; ignored, bukan file kontribusi
```

Setiap game punya entry aturan dan client/console sendiri, dalam satu host LAN. [Kontrak modul](docs/architecture/MODULES.md) menjelaskan API dan arah dependensi. Facade `src/*.ts` lama dipertahankan untuk kompatibilitas script historis, bukan lokasi implementasi baru.

**Registrasi tunggal:** satu folder game, satu ID unik, satu manifest. Build menemukan modul dan membuat entry/bundel otomatis; tidak mengedit array katalog atau switch di dashboard/host.

```sh
npm run game:new -- --id komet --title "Komet Berdua"
npm run change:new -- --scope game:komet --summary "Tambah Komet Berdua"
npm test -- --scope game:komet
npm run check
npm run build
npm run check:scope -- --working
```

Starter dapat dijalankan, tetapi desain dan playtest tetap tugas pembuat game. [Panduan menambah game](docs/architecture/ADD-GAME.md) memuat kontrak manifest, aset/lisensi dan batas scope.

## Berkontribusi bersama manusia atau AI

- Ambil/buat issue dan tetapkan satu scope: `game:<id>`, `dashboard`, `platform`, `docs`, `tooling`, `assets`, atau migrasi `architecture` yang diotorisasi.
- Jalankan `npm run ai:route -- --scope game:glass` untuk jalur baca/tulis yang tepat. Pakai branch/worktree terpisah, bukan working tree bersama beberapa AI.
- Simpan status, tes dan bukti rutin dalam modul sendiri. Satu change note unik menggantikan perebutan changelog/registry pusat.
- Verifikasi `npm run check`, tes relevan, build, scope diff dan `npm run check:docs`. Commit `type(scope): ringkasan` melalui `npm run commit`; scope game dibaca dari manifest.
- Ikuti [Kode Etik](CODE_OF_CONDUCT.md). Laporan masalah/ide/perbaikan tulisan tetap diterima tanpa harus coding.

Adapter instruksi disediakan untuk tool AI umum, tetapi tidak ada file yang menjamin setiap AI memuat atau menaati instruksi. Batas impor, pemisahan CSS, scope diff dan CI membantu menolak kesalahan yang dapat diperiksa. Pemilik repo masih perlu mengaktifkan required checks/Code Owner review; lihat [penegakan dan batasnya](docs/architecture/ENFORCEMENT.md).

## Lisensi, privasi dan status kualitas

Kode, geometri dan audio orisinal memakai [MIT](LICENSE). Pustaka model pihak ketiga CC0 mempunyai [inventaris dan atribusi](public/assets/ATTRIBUTION.md); lisensi sumber tetap berlaku. Portofolio referensi bukan sumber kode/game untuk disalin.

Jangan unggah QR aktif, secret sesi, jawaban pribadi atau data pribadi ke issue, fixture, screenshot atau Git. Laporan keamanan disampaikan secara pribadi melalui kanal pemelihara di [profil @oskhar](https://github.com/oskhar), bukan detail celah pada issue publik.

Tes otomatis dan simulasi tidak membuktikan keseruan, dua HP fisik, FPS atau input-to-photon. Status aktif dan batasnya ada pada [roadmap](docs/09-roadmap.md), [spesifikasi](SPEC.md) dan `STATUS.md` setiap modul. Dokumen revisi bernomor lama adalah riwayat; peta path terbaru adalah [MODULES](docs/architecture/MODULES.md).

Dukungan sukarela tersedia melalui [Trakteer](https://trakteer.id/oskhar); tidak wajib untuk memakai atau berkontribusi.
