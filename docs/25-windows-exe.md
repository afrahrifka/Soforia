# Menjalankan Main Bareng di Windows — satu file EXE

Panduan ini menjelaskan paket Windows satu-file. Pengguna akhir **tidak perlu memasang Node.js, npm, dependency, atau aplikasi tambahan**. Cukup satu file `.exe`, lalu browser bawaan Windows (Edge/Chrome) dipakai untuk layar konsol. HP tetap menjadi controller dan bergabung lewat QR.

Ini **bukan installer**, bukan aplikasi desktop native, dan tidak menanam browser. Server dan seluruh game/aset berada di dalam EXE; tampilan tetap halaman web lokal.

## Membuat EXE

Build dilakukan sekali di mesin pengembang:

```sh
npm ci
npm run package:windows
```

Hasil:

```text
artifacts/main-bareng-0.1.0-beta.3-windows-x64.exe
artifacts/main-bareng-0.1.0-beta.3-windows-x64.exe.sha256
```

Mesin build memerlukan internet **satu kali** untuk mengambil runtime resmi Node.js Windows x64 dan memverifikasi SHA-256 dari `SHASUMS256.txt`. Setelah cache `artifacts/runtime-cache/` terisi, build berikutnya dapat memakai cache. Mesin pengguna tidak mengunduh apa pun.

EXE dibuat dengan Node.js Single Executable Application (SEA) v22.23.5. Build Linux x64 juga tersedia untuk verifikasi:

```sh
node scripts/package-windows.mjs --target linux-x64 --smoke
```

Smoke test Linux menjalankan EXE hasil build, memeriksa health, katalog, halaman konsol, client Derek Angkasa, dan ekstraksi aset.

## Cara memakai di Windows

1. Salin hanya file `.exe` ke laptop Windows. Tidak perlu folder `dist`, `node_modules`, atau Node.js.
2. Sambungkan laptop dan kedua HP ke Wi-Fi yang sama. Internet tidak diperlukan.
3. Klik dua kali EXE. Jendela konsol terbuka dan browser default membuka layar konsol.
4. Saat Windows Firewall bertanya, izinkan akses pada **jaringan privat**. Aplikasi tidak mengubah firewall secara otomatis; ini keputusan pengguna.
5. Scan QR yang tampil di layar konsol memakai kamera HP. Maksimal dua HP menjadi controller A/B.
6. Pilih **Derek Angkasa**, tekan **Main** dari controller, lalu **Siap** di kedua HP.

Terminal EXE menampilkan:

```text
Layar laptop : http://127.0.0.1:3211/console
TV mirror    : http://IP-WIFI:3210/tv
Controller   : http://IP-WIFI:3210/join
```

Jika port bawaan dipakai, EXE mencoba pasangan port berikutnya secara otomatis. Gunakan QR dari layar yang benar-benar terbuka.

## Pilihan saat menjalankan

Jalankan dari Command Prompt/PowerShell:

```bat
main-bareng-0.1.0-beta.3-windows-x64.exe --port 3220
main-bareng-0.1.0-beta.3-windows-x64.exe --host 192.168.1.20
main-bareng-0.1.0-beta.3-windows-x64.exe --no-open
```

- `--port` memilih port game; port operator otomatis `port + 1`.
- `--host` memilih alamat Wi-Fi jika laptop punya beberapa adapter.
- `--no-open` tidak membuka browser otomatis.

Tutup jendela konsol atau tekan `Ctrl+C` untuk menghentikan server. Tidak ada autostart, service, atau perubahan systemd/Tailscale/firewall dari aplikasi.

## Data lokal dan reset

Aset diekstrak ke:

```text
%LOCALAPPDATA%\MainBareng\app\<build-id>
```

Favorit katalog disimpan di:

```text
%LOCALAPPDATA%\MainBareng\library.json
```

Menghapus folder `%LOCALAPPDATA%\MainBareng` akan menghapus cache dan favorit. EXE mengekstrak ulang aset saat dijalankan berikutnya. Tidak ada token sesi, QR, atau jawaban privat yang disimpan ke disk.

## Batas dan risiko

- **EXE belum ditandatangani.** Windows SmartScreen dapat menampilkan peringatan. Ini wajar untuk build lokal tanpa sertifikat code signing. Verifikasi SHA-256 sebelum menjalankan.
- **Build Windows dibuat dari Linux.** Struktur PE dan isi blob sudah diperiksa, dan kode yang sama lulus smoke test Linux SEA. Namun eksekusi EXE pada Windows fisik, Windows Defender, dan performa WebGL Windows **belum diuji di lingkungan build ini**. Jalankan `npm run package:windows` di Windows bila ingin build native; hasilnya tetap perlu diuji pengguna.
- Browser modern dengan WebGL tetap diperlukan (Edge/Chrome bawaan Windows umumnya cukup). Jika browser tidak terbuka otomatis, buka alamat layar laptop secara manual.
- Koneksi HP memakai HTTP LAN tanpa enkripsi. Gunakan Wi-Fi pribadi tepercaya, jangan membuka port ke internet publik.
- Jika gagal terhubung: pastikan HP memakai IP Wi-Fi laptop, bukan `localhost`; hindari guest Wi-Fi/client isolation; izinkan port game pada firewall jaringan privat.
- Ukuran EXE sekitar 140–180 MiB karena membawa runtime Node.js dan seluruh aset game. Tidak ada download saat runtime.
- Model/aset pihak ketiga tetap mengikuti lisensinya. EXE menyajikan `THIRD_PARTY_NOTICES.md` dan `LICENSE` pada alamat root server.
