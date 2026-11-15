import type {GameManifest} from './game-contracts.ts';
export const LIBRARY_COLUMNS=4,LIBRARY_PAGE_SIZE=8;
export interface LibraryState {favorites:string[];filter:'all'|'favorites';query:string;sort:'featured'|'title'}
export const emptyLibrary=():LibraryState=>({favorites:[],filter:'all',query:'',sort:'featured'});
const normalized=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('id');
export function libraryGames(catalog:GameManifest[],library:LibraryState){
 const query=normalized(library.query).trim(),favorites=new Set(library.favorites);
 const games=catalog.filter(g=>(library.filter!=='favorites'||favorites.has(g.id))&&(!query||normalized(`${g.title} ${g.tag} ${g.menu.genre}`).includes(query)));
 return library.sort==='title'?games.sort((a,b)=>a.title.localeCompare(b.title,'id')||a.id.localeCompare(b.id)):games;
}
export function libraryPage(catalog:GameManifest[],library:LibraryState,selected:string){
 const games=libraryGames(catalog,library),index=Math.max(0,games.findIndex(g=>g.id===selected)),page=Math.floor(index/LIBRARY_PAGE_SIZE);
 return {games,index,page,pages:Math.ceil(games.length/LIBRARY_PAGE_SIZE),visible:games.slice(page*LIBRARY_PAGE_SIZE,(page+1)*LIBRARY_PAGE_SIZE)};
}
export function libraryMove(catalog:GameManifest[],library:LibraryState,selected:string,direction:string){
 const {games,index}=libraryPage(catalog,library,selected);if(!games.length)return selected;
 let next=index;
 if(direction==='left'||direction==='right')next=(index+(direction==='left'?-1:1)+games.length)%games.length;
 else if(direction==='up'||direction==='down'){const rows=Math.ceil(games.length/LIBRARY_COLUMNS),row=Math.floor(index/LIBRARY_COLUMNS),column=index%LIBRARY_COLUMNS;next=((row+(direction==='up'?-1:1)+rows)%rows)*LIBRARY_COLUMNS+column;if(next>=games.length)next=column;}
 else if(direction==='previous'||direction==='next'){const page=Math.floor(index/LIBRARY_PAGE_SIZE),pages=Math.ceil(games.length/LIBRARY_PAGE_SIZE);next=((page+(direction==='previous'?-1:1)+pages)%pages)*LIBRARY_PAGE_SIZE;}
 return games[next]?.id||selected;
}
