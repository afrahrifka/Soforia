import type {GameClient} from '../../shared/game-contracts.ts';
import {display} from './display.ts';
import {buildConsole} from './console.ts';import {controller,syncController} from './controller.ts';import {hud} from './hud.ts';import {art} from './art.ts';import * as audio from './audio.ts';
let personal:any={};
const client:GameClient={environment:{background:'#26394d'},buildConsole,controller,hud,art,display,sceneKey:g=>g.district,
 renderKey:(s,p)=>{personal=p;return `${s.game.district}:${p.role}`;},syncController:(s)=>syncController(s,personal),
 control(action,value,context){if(action==='seek'){context.act('seek',Number(value));return true;}return false;},
 unlockAudio:audio.unlockAudio,muteAudio:audio.muteAudio,snapshot:audio.snapshot,leave(){personal={};audio.leave();},resultLabel:'KOTA KEMBALI BERGERAK'};export default client;
