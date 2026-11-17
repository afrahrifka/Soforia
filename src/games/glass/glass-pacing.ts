import type {GlassChallenge} from './glass-levels.ts';
/** Footprint longitudinal fisik; transisi ditambahkan terpisah, tidak disamarkan sebagai rintangan. */
export function challengeExtent(kind:GlassChallenge,group=3){
 const radius=kind==='ferry'?9.1:kind==='sideFerry'?8.2:kind==='lift'?4:kind==='turntable'?4.4:kind==='weave'?6.2:kind==='tiltWeave'?4.7:kind==='threadBridge'?(group>=2?6.1:3):kind==='threadHop'?(group>=2?3.4:2.2):kind==='stepping'||kind==='sweeper'?3:['roll','threadHammer'].includes(kind)?4:kind==='raise'?.8:kind==='duck'||kind==='split'?.7:kind==='traffic'?1.25:kind==='breathing'?.9:kind==='jump'?.25:.7;
 return {before:radius,after:radius};
}
export function posture(kind:GlassChallenge){return ['roll','threadHop','threadBridge','threadHammer','weave','turntable','zipper'].includes(kind)?'thread':kind==='raise'?'high':kind==='duck'?'low':['split','tiltWeave'].includes(kind)?'split':'flat';}
export function encounterGap(a:GlassChallenge,b:GlassChallenge,stage:number,group:number){
 const machines=['hammer','threadHammer','axe','crusher','traffic','logSwing','zipper','iris','scissor','breathing','turntable'];
 const lateralChange=a!==b&&(['zipper','weave'].includes(a)||['zipper','weave'].includes(b));
 const transition=Math.max(lateralChange?12:0,(machines.includes(b)||['ferry','sideFerry','lift'].includes(b))?8:0,posture(a)===posture(b)?(stage<12?3.4:2.8):(posture(a)==='thread'||posture(b)==='thread'?12:8));
 return Math.max(6.6,challengeExtent(a,group).after+challengeExtent(b,group).before+transition);
}
export function weaveOffset(delta:number,stage:number){const amplitude=stage<12?1.25:stage<36?1.35:1.45,knots=[[-12,0],[-7,-amplitude],[-5,-amplitude],[-1,amplitude],[1,amplitude],[5,-amplitude],[7,-amplitude],[12,0]];for(let i=1;i<knots.length;i++){const [s,b]=knots[i],a=knots[i-1];if(delta<=s){const t=Math.max(0,Math.min(1,(delta-a[0])/(s-a[0])));return a[1]+(b-a[1])*t*t*(3-2*t);}}return 0;}
