import type {GameClient} from '../../shared/game-contracts.ts';
import {buildConsole} from './console.ts';import {hud} from './hud.ts';import {art} from './art.ts';import {controller,analog,control} from './controller.ts';
import {display} from './display.ts';
const client:GameClient={buildConsole,hud,art,controller,display,displayClass:'quiz-stage',analog,control,renderKey:(state,personal)=>[state.game.round,state.game.answered,state.game.revealed,state.game.answers,state.game.skipped,state.game.revealReady,state.game.nextReady,personal],notes:(before,next)=>next.game.revealed&&!before.game.revealed?[523,659]:[]};export default client;
