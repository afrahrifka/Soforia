import {gameClient} from './client-registry.ts';
export function gameHud(state:any){return state.game?gameClient(state.game.id).hud?.(state)||'':'';}
