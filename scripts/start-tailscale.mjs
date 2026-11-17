import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {access,mkdir,readFile,readlink,writeFile,rm} from 'node:fs/promises';
import net from 'node:net';
const exec=promisify(execFile),root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export function planTailscale(status,serve,args=[]){
 const options={port:3210,operatorPort:3211,httpsPort:12443},names={'--port':'port','--operator-port':'operatorPort','--https-port':'httpsPort'};
 for(let i=0;i<args.length;i++){const name=names[args[i]],value=args[++i];if(!name||!/^\d+$/.test(value??''))throw Error('Gunakan --port, --operator-port atau --https-port diikuti angka.');options[name]=Number(value);}
 for(const port of Object.values(options))if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Port harus 1024–65535.');
 if(new Set(Object.values(options)).size!==3)throw Error('Port backend, operator dan HTTPS harus berbeda.');
 if(status.BackendState!=='Running'||status.Self?.Online===false)throw Error('Tailscale belum terhubung. Aktifkan/login Tailscale dahulu.');
 const dns=status.Self?.DNSName?.replace(/\.$/,'');if(!dns||!/^[-a-z0-9.]+\.ts\.net$/i.test(dns))throw Error('MagicDNS .ts.net belum tersedia.');
 const suffix=`:${options.httpsPort}`;
 // Jangan menimpa handler maupun TCP/Funnel milik proyek lain, termasuk pada port yang sama.
 const occupied=config=>!!config.TCP?.[options.httpsPort]||Object.keys(config.Web??{}).some(host=>host.endsWith(suffix))||Object.values(config.Foreground??{}).some(occupied)||Object.values(config.Services??{}).some(occupied);
 if(occupied(serve))throw Error(`Port HTTPS ${options.httpsPort} sudah dipakai Tailscale Serve. Pilih --https-port lain; konfigurasi lama tidak diubah.`);
 return {...options,base:`https://${dns}:${options.httpsPort}`,target:`http://127.0.0.1:${options.port}`};
}
async function free(port){const server=net.createServer();await new Promise((ok,no)=>{server.once('error',()=>no(Error(`Port ${port} sedang dipakai. Pilih --port/--operator-port lain.`)));server.listen(port,'127.0.0.1',()=>server.close(ok));});}
export async function waitForChild(child){
 if(child.exitCode!==null||child.signalCode!==null)return;
 await new Promise(done=>{
  const timer=setTimeout(()=>{child.kill('SIGKILL');done();},3000);
  child.once('exit',()=>{clearTimeout(timer);done();});
 });
}
const sessionFile=resolve(root,'.runtime/tailscale-session.json');
async function runningSession(){try{return JSON.parse(await readFile(sessionFile,'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}}
export async function stopRunning(){
 const session=await runningSession();if(!session){console.log('Tidak ada sesi Tailscale Soforia yang dicatat.');return;}
 if(!Number.isSafeInteger(session.pid)||session.pid<2)throw Error('Metadata PID Soforia tidak valid.');
 try{process.kill(session.pid,0);}catch(error){if(error.code==='ESRCH'){await rm(sessionFile);console.log('Sesi Soforia sudah berhenti.');return;}throw error;}
 // Stop tidak boleh mengenai PID yang didaur ulang untuk aplikasi lain.
 const cwd=await readlink(`/proc/${session.pid}/cwd`),argv=(await readFile(`/proc/${session.pid}/cmdline`,'utf8')).split('\0');
 if(cwd!==root||!argv.some(arg=>arg===fileURLToPath(import.meta.url)||arg==='scripts/start-tailscale.mjs'))throw Error('PID bukan launcher Tailscale folder ini; proses tidak dihentikan.');
 process.kill(session.pid,'SIGTERM');
 for(let attempt=0;attempt<100;attempt++){
  let exited=false;try{process.kill(session.pid,0);}catch(error){if(error.code==='ESRCH')exited=true;else throw error;}
  if(exited&&(await runningSession())?.pid===session.pid)await rm(sessionFile);
  if((await runningSession())?.pid!==session.pid){console.log('Sesi Tailscale Soforia dihentikan; konfigurasi proyek lain tetap utuh.');return;}
  await new Promise(done=>setTimeout(done,50));
 }
 throw Error('Launcher belum selesai berhenti. Jangan menyalakan sesi baru sebelum proses lama selesai.');
}
export async function main(args=process.argv.slice(2)){
 if(args.length===1&&args[0]==='--stop')return stopRunning();
 const existing=await runningSession();if(existing){let alive=true;try{process.kill(existing.pid,0);}catch(error){if(error.code==='ESRCH')alive=false;else throw error;}if(alive)throw Error('Sesi Tailscale Soforia sudah aktif. Gunakan link yang sama atau npm run stop:tailscale dahulu.');await rm(sessionFile);}

 await access(resolve(root,'dist/server.mjs')).catch(()=>{throw Error('Build belum ada. Jalankan npm run build dahulu.');});
 const read=async params=>JSON.parse((await exec('tailscale',params,{timeout:10000,maxBuffer:1024*1024})).stdout);
 const plan=planTailscale(await read(['status','--json']),await read(['serve','status','--json']),args);
 await free(plan.port);await free(plan.operatorPort);
 await mkdir(resolve(root,'.runtime'),{recursive:true});await writeFile(sessionFile,JSON.stringify({pid:process.pid,base:plan.base,port:plan.port,operatorPort:plan.operatorPort,httpsPort:plan.httpsPort})+'\n',{flag:'wx',mode:0o600});
 const server=spawn(process.execPath,[resolve(root,'dist/server.mjs'),'--network-mode','tailscale','--host','127.0.0.1','--port',String(plan.port),'--operator-port',String(plan.operatorPort),'--public-origin',plan.base],{cwd:root,stdio:['ignore','inherit','inherit']});
 let proxy,stopping=false;const children=[server];
 const stop=()=>{if(stopping)return;stopping=true;for(const child of children)if(child.exitCode===null&&child.signalCode===null)child.kill('SIGTERM');};
 const signals=['SIGINT','SIGTERM'];for(const signal of signals)process.once(signal,stop);
 try{
  let ready=false;for(let attempt=0;attempt<80&&!stopping;attempt++){
   if(server.exitCode!==null)throw Error('Server Soforia berhenti sebelum siap.');
   try{const info=await (await fetch(`${plan.target}/api/info`,{signal:AbortSignal.timeout(500)})).json();ready=info.mode==='tailscale'&&info.base===plan.base;}catch{}
   if(ready)break;await new Promise(r=>setTimeout(r,100));
  }
  if(!ready)throw Error('Backend Soforia tidak siap.');
  proxy=spawn('tailscale',['serve','--yes',`--https=${plan.httpsPort}`,plan.target],{cwd:root,stdio:['ignore','inherit','inherit']});children.push(proxy);
  console.log(`\nTV bersama: ${plan.base}/tv\nController: ${plan.base}/join\nCtrl+C menghentikan sesi Tailscale ini. Handler proyek lain tetap utuh.\n`);
  await new Promise((done,no)=>{for(const child of children){child.once('error',no);child.once('exit',(code,signal)=>{if(!stopping&&code!==0)no(Error(`Proses Soforia/Tailscale berhenti (${signal||code}).`));else done();});}});
 }finally{stop();await Promise.all(children.map(waitForChild));for(const signal of signals)process.removeListener(signal,stop);if((await runningSession())?.pid===process.pid)await rm(sessionFile);}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(`Mode Tailscale gagal: ${error.message}`);process.exitCode=1;});
