# Platform LAN dan shell konsol

Scope `platform`: `server.ts` untuk sesi/pairing/otoritas, `game-runtime.ts` untuk dispatch, `app.ts` untuk lifecycle browser, `touch-controller.ts` untuk shell HP, `scene3d.ts` untuk resource WebGL, `client-registry.ts` untuk lookup, dan `style.css` untuk dasar bersama. Kontrak ada di `src/shared/game-contracts.ts`.

Jangan menambahkan daftar ID game di sini. Fitur khusus game memakai hook adapter. Generator membuat registry di folder ignored. Entri program per-game dibangun otomatis, dengan host tetap satu proses LAN. Baca docs/architecture/MODULES.md sebelum mengubah kontrak. Jalankan tes seluruh game dan server, check/build serta regresi browser.


Mode jaringan: `network.ts` memisahkan listener backend dan origin publik untuk LAN/Tailscale. `/tv` serta `/console` remote memakai role `mirror` yang hanya menerima snapshot dan heartbeat; operator lokal tetap terpisah. Beberapa mirror tidak saling menggantikan dan tidak mengambil slot pemain. `scripts/start-tailscale.mjs` mengelola lifecycle proxy pada port khusus. [Panduan menjalankan](../../docs/24-tailscale-dan-tv.md).
