import { build } from 'esbuild';
import { mkdir, cp } from 'node:fs/promises';
await mkdir('dist/public',{recursive:true});
await build({entryPoints:['src/server.ts'],bundle:true,platform:'node',target:'node20',format:'esm',outfile:'dist/server.mjs',banner:{js:"import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);"}});
await build({entryPoints:['src/app.ts'],bundle:true,platform:'browser',target:['chrome100','safari15'],format:'esm',outfile:'dist/public/app.js'});
for(const file of ['index.html','style.css','favicon.svg'])await cp('public/'+file,'dist/public/'+file);
await cp('public/assets','dist/public/assets',{recursive:true});
console.log('Build offline siap di dist/. Tidak memerlukan node_modules saat runtime.');
