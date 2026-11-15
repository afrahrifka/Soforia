"""Verifikasi checksum, lisensi, dan referensi model sebelum distribusi."""
from pathlib import Path
from urllib.parse import unquote,urlsplit
import hashlib,json,struct
root=Path('public/assets').resolve();catalog=json.loads((root/'catalog.json').read_text())
assert len({m['id'] for m in catalog['models']})==len(catalog['models'])
for pack in catalog['packs']:
 text=(root/pack['licenseFile']).read_text();assert 'CC0' in text,pack['id']
for name,record in catalog['files'].items():
 path=(root/name).resolve();assert path.is_relative_to(root);data=path.read_bytes();assert hashlib.sha256(data).hexdigest()==record['sha256'],name;assert len(data)==record['bytes'],name
for model in catalog['models']:
 path=root/unquote(urlsplit(model['url']).path.removeprefix('/assets/'));data=path.read_bytes();assert hashlib.sha256(data).hexdigest()==model['sha256'],model['id']
 if path.suffix=='.gltf':document=json.loads(data)
 else:
  magic,version,length=struct.unpack_from('<III',data);assert magic==0x46546c67 and version==2 and length==len(data)
  chunk_length,chunk_type=struct.unpack_from('<II',data,12);assert chunk_type==0x4e4f534a
  document=json.loads(data[20:20+chunk_length])
 for item in document.get('buffers',[])+document.get('images',[]):
  uri=item.get('uri','')
  if not uri or uri.startswith('data:'):continue
  assert not urlsplit(uri).scheme,model['id'];dependency=(path.parent/unquote(uri)).resolve();assert dependency.is_relative_to(root) and dependency.is_file(),(model['id'],uri)
print(f"PASS: {len(catalog['models'])} model, {len(catalog['packs'])} lisensi CC0, {len(catalog['files'])} berkas dengan checksum dan referensi lokal valid.")

report={'result':'PASS','models':len(catalog['models']),'packs':len(catalog['packs']),'filesChecked':len(catalog['files']),'bytes':sum(p.stat().st_size for p in root.rglob('*') if p.is_file()),'checks':['Teks lisensi CC0 tersedia pada delapan paket','Checksum semua model/data sesuai manifest','Referensi buffer dan gambar lokal tersedia','Tidak ada URL remote pada dependensi model'],'limitation':'Validasi integritas dan referensi; tidak berarti seluruh 1053 model telah dipasang atau diperiksa visual dalam gameplay.'}
Path('artifacts').mkdir(exist_ok=True);Path('artifacts/asset-import-report.json').write_text(json.dumps(report,indent=2)+'\n')
