import type {GameClient} from '../../shared/game-contracts.ts';
import {buildConsole} from './console.ts';import {hud} from './hud.ts';import {art} from './art.ts';import {controller} from './controller.ts';
const client:GameClient={buildConsole,hud,art,controller,cameraOffset:2.7,resultLabel:'KOTA SELESAI',hudClass:'city-hud',renderKey:state=>[state.game.turn,state.game.pending,state.game.moves,state.game.stage,state.game.decision],notes:(before,next)=>next.game.turn===next.you?.slot&&before.game.stage!==next.game.stage&&next.game.stage==='decision'?[440,554]:[]};export default client;
