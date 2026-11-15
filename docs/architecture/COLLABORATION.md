# Kerja bersama dengan scope yang dapat diperiksa

1. Buat/ambil issue dan sebutkan game atau lapisan. Satu branch/PR untuk satu scope. Dua game berbeda dapat dikembangkan bersamaan tanpa mengedit registry.
2. Gunakan fork dan branch atau worktree terpisah. Jangan berbagi working tree yang sama dengan proses AI lain. Penguncian sosial melalui issue/assignee bukan sandbox atau jaminan lock.
3. Buat `.changes/<tanggal>-<scope>-<acak>.json` melalui `npm run change:new`. Catat tujuan, validasi aktual, dan keterbatasan. Nama unik menghindari konflik file changelog pusat.
4. Kerjakan hanya path dari `npm run ai:route`. Perubahan modul biasa memakai status/tes/evidence modul itu. Jangan memformat game lain.
5. Jalankan tes relevan, batas arsitektur, scope dan build. Perubahan platform/kontrak perlu tes regresi seluruh game; perubahan game tetap menjalani pemeriksaan CI umum.
6. Commit `type(scope): ringkasan` dengan `npm run commit`; scope ID game ditemukan dari manifest. Push dan buka PR hanya bila diotorisasi pengguna/kontributor. PR menyebut issue, scope, path, bukti dan risiko.
7. Jangan menggabungkan update branch lewat force push tanpa koordinasi. Konflik diselesaikan dengan mempertahankan perubahan kedua pihak, bukan memilih seluruh salah satu versi.

Perubahan lintas modul hanya untuk migrasi yang memang diotorisasi, scope `architecture`, alasan dan `ownerReviewRequired:true`. Flag tersebut **tidak memberi persetujuan**; pemelihara tetap meninjau. Perubahan checker, kontrak, workflow dan CODEOWNERS adalah infrastruktur berisiko lebih luas dan memerlukan tinjauan pemilik.

Aktifkan hook lokal secara eksplisit dengan `npm run hooks:install`. Hook dapat dilewati dan bukan satu-satunya kontrol. Pemilik repo perlu mengaktifkan ruleset/branch protection, required checks dan Code Owners seperti [ENFORCEMENT](ENFORCEMENT.md). Dokumentasi repo tidak mengubah pengaturan GitHub otomatis.
