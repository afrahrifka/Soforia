import type {GameClient} from '../../shared/game-contracts.ts';
import {buildConsole} from './console.ts';import {hud} from './hud.ts';import {art} from './art.ts';import {controller,syncController} from './controller.ts';
const client:GameClient={buildConsole,hud,art,controller,syncController,environment:{space:true,background:'#101c35'},notes:(before,next)=>next.game.energies.filter((e:any)=>e.taken).length>before.game.energies.filter((e:any)=>e.taken).length?[659,988]:[]};export default client;
