// Scope game ditemukan dari manifest; penambahan game tidak mengedit daftar pusat.
const fs=require('node:fs'),path=require('node:path');
const config={
  "prompt": {
    "messages": {
      "type": "Pilih jenis perubahan:",
      "scope": "Pilih scope modul perubahan:",
      "customScope": "Masukkan cakupan:",
      "subject": "Tulis ringkasan singkat perubahan:\n",
      "body": "Jelaskan perubahan lebih lanjut (opsional; gunakan | untuk baris baru):\n",
      "markBreaking": "Apakah perubahan ini tidak kompatibel dengan versi sebelumnya?",
      "breaking": "Jelaskan perubahan yang tidak kompatibel:\n",
      "footerPrefixesSelect": "Pilih hubungan dengan issue (opsional):",
      "customFooterPrefix": "Masukkan awalan issue:",
      "footer": "Masukkan nomor issue, misalnya #123:\n",
      "confirmCommit": "Gunakan pesan commit ini?"
    },
    "types": [
      {
        "value": "feat",
        "name": "feat: Fitur baru"
      },
      {
        "value": "fix",
        "name": "fix: Perbaikan masalah"
      },
      {
        "value": "docs",
        "name": "docs: Dokumentasi"
      },
      {
        "value": "style",
        "name": "style: Format atau gaya kode"
      },
      {
        "value": "refactor",
        "name": "refactor: Perapian kode"
      },
      {
        "value": "test",
        "name": "test: Pengujian"
      },
      {
        "value": "chore",
        "name": "chore: Pemeliharaan"
      },
      {
        "value": "perf",
        "name": "perf: Performa"
      },
      {
        "value": "deps",
        "name": "deps: Dependensi"
      },
      {
        "value": "security",
        "name": "security: Keamanan"
      },
      {
        "value": "remove",
        "name": "remove: Penghapusan"
      },
      {
        "value": "comments",
        "name": "comments: Komentar kode"
      },
      {
        "value": "error",
        "name": "error: Penanganan kesalahan"
      },
      {
        "value": "ux",
        "name": "ux: Pengalaman pengguna"
      },
      {
        "value": "config",
        "name": "config: Konfigurasi"
      },
      {
        "value": "files",
        "name": "files: Berkas"
      },
      {
        "value": "merge",
        "name": "merge: Penggabungan"
      },
      {
        "value": "revert",
        "name": "revert: Pembatalan perubahan"
      },
      {
        "value": "init",
        "name": "init: Inisialisasi"
      }
    ],
    "scopes": [],
    "allowCustomScopes": false,
    "useEmoji": false
  }
};
const directory=path.join(__dirname,'src/games');
const games=fs.readdirSync(directory,{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>JSON.parse(fs.readFileSync(path.join(directory,e.name,'manifest.json'),'utf8')).id);
const infrastructure=['architecture','platform','dashboard','docs','tooling','assets'];
config.prompt.scopes=[...new Set([...infrastructure,...games])].sort().map(name=>({name,description:games.includes(name)?'Modul game '+name:'Cakupan '+name}));
config.rules={'type-enum':[2,'always',config.prompt.types.map(t=>t.value)],'scope-enum':[2,'always',config.prompt.scopes.map(s=>s.name)],'scope-empty':[2,'never'],'subject-empty':[2,'never']};
module.exports=config;
