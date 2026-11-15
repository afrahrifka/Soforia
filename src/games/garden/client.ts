import type {GameClient} from '../../shared/game-contracts.ts';
import {buildConsole} from './console.ts';import {hud} from './hud.ts';import {art} from './art.ts';import {controller,syncController} from './controller.ts';
const client:GameClient={buildConsole,hud,art,controller,syncController,environment:{background:'#b8cdb7'},notes:(before,next)=>next.game.harvest.carrot+next.game.harvest.berry>before.game.harvest.carrot+before.game.harvest.berry?[523,784]:[]};export default client;
