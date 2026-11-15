import {games} from '../generated/client-registry.ts';
import {catalog} from '../generated/catalog.ts';
export function gameClient(id:string){const client=games[id];if(!Object.hasOwn(games,id))throw Error(`Client game tidak terdaftar: ${id}`);return client;}
export function clientManifest(id:string){const manifest=catalog.find(g=>g.id===id);if(!manifest)throw Error(`Manifest client tidak terdaftar: ${id}`);return manifest;}
export {catalog};
