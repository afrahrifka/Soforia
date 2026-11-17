/**
 * Format arsip self-contained untuk paket SEA:
 * [8 byte MAGIC][uint32 manifest length][manifest JSON][payload].
 * Tidak memakai zip/tar eksternal agar exe tidak membutuhkan tool sistem.
 */
import {createHash} from 'node:crypto';

export const MAGIC='MBSEA001',ASSET='app.bundle';

export function packArchive(files,version){
 const sorted=[...files].sort((a,b)=>a.path.localeCompare(b.path));
 const hash=createHash('sha256');hash.update('main-bareng '+version+'\n');
 for(const file of sorted){hash.update(file.path+'\0'+file.data.length+'\0');hash.update(file.data);}
 const buildId=hash.digest('hex').slice(0,16);
 let offset=0;
 const manifest={buildId,version,files:sorted.map(file=>{const entry={path:file.path,size:file.data.length,offset};offset+=file.data.length;return entry;})};
 const manifestData=Buffer.from(JSON.stringify(manifest));
 const header=Buffer.alloc(12);header.write(MAGIC,0,'utf8');header.writeUInt32LE(manifestData.length,8);
 return {archive:Buffer.concat([header,manifestData,...sorted.map(file=>file.data)]),manifest,buildId};
}

export function parseArchive(archive){
 if(!Buffer.isBuffer(archive)||archive.length<12||archive.toString('utf8',0,8)!==MAGIC)throw Error('Arsip aplikasi tidak dikenal.');
 const manifestLength=archive.readUInt32LE(8),payloadStart=12+manifestLength;
 if(manifestLength<=0||payloadStart>archive.length)throw Error('Arsip aplikasi rusak.');
 let manifest;
 try{manifest=JSON.parse(archive.toString('utf8',12,payloadStart));}catch{throw Error('Manifest aplikasi bukan JSON.');}
 if(!manifest.buildId||!manifest.version||!Array.isArray(manifest.files))throw Error('Manifest aplikasi tidak lengkap.');
 const seen=new Set();
 for(const file of manifest.files){
  if(typeof file.path!=='string'||!file.path||seen.has(file.path))throw Error('Path aset tidak valid atau duplikat.');
  seen.add(file.path);
  if(!Number.isSafeInteger(file.size)||file.size<0||!Number.isSafeInteger(file.offset)||file.offset<0||payloadStart+file.offset+file.size>archive.length)throw Error('Entri arsip di luar batas: '+file.path);
 }
 return {manifest,payloadStart};
}
