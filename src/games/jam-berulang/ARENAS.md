# Arena dan kurva tantangan Jam Berulang

Revisi 16 November 2026 mengganti enam halaman persegi yang memakai sekat hampir sama. Peta tidak diacak: ruang elips, cincin dan koridor disusun eksplisit dalam `levels.ts`. Sel kosong adalah air/ruang di luar jalan yang benar-benar tidak dapat dimasuki. Render permukaan, collision badan, gerbang, fase dan jarum memakai definisi arena yang sama.

| Arena | Bentuk dan keputusan pemain | Tambahan tuntutan |
|---|---|---|
| Pelabuhan Jarum — 21×15 | Cincin dermaga mengelilingi lubang, roda pada tiga ujung; dapat memilih arah keliling | Eksplorasi dan mengenali pinggir jalan, tanpa gerbang |
| Kepulauan Gema — 23×17 | Dua pulau barat menghubungkan satu pulau timur lewat leher sempit | Rekam pelat di pulau selatan, buka G dan kembali melintasi jembatan; tahan 0,6 dtk |
| Akuaduk Patah — 25×19 | Lima ruang di sepanjang tapal kuda; posisi awal dan tujuan terpisah sungai | G 10–34 dtk, tahan 1 dtk; jembatan pulsa terbuka 2–7 dari tiap 10 dtk |
| Planetarium Retak — 27×21 | Empat ruang dengan dua cabang orbit dan observatorium di lubang antara lintasan | G 18–38, tahan 1,5 dtk; dua sekat V dan jarum bergerak yang menghalangi badan |
| Arsip Jam Pasir — 25×23 | Dua ruang atas dan ruang bawah, leher berbelok; urutan kunci dibalik | Q/H dahulu, baru P/G; dua fase yang berlawanan dan jarum ruang bawah |
| Mahkota Paradoks — 29×25 | Spiral empat pulau mengitari menara pusat; tiga batas wilayah | P/G, Q/H, R/I; tiga jejak, tahan sampai 2,5 dtk, tiga jendela, dua jarum dan dua jenis fase |

Muatan pelat bertambah hanya ketika Pelari atau gema aktif berada di pelat. Pratinjau timeline tidak menekan pelat. Muatan habis saat keduanya meninggalkan pelat. Gerbang yang telah diseberangi tetap terkait permanen; roda tetap tersimpan lintas loop. Keputusan ini menjaga jalan pulang dan mencegah kehilangan progres karena mengganti arsip.

Sekat fase menolak **masuk**, tetapi tidak mengurung badan yang sudah berada di sel ketika fase berubah. Jarum memblokir gerak tanpa menghapus inventaris atau memecahkan rekaman. Menunggu satu siklus selalu memungkinkan lanjut. Tidak ada kematian acak atau aturan sudut tersembunyi.

Kesulitan meningkat melalui struktur rute, urutan akses, jumlah rekaman, waktu menahan dan kombinasi sistem, bukan sekadar mempercepat jam. Durasi solver yang mengetahui semua jawaban bukan ukuran kesulitan manusia. Teka-teki akhir belum dinyatakan seimbang atau menyenangkan sebelum playtest pasangan.

Validasi yang dipertahankan: seluruh perjalanan kampanye melalui input/aksi; gerbang tidak dapat dipintas; pelat berikutnya dapat dicapai setelah kunci sebelumnya; sekat menahan badan dan tetap bisa ditinggalkan; posisi/collider jarum deterministik; replay, reconnect dan privasi peran tetap diuji. Screenshot enam arena dan controller berada pada `evidence/`. Video review lama di `~/Videos` adalah riwayat desain sebelum revisi ini, bukan bukti arena baru.

Sasaran medali mode tantangan adalah maksimum dari tiga loop atau jumlah kunci + satu. Final dengan tiga rekaman memerlukan minimum empat loop, sehingga solusi optimal tidak otomatis terkena overtime. Mode lain memakai maksimum empat loop atau minimum struktural tersebut; santai tetap tanpa medali/deadline.
