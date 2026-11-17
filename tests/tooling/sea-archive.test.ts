import test from 'node:test';
import assert from 'node:assert/strict';
import {MAGIC,packArchive,parseArchive} from '../../scripts/sea/archive.mjs';

const files=()=>[
 {path:'public/index.html',data:Buffer.from('<h1>Main Bareng</h1>')},
 {path:'public/games/derek-angkasa/client.js',data:Buffer.from('export default {}')},
 {path:'LICENSE',data:Buffer.from('MIT')},
];

test('arsip SEA deterministik, menyimpan offset benar dan dapat dibaca kembali',()=>{
 const first=packArchive(files(),'0.1.0-beta.3'),second=packArchive(files(),'0.1.0-beta.3');
 assert.equal(first.archive.toString('utf8',0,8),MAGIC);
 assert.equal(first.buildId,second.buildId);
 assert.equal(first.buildId.length,16);
 const {manifest,payloadStart}=parseArchive(first.archive);
 assert.equal(manifest.version,'0.1.0-beta.3');
 assert.deepEqual(manifest.files.map(file=>file.path),['LICENSE','public/games/derek-angkasa/client.js','public/index.html']);
 for(const file of manifest.files)assert.equal(first.archive.subarray(payloadStart+file.offset,payloadStart+file.offset+file.size).toString('utf8'),files().find(source=>source.path===file.path)!.data.toString('utf8'));
});

test('arsip SEA menolak magic, offset dan duplikat yang tidak sah',()=>{
 const {archive,manifest}=packArchive(files(),'1');
 const broken=Buffer.from(archive);broken.write('BROKEN!!',0,'utf8');
 assert.throws(()=>parseArchive(broken),/tidak dikenal/);
 const outOfBounds=JSON.parse(JSON.stringify(manifest));outOfBounds.files[0].size=archive.length;
 const manifestData=Buffer.from(JSON.stringify(outOfBounds)),header=Buffer.alloc(12);header.write(MAGIC,0,'utf8');header.writeUInt32LE(manifestData.length,8);
 assert.throws(()=>parseArchive(Buffer.concat([header,manifestData])),/di luar batas/);
 const duplicate={...manifest,files:[manifest.files[0],manifest.files[0]]},duplicateData=Buffer.from(JSON.stringify(duplicate)),duplicateHeader=Buffer.alloc(12);duplicateHeader.write(MAGIC,0,'utf8');duplicateHeader.writeUInt32LE(duplicateData.length,8);
 assert.throws(()=>parseArchive(Buffer.concat([duplicateHeader,duplicateData,archive.subarray(parseArchive(archive).payloadStart)])),/duplikat/);
});

test('buildId berubah bila isi aset berubah',()=>{
 const a=packArchive(files(),'1').buildId;
 const changed=files();changed[0].data=Buffer.from('<h1>Berubah</h1>');
 assert.notEqual(a,packArchive(changed,'1').buildId);
});
