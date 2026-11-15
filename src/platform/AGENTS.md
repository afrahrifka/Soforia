# Scope platform

Host, transport, protokol, renderer/resource dan shell UI umum saja. Jangan mengimpor modul game secara langsung; gunakan registry generated dan kontrak shared. Tidak boleh menambah switch/ID game khusus di host. Perubahan aturan/console satu game berada di game itu, bukan di sini. Perubahan API bersama harus mempertahankan kontrak dan menjalani seluruh tes/regresi browser. Jangan mengubah jaringan/systemd/deployment lain.
