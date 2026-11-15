# glass

Scope `game:glass`. Metadata katalog: manifest.json; artwork: art.ts; gaya lokal: style.css; kontrak: src/shared/game-contracts.ts (read-only untuk task game).

Aturan/gerak/kaca: `glass.ts`, `glass-collision.ts`. Rangkaian stage: `glass-levels.ts`; dunia/objek: `glass-world.ts`; jalur: `glass-route.ts`; tanah/jurang: `glass-terrain.ts`; kamera: `glass-camera.ts`; humanoid: `soft-carrier.ts`; interpolasi: `glass-presentation.ts`; audio: `glass-audio.ts`; keyboard: `glass-controls.ts`.

Untuk keluhan map, baca levels → world → route/terrain dan tes terkait. Untuk kamera cukup camera/presentation/console. Jangan mengedit dashboard, renderer umum atau game lain.

Tes: `npm test -- --scope game:glass`. Tool perjalanan: `node --import tsx src/games/glass/tools/glass-course-check.mjs`; kontrol: `node --import tsx src/games/glass/tools/glass-browser-check.mjs`; visual/audio tersedia di tools. Output baru masuk evidence milik game. Bukti historis docs/evidence dipertahankan, tidak ditimpa tugas game baru.
