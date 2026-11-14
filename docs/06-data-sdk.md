# 06 — Data dan kontrak modul game

## Model utama

| Entitas | Field inti dan batas |
|---|---|
| Session | id acak, createdAt, phase, hostPlayerId, locked, protocolVersion; hanya satu sesi aktif v0.1 |
| Player | id server, slot A/B, nickname ≤20 karakter, iconId dari allowlist, colorId, ready, connectionStatus |
| Connection | epoch, role, lastSeen, lastInputAt, lastSeq; token hash hanya di memori server |
| GameManifest | id, version, title, pemain min/max, durasi, genre, layout, mode, assets, entry, apiVersion |
| Match | id, gameId, seed, phase, tick, pauseReason, sharedState dan privateState per pemain |
| Input | axes ternormalisasi, held, actionSeq; diturunkan dari identitas koneksi, bukan slot payload |
| Result | gameId/version, mode, seed, teamScore, activeDuration, completedAt; tanpa jawaban/nama default |
| Preferences | locale, audio, reducedMotion, quality, controllerSize, handedness; schemaVersion |

Tidak ada email, nomor telepon, lokasi, kamera/mikrofon, atau akun wajib. Event koneksi berisi id sesi teredaksi dan alasan teknis, tanpa nama/secret/jawaban. State privat tidak ditambahkan ke snapshot publik lalu disembunyikan CSS; ia dipisahkan sebelum serialisasi.

## Kontrak lifecycle yang akan diimplementasikan

```ts
interface GameModule<State, Public, Private> {
  manifest: GameManifest;
  create(context: GameContext): State;
  handleAction(state: State, playerId: string, action: ValidAction): void;
  tick(state: State, inputs: InputByPlayer, dt: number): void;
  publicSnapshot(state: State): Public;
  privateSnapshot(state: State, playerId: string): Private;
  result(state: State): TeamResult | null;
  dispose(state: State): void;
}
```

Context menyediakan seeded RNG, config mode, waktu simulasi dan daftar pemain; modul tidak membuka socket/file sendiri. Display mempunyai renderer terpisah `mount/render/unmount`; controller memakai layout registry resmi. Pause ditangani engine dengan menghentikan tick, bukan setiap game mengimplementasikan jam sendiri. Renderer tidak membaca state privat.

API v1 membatasi game pada modul yang dibundel dan ditinjau saat build. Manifest bukan izin memuat JavaScript dari URL/unggahan pengguna. Sandbox plugin pihak ketiga adalah pekerjaan lain; jangan mengklaim aman menjalankan kode arbitrer.

Contoh [manifest Orbit](../specs/examples/orbit-duo.manifest.json) merupakan rancangan data, bukan modul yang sudah ada. Field `entry` dan asset path nantinya harus resolve di bundle; validator rilis memeriksa semua rujukan.

## Persistence

Preferensi dan skor tim opsional memakai berkas JSON berversi di direktori data pengguna, terpisah dari source. Tulis temp di direktori yang sama lalu rename atomik; jika rusak, simpan salinan karantina dan pulihkan default tanpa crash. Direktori data tidak disajikan sebagai static assets.

Default skor hanya di memori; penyimpanan rekor perlu opt-in. Seirama tidak menyimpan jawaban ke disk sama sekali. Reset sesi menghapus identitas, jawaban, token dan match dari memori; bersihkan sessionStorage saat logout. Hapus data juga menghapus preferensi/rekor yang dipilih pengguna. Tidak menjamin penghapusan forensik RAM/disk.

## Kontrak perubahan

Mayor protocol/API berubah jika incompatible; minor additive wajib memiliki nilai default. Manifest mengacu game API version. Save version berbeda dari game version; fixture upgrade hanya untuk preferensi/rekor, bukan resume game lama. Game dengan manifest tidak valid tidak boleh merusak katalog, tetapi ditandai unavailable dalam diagnosis.
