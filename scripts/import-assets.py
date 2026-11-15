"""Impor paket CC0 menjadi pustaka glTF lokal. Tidak menyalin kode portofolio."""
import argparse, hashlib, io, json, re, shutil, zipfile, struct, posixpath
from pathlib import Path
from urllib.parse import unquote, quote
from PIL import Image

parser=argparse.ArgumentParser()
parser.add_argument('--portfolio-root',default='/home/oskhar/Github/portofolio/Web-Portfolio-3D/public/lib')
args=parser.parse_args()
root=Path(args.portfolio_root)/'asset_3d'
out=Path('public/assets');out.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
slug=lambda s:re.sub(r'[^a-zA-Z0-9_.-]+','-',s)
models=[];packs=[];file_records={}
local=[
 ('quaternius-nature','Stylized Nature MegaKit[Standard]','Quaternius','https://quaternius.com/packs/stylizednaturemegakit.html'),
 ('quaternius-city','Downtown City MegaKit[Standard]','Quaternius','https://quaternius.com/packs/downtowncitymegakit.html'),
 ('kaykit-city','KayKit_City_Builder_Bits_1.0_FREE','Kay Lousberg','https://kaylousberg.itch.io/city-builder-bits'),
 ('kaykit-resources','KayKit_ResourceBits_1.0_FREE','Kay Lousberg','https://kaylousberg.itch.io/resource-bits'),
 ('quaternius-village','Medieval Village MegaKit[Standard]','Quaternius','https://quaternius.com/packs/medievalvillagemegakit.html'),
 ('kaykit-space','KayKit_Space_Base_Bits_1.0_FREE','Kay Lousberg','https://kaylousberg.itch.io/space-base-bits')]

def save(path,data,original=None):
 path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
 file_records[path.relative_to(out).as_posix()]={'sha256':sha(data),'bytes':len(data),**({'originalSha256':sha(original)} if original is not None else {})}

for key,folder,author,url in local:
 source=root/folder;license=next(p for p in source.rglob('*') if p.is_file() and 'license' in p.name.lower())
 text=license.read_text();assert 'CC0' in text
 save(out/key/'LICENSE.txt',text.encode())
 count=0
 for model in sorted(source.rglob('*.gltf')):
  original=model.read_bytes();data=json.loads(original)
  for entry in data.get('buffers',[])+data.get('images',[]):
   uri=entry.get('uri','')
   if not uri or uri.startswith('data:'):continue
   dependency=(model.parent/unquote(uri)).resolve();assert dependency.is_relative_to(source.resolve()),dependency
   blob=dependency.read_bytes();filename=sha(blob)[:12]+'-'+slug(dependency.name);destination=out/key/'data'/filename
   if not destination.exists():
    optimized=blob
    if dependency.suffix.lower() in ['.png','.jpg','.jpeg']:
     image=Image.open(io.BytesIO(blob))
     if max(image.size)>512:
      image.thumbnail((512,512),Image.Resampling.LANCZOS);stream=io.BytesIO();image.save(stream,format='PNG' if dependency.suffix.lower()=='.png' else 'JPEG');optimized=stream.getvalue()
    save(destination,optimized,blob)
   elif destination.relative_to(out).as_posix() not in file_records:
    b=destination.read_bytes();file_records[destination.relative_to(out).as_posix()]={'sha256':sha(b),'bytes':len(b),'originalSha256':sha(blob)}
   entry['uri']='../data/'+quote(filename)
  filename=slug(model.stem)+'.gltf';payload=json.dumps(data,separators=(',',':')).encode();save(out/key/'models'/filename,payload,original)
  models.append({'id':key+'/'+model.stem,'pack':key,'name':model.stem,'url':'/assets/'+key+'/models/'+quote(filename),'sha256':sha(payload),'sourceSha256':sha(original)})
  count+=1
 packs.append({'id':key,'author':author,'source':url,'origin':'local-portfolio-CC0-package','license':'CC0-1.0','models':count,'licenseFile':key+'/LICENSE.txt'})
for key,cache,page in [('kenney-platformer','platformer','https://kenney.nl/assets/platformer-kit'),('kenney-nature','nature','https://kenney.nl/assets/nature-kit')]:
 archive=Path('artifacts/asset-downloads')/(cache+'.zip');count=0
 with zipfile.ZipFile(archive) as z:
  license=z.read('License.txt');assert b'CC0' in license;save(out/key/'LICENSE.txt',license)
  for name in sorted(z.namelist()):
   if not name.lower().endswith('.glb'):continue
   blob=z.read(name)
   chunk_length,chunk_type=struct.unpack_from('<II',blob,12);document=json.loads(blob[20:20+chunk_length])
   for item in document.get('buffers',[])+document.get('images',[]):
    uri=item.get('uri','')
    if not uri or uri.startswith('data:'):continue
    source_name=posixpath.normpath(str(Path(name).parent)+'/'+unquote(uri));assert source_name in z.namelist(),(name,uri)
    destination=out/key/'models'/unquote(uri);assert destination.resolve().is_relative_to((out/key).resolve());save(destination,z.read(source_name))
   stem=Path(name).stem;filename=slug(stem)+'.glb';save(out/key/'models'/filename,blob)
   models.append({'id':key+'/'+stem,'pack':key,'name':stem,'url':'/assets/'+key+'/models/'+quote(filename),'sha256':sha(blob),'sourceSha256':sha(blob)});count+=1
 packs.append({'id':key,'author':'Kenney','source':page,'origin':'download-official-website','archiveSha256':sha(archive.read_bytes()),'license':'CC0-1.0','models':count,'licenseFile':key+'/LICENSE.txt'})
manifest={'schema':1,'license':'Model pihak ketiga CC0-1.0; kode proyek MIT.','textureBudget':'Tekstur eksternal maksimal 512 px; source hash dan hasil transform dicatat.','packs':packs,'models':models,'files':file_records}
(out/'catalog.json').write_text(json.dumps(manifest,indent=2)+'\n')
lines=['# Inventaris aset 3D pihak ketiga','', 'Seluruh paket di bawah disertai lisensi CC0-1.0. Kode proyek tetap MIT. Model dipakai sebagai bagian scene, bukan memuat seluruh pustaka sekaligus.','', '| Paket | Pembuat | Model | Sumber |','|---|---|---:|---|']
for p in packs:lines.append(f"| {p['id']} | {p['author']} | {p['models']} | [Halaman paket]({p['source']}) |")
lines+=['',f'Total {len(models)} model. Provenance, checksum, dan modifikasi tekstur tercatat di catalog.json; teks lisensi asli ada pada tiap folder paket.','', 'Aset lokal berasal dari paket pihak ketiga berlisensi di direktori yang diizinkan pengguna. Tidak menyalin kode atau konten portofolio. Tidak mengimpor file lokal yang tidak mempunyai bukti lisensi.']
(out/'ATTRIBUTION.md').write_text('\n'.join(lines)+'\n')
print(f"Impor {len(models)} model / {len(packs)} paket; {sum(p.stat().st_size for p in out.rglob('*') if p.is_file())/1024**2:.1f} MiB.")
Path('src/asset-catalog.ts').write_text('// Dibuat oleh scripts/import-assets.py dari katalog CC0.\nexport const modelCatalog:Record<string,string> = '+json.dumps({m['id']:m['url']+'?v='+m['sha256'][:12] for m in models},indent=1)+';\n')
