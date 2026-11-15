# Apa yang ditegakkan dan apa yang tidak

| Mekanisme | Yang diperiksa | Batas |
|---|---|---|
| `check-boundaries.mjs` | AST import/re-export/dynamic import literal, symlink source, graph browser/server dan cross-game import | Bukan sandbox JavaScript atau pembaca pikiran; code review tetap perlu |
| `css-scopes.mjs` | Prefix game/dashboard, penolakan selector/at-rule yang keluar scope, namespace animasi | Tidak menilai kualitas visual/layout |
| `check-scope.mjs` | Diff satu scope, tepat satu change note, penolakan game/lapisan lain dan output/private path | Scope `architecture` diotorisasi melalui review, bukan flag yang dapat dipercaya sendiri |
| Discovery dan kontrak | Folder/ID unik, file wajib, metadata/input, type check adapter | Tidak menilai desain game |
| Tes, build, browser | Regresi perilaku dan integrasi yang benar-benar dijalankan | Bukan dua HP fisik, FPS atau keseruan |
| CODEOWNERS + proteksi branch | Review pemilik dan required checks sebelum merge | Harus diaktifkan pemilik GitHub; admin dapat mempunyai hak bypass |

CI scope memakai validator/policy dari base commit bila tersedia. Migrasi pertama belum memiliki baseline itu; jalur bootstrap ditandai dan harus ditinjau pemelihara. Workflow berjalan pada `pull_request` dengan izin baca, tidak mengeksekusi kode PR pada `pull_request_target` dengan credential tulis.

## Aktivasi pemilik repo

Di Settings → Rules/Branches untuk `master`, minta PR sebelum merge, Code Owner review, dan required checks: **Boundaries and tests**, **Scoped changes**, **Browser regression**, **Validate PR Title**. Batasi bypass sesuai kebijakan tim. Pengaturan tersebut belum diubah oleh implementasi lokal ini. Jika nama job berubah, required checks harus disesuaikan.

## Pintu masuk AI

Adapter lokal menunjuk aturan yang sama. Dukungan bergantung tool/versi/konfigurasi; jangan menyatakan semua AI pasti membacanya. Sumber resmi yang diperiksa:

- [GitHub Copilot repository instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions): `.github/copilot-instructions.md` dan instruksi per-path sesuai dukungan tool.
- [Claude Code memory](https://code.claude.com/docs/en/memory): `CLAUDE.md` dan instruksi berjenjang.
- [Gemini CLI context](https://geminicli.com/docs/cli/gemini-md/): `GEMINI.md`.
- [Cursor rules](https://prod.cursor.com/help/customization/rules): `.cursor/rules/*.mdc`; adapter menggunakan `alwaysApply`.

File legacy/adaptor lain merupakan petunjuk kompatibilitas, bukan jaminan semua edisi Aider/Cline/Roo/Windsurf/Continue mengaktifkannya. Pastikan tool menampilkan instruksi yang dimuat atau lampirkan `AGENTS.md` dan `AI-START.md` secara manual. Tidak ada aturan repo yang mengalahkan instruksi sistem, izin tool atau otorisasi pengguna.
