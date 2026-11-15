import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {dirname} from 'node:path';
/** Hanya ID favorit, tanpa credential/jawaban/snapshot sesi. Penulisan diserialkan dan atomik. */
export async function favoriteStore(file:string|null,validIds:Set<string>){
 let favorites:string[]=[];
 if(file)try{const value=JSON.parse(await readFile(file,'utf8'));if(value.schemaVersion===1&&Array.isArray(value.favorites))favorites=[...new Set<string>(value.favorites.filter((id:unknown)=>typeof id==='string'&&validIds.has(id)))];}catch{}
 let pending=Promise.resolve();
 return {favorites,save(ids:string[]){const snapshot=JSON.stringify({schemaVersion:1,favorites:ids.filter(id=>validIds.has(id))});if(file)pending=pending.catch(()=>{}).then(async()=>{await mkdir(dirname(file),{recursive:true});await writeFile(file+'.tmp',snapshot+'\n',{mode:0o600});await rename(file+'.tmp',file);});return pending;},flush:()=>pending.catch(()=>{})};
}
