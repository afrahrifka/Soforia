import test from 'node:test';import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';import {once} from 'node:events';
import {planTailscale,waitForChild} from '../../scripts/start-tailscale.mjs';
const status={BackendState:'Running',Self:{Online:true,DNSName:'soforia.example.ts.net.'}};
test('Tailscale: rencana dedicated HTTPS mempertahankan port proyek lain',()=>{const serve={TCP:{443:{HTTPS:true},8443:{HTTPS:true}},Web:{'soforia.example.ts.net:443':{Handlers:{'/':{Proxy:'http://127.0.0.1:18080'}}}}},before=JSON.stringify(serve),plan=planTailscale(status,serve);assert.equal(plan.base,'https://soforia.example.ts.net:12443');assert.equal(plan.target,'http://127.0.0.1:3210');assert.equal(JSON.stringify(serve),before);assert.throws(()=>planTailscale(status,serve,['--https-port','443']),/sudah dipakai|1024/);});
test('Tailscale: menolak collision, konfigurasi ambigu dan status offline',()=>{assert.throws(()=>planTailscale(status,{TCP:{12443:{HTTPS:true}}}),/sudah dipakai/);assert.throws(()=>planTailscale({...status,BackendState:'Stopped'},{}),/belum terhubung/);assert.throws(()=>planTailscale({BackendState:'Running',Self:{DNSName:'evil.invalid'}},{}),/MagicDNS/);for(const args of [['--port','no'],['--https-port','3210'],['--host','0.0.0.0'],['--port','70000']])assert.throws(()=>planTailscale(status,{},args));const p=planTailscale(status,{},['--port','3220','--operator-port','3221','--https-port','13443']);assert.equal(p.httpsPort,13443);});

test('Tailscale: handler foreground/proyek lain juga tidak boleh ditimpa',()=>{assert.throws(()=>planTailscale(status,{Foreground:{synthetic:{TCP:{12443:{HTTPS:true}}}}}),/sudah dipakai/);assert.throws(()=>planTailscale(status,{Foreground:{synthetic:{Web:{'other.example.ts.net:12443':{Handlers:{'/':{Proxy:'http://127.0.0.1:9000'}}}}}}}),/sudah dipakai/);});

test('Tailscale: cleanup mengenali proses yang sudah berhenti melalui SIGTERM', {timeout:2000},async()=>{
 const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});
 await once(child,'spawn');const exited=once(child,'exit');child.kill('SIGTERM');await exited;
 assert.equal(child.exitCode,null);assert.equal(child.signalCode,'SIGTERM');await waitForChild(child);
});
