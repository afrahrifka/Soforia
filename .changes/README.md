# Catatan perubahan tanpa konflik pusat

Satu PR menambah satu file JSON unik melalui `npm run change:new -- --scope <scope> --summary "..."`. Isi `validation` dengan pemeriksaan aktual. Jangan mengedit/menghapus catatan PR lain; setelah merge catatan menjadi riwayat. Scope game hanya folder game tersebut, dashboard hanya dashboard. Migrasi architecture memerlukan alasan otorisasi dan review pemelihara; flag JSON bukan persetujuan.

Untuk migrasi yang sudah diotorisasi: `npm run change:new -- --scope architecture --summary "Migrasi ..." --reason "Arahan pengguna ..."`. Isi alasan konkret; perintah menolak alasan kosong.
