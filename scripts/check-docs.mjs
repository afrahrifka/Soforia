import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {discoverGames} from './generate-games.mjs';
const root=process.cwd(),games=await discoverGames(root);
const files=['docs/23-arsitektur-modul-dan-kolaborasi.md','README.md','AGENTS.md','CONTRIBUTING.md','collaboration_guide.md','CLAUDE.md','GEMINI.md',...(await readdir('docs/architecture')).filter(f=>f.endsWith('.md')).map(f=>'docs/architecture/'+f),...(await readdir('docs/i18n')).filter(f=>f.endsWith('.md')).map(f=>'docs/i18n/'+f),...['dashboard','platform','shared',...games.map(g=>'games/'+g.id)].flatMap(p=>['AGENTS.md','README.md'].map(f=>'src/'+p+'/'+f))];
const errors=[];
for(const file of files){const content=await readFile(file,'utf8');for(const match of content.matchAll(/\]\(([^)]+)\)/g)){const target=match[1].split('#')[0];if(!target||/^(https?:|mailto:|plugin:|app:)/.test(target)||target.includes('<'))continue;try{await stat(resolve(dirname(resolve(root,file)),decodeURIComponent(target)));}catch{errors.push(`${file}: tautan tidak ditemukan ${target}`);}}}
for(const file of ['CLAUDE.md','GEMINI.md','.github/copilot-instructions.md','.cursor/rules/00-repo-scope.mdc','.windsurfrules','.clinerules/00-repo-scope.md','.roo/rules/00-repo-scope.md','.continue/rules/repo-scope.md']){const content=await readFile(file,'utf8');if(!content.includes('AGENTS.md')||!content.includes('AI-START.md'))errors.push(`${file}: pintu masuk kanonis wajib dicantumkan`);}
for(const game of games)for(const name of ['AGENTS.md','README.md','STATUS.md'])if(!(await readFile(`src/games/${game.id}/${name}`,'utf8')).includes(game.id))errors.push(`${game.id}/${name}: identitas scope tidak ditemukan`);
if(errors.length)throw Error(errors.join('\n'));console.log(`Dokumentasi lulus: ${files.length} dokumen, ${games.length} scope game dan 8 adapter AI.`);
