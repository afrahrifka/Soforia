import {randomInt} from 'node:crypto';
import {games} from '../generated/server-registry.ts';
import {catalog} from '../generated/catalog.ts';
import {rng} from '../shared/random.ts';
export {catalog};export {rng,clamp} from '../shared/random.ts';
export function gameServer(id:string){const adapter=games[id];if(!Object.hasOwn(games,id))throw Error(`Game tidak terdaftar: ${id}`);return adapter;}
export function gameManifest(id:string){const manifest=catalog.find(g=>g.id===id);if(!manifest)throw Error(`Manifest tidak terdaftar: ${id}`);return manifest;}
export function createGame(id:string,mode='relaxed',level=1,seed=randomInt(2**30)):any {const base={id,mode,level,seed,elapsed:0,finished:false,score:0};return gameServer(id).create(base,{random:rng(seed)});}
export function gameAction(g:any,slot:number,name:string,value?:any){if(g.finished)return;gameServer(g.id).action(g,slot,name,value);}
export function tickGame(g:any,inputs:any[],dt:number){if(g.finished)return;g.elapsed+=dt;gameServer(g.id).tick(g,inputs,dt);}
export function publicGame(g:any):any{return g?gameServer(g.id).publicState(g):null;}
export function privateGame(g:any,slot:number):any{return g?gameServer(g.id).privateState(g,slot):{};}
export function result(g:any){return gameServer(g.id).result(g);}
export function neutralGame(g:any,slot?:number){if(g)gameServer(g.id).neutral?.(g,slot);}
export function replaceController(g:any,slot:number){if(g)gameServer(g.id).controllerReplaced?.(g,slot);}
export function zeroInput(id:string){return Object.fromEntries(gameManifest(id).input.axes.map(k=>[k,0]));}
export function validateInput(id:string,body:any){const axes=gameManifest(id).input.axes;if(!body||typeof body!=='object'||Object.keys(body).some(k=>!axes.includes(k)))return null;const input=Object.fromEntries(axes.map(k=>[k,body[k]??0]));return ['x','y'].every(k=>typeof body[k]==='number')&&Object.values(input).every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v as number)<=1)?input:null;}
