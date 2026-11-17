/**
 * Entry untuk paket Windows satu-file (Node SEA).
 * Blob SEA berisi arsip `app.bundle`; entry mengekstraknya ke folder data pengguna,
 * lalu menjalankan server LAN yang sama dengan build biasa dan membuka browser.
 */
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {homedir,tmpdir} from 'node:os';
import {dirname,join,sep} from 'node:path';
import {getAsset,isSea} from 'node:sea';
import {startServer,lanAddresses} from '../../src/platform/server.ts';
import {ASSET,parseArchive as parseArchiveBytes} from '../../scripts/sea/archive.mjs';

const arg=(name:string)=>{
 const index=process.argv.indexOf('--'+name);
 if(index<0)return undefined;
 const value=process.argv[index+1];
 return value&&!value.startsWith('--')?value:'1';
};
const flag=(name:string)=>process.argv.includes('--'+name);
const noOpen=flag('no-open')||process.env.MAIN_BARENG_NO_OPEN==='1';

function defaultDataBase(){
 if(process.platform==='win32')return process.env.LOCALAPPDATA||join(homedir(),'AppData','Local');
 return process.env.XDG_DATA_HOME||join(homedir(),'.local','share');
}
function safeRelative(path:string){
 if(!path||path.startsWith('/')||path.includes('\\')||path.includes('\0')||path.split('/').some(part=>part===''||part==='.'||part==='..'))throw Error('Path aset tidak aman: '+path);
 if(/^[A-Za-z]:/.test(path))throw Error('Path absolut tidak diizinkan: '+path);
 return path.split('/').join(sep);
}
function parseArchive(){
 if(!isSea())throw Error('Entry ini hanya dapat dijalankan dari paket SEA.');
 const archive=Buffer.from(getAsset(ASSET));
 const {manifest,payloadStart}=parseArchiveBytes(archive);
 return {manifest,archive,payloadStart};
}
function extractTo(base:string){
 const {manifest,archive,payloadStart}=parseArchive();
 const dataRoot=join(base,'MainBareng'),root=join(dataRoot,'app',manifest.buildId),publicDir=join(root,'public'),marker=join(root,'.ready');
 if(existsSync(marker)&&existsSync(join(publicDir,'index.html'))&&readFileSync(marker,'utf8').trim()===manifest.buildId)return {publicDir,dataRoot};
 mkdirSync(root,{recursive:true});
 for(const file of manifest.files){
  const target=join(publicDir,safeRelative(file.path));
  mkdirSync(dirname(target),{recursive:true});
  if(existsSync(target)&&statSync(target).size===file.size)continue;
  writeFileSync(target,archive.subarray(payloadStart+file.offset,payloadStart+file.offset+file.size));
 }
 writeFileSync(marker,manifest.buildId+'\n');
 return {publicDir,dataRoot};
}
function extract(base:string){
 try{return extractTo(base);}
 catch(error){
  if(process.env.MAIN_BARENG_DEBUG==='1')console.error('Ekstraksi ke folder data gagal, memakai folder sementara:',error);
  return extractTo(tmpdir());
 }
}
function openConsole(url:string){
 if(noOpen)return;
 try{
  const [command,args]:[string,string[]]=process.platform==='win32'?['cmd.exe',['/c','start','',url]]:process.platform==='darwin'?['open',[url]]:['xdg-open',[url]];
  spawn(command,args,{detached:true,stdio:'ignore',windowsHide:false}).unref();
 }catch{}
}
async function listen(){
 const host=arg('host')||'';
 const requested=Number(arg('port')||0);
 const base=arg('data-dir')||defaultDataBase();
 const extracted=extract(base);
 const libraryFile=join(extracted.dataRoot,'library.json');
 const lan=lanAddresses();
 const chosenHost=host||lan[0]?.address||'127.0.0.1';
 const ports=requested?[requested]:Array.from({length:12},(_,i)=>3210+i*2);
 let lastError:any;
 for(const port of ports){
  try{
   const app=await startServer({host:chosenHost,port,operatorPort:port+1,publicDir:extracted.publicDir,libraryFile});
   return {app,chosenHost};
  }catch(error:any){
   lastError=error;
   if(!/EADDRINUSE|EACCES|address already in use/i.test(String(error?.message||error)))throw error;
  }
 }
 throw lastError||Error('Tidak ada port kosong untuk Main Bareng.');
}
async function main(){
 const {app,chosenHost}=await listen();
 const lan=lanAddresses().some(address=>address.address===chosenHost);
 console.log('');
 console.log('  MAIN BARENG - Derek Angkasa dan kawan-kawan');
 console.log('  ------------------------------------------------');
 console.log('  Layar laptop : '+app.local+'/console');
 console.log('  TV mirror    : '+app.tv);
 console.log('  Controller   : '+app.base+'/join');
 console.log('');
 console.log(lan?'  Scan QR di layar laptop dengan kamera HP.':'  Tidak ada alamat Wi-Fi terdeteksi; HP tidak dapat bergabung. Sambungkan laptop ke Wi-Fi.');
 console.log('  Kedua HP dan laptop harus berada di Wi-Fi yang sama.');
 console.log('  Tutup jendela ini atau tekan Ctrl+C untuk menghentikan server.');
 console.log('');
 openConsole(app.local+'/console');
 const close=async()=>{try{await app.close();}finally{process.exit(0);}};
 process.once('SIGINT',close);process.once('SIGTERM',close);
 process.once('SIGHUP',close);
}
main().catch(error=>{
 console.error('');
 console.error('Gagal menjalankan Main Bareng:',error?.message||error);
 console.error('Jika port dipakai, jalankan dengan --port 3220 atau tutup instance lain.');
 process.exitCode=1;
});
