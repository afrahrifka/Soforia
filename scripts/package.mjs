import { mkdir,cp,readFile,writeFile,readdir,rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const withRuntime=process.argv.includes('--with-runtime');
const version=JSON.parse(await readFile('package.json','utf8')).version,platform=process.platform,arch=process.arch;
if(withRuntime&&(platform!=='linux'||arch!=='x64'))throw Error('Paket runtime pertama khusus Linux x64; source tetap dapat dibuild pada host lain.');
const name=`main-bareng-${version}-${withRuntime?'linux-x64-offline':'node-required'}`,stage=join('artifacts',name);
await rm(stage,{recursive:true,force:true});await mkdir(stage,{recursive:true});await cp('dist',join(stage,'dist'),{recursive:true});
for(const file of ['start.sh','play.sh','stop.sh','deploy-local.sh','open-console.sh','LICENSE','README.md','RUN-OFFLINE.md','SPEC.md','AGENTS.md','package.json','package-lock.json','tsconfig.json','repo-policy.json','.commitlintrc.cjs','.czrc','collaboration_guide.md','CONTRIBUTING.md','CLAUDE.md','GEMINI.md','.windsurfrules','.aider.conf.yml'])await cp(file,join(stage,file));
for(const dir of ['src','public','scripts','tests','docs','specs','.changes','.github','.githooks','.cursor','.clinerules','.roo','.continue'])await cp(dir,join(stage,dir),{recursive:true});
const dependencyTree=JSON.parse(execFileSync('npm',['ls','--omit=dev','--all','--json'],{encoding:'utf8'}));const names=new Set();function walk(node){for(const [name,entry] of Object.entries(node.dependencies||{})){if(entry.version)names.add(name);walk(entry);}}walk(dependencyTree);
let notices='# Bundled third-party notices\n\nMain Bareng source: MIT. Aturan, kode, audio sintetis dan aset orisinal proyek berlisensi MIT. Model pihak ketiga tercantum terpisah di bawah serta pada public/assets; lisensi model tersebut tetap CC0. Font sistem dan emoji mengikuti sistem operasi.\n\n';
notices+='## Model 3D pihak ketiga\n\n'+await readFile('public/assets/ATTRIBUTION.md','utf8')+'\n';
for(const name of [...names].sort()){
 const dir=join('node_modules',name);const pkg=JSON.parse(await readFile(join(dir,'package.json'),'utf8'));notices+=`## ${name} ${pkg.version}\n\nLicense: ${JSON.stringify(pkg.license||'see package')}\n\n`;
 const files=(await readdir(dir)).filter(f=>/^(licen[cs]e|copying|notice)(\.|$)/i.test(f));for(const f of files)notices+='```text\n'+(await readFile(join(dir,f),'utf8'))+'\n```\n\n';
}
if(withRuntime){
 const nodeVersion='v22.23.5',file=`node-${nodeVersion}-linux-x64.tar.xz`,url=`https://nodejs.org/dist/${nodeVersion}`;
 const cache=join('artifacts',file);await mkdir('artifacts',{recursive:true});let archive;
 try{archive=await readFile(cache);}catch{console.log('Mengambil runtime resmi sekali untuk menyiapkan paket offline…');const res=await fetch(`${url}/${file}`);if(!res.ok)throw Error('Unduhan runtime gagal '+res.status);archive=Buffer.from(await res.arrayBuffer());await writeFile(cache,archive);}
 const sums=await (await fetch(`${url}/SHASUMS256.txt`)).text();const expected=sums.split('\n').find(line=>line.endsWith('  '+file))?.split(/\s+/)[0],actual=createHash('sha256').update(archive).digest('hex');if(!expected||actual!==expected)throw Error('Checksum runtime resmi tidak cocok.');
 const unpack=join('artifacts','node-unpack');await rm(unpack,{recursive:true,force:true});await mkdir(unpack,{recursive:true});execFileSync('tar',['-xJf',cache,'-C',unpack]);const nodeDir=join(unpack,`node-${nodeVersion}-linux-x64`);await mkdir(join(stage,'runtime/bin'),{recursive:true});await cp(join(nodeDir,'bin/node'),join(stage,'runtime/bin/node'));await cp(join(nodeDir,'LICENSE'),join(stage,'runtime/LICENSE'));await cp(join(nodeDir,'README.md'),join(stage,'runtime/README.md'));await writeFile(join(stage,'runtime/source.json'),JSON.stringify({version:nodeVersion,url:`${url}/${file}`,sha256:actual},null,2)+'\n');notices+='## Node.js runtime '+nodeVersion+'\n\nSee runtime/LICENSE for Node.js and its bundled dependencies. Download provenance: runtime/source.json.\n';await rm(unpack,{recursive:true,force:true});
}
await writeFile(join(stage,'THIRD_PARTY_NOTICES.md'),notices);
const archive=`artifacts/${name}.tar.gz`;execFileSync('tar',['-czf',archive,'-C','artifacts',name]);const digest=createHash('sha256').update(await readFile(archive)).digest('hex');await writeFile(archive+'.sha256',`${digest}  ${name}.tar.gz\n`);console.log('Paket siap:',archive);console.log('SHA-256:',digest);
