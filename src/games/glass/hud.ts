import {esc,badge} from '../../shared/html.ts';
import {glassCourse} from './glass.ts';
export function hud(state:any){const g=state.game;return `<div class="hud-scoreboard">${badge('LOKASI',glassCourse(g.stage).title)}${badge('PECAH',String(g.breaks))}</div>`;}
