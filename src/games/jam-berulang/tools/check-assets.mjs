import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const inventory=JSON.parse(await readFile(new URL('evidence/visual-assets.json',root),'utf8'));
for(const item of inventory){
 const data=await readFile(new URL('assets/'+item.file,root));
 assert.equal(createHash('sha256').update(data).digest('hex'),item.sha256,item.file);
 assert.equal(data.length,item.bytes,item.file);
 if(item.file.endsWith('.gltf')){
  const gltf=JSON.parse(data);
  for(const key of ['images','buffers'])for(const part of gltf[key]||[])assert.ok(part.uri?.startsWith('data:')||part.bufferView!==undefined,`${item.file}: dependensi harus lokal/embedded`);
 }
}
assert.match(await readFile(new URL('assets/LICENSE-KayKit.txt',root),'utf8'),/CC0/);
console.log(`PASS: ${inventory.length} aset, checksum dan dependensi glTF embedded.`);
