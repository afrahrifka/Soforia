/** Sintesis lokal orisinal; tanpa rekaman atau unduhan runtime. */
let context:AudioContext|undefined,muted=false,lastSecond=-1,lastDistrict=-1;
function tone(hz:number,duration:number,gain=.025,delay=0){if(!context||context.state!=='running'||muted)return;const start=context.currentTime+delay,osc=context.createOscillator(),volume=context.createGain();osc.type='sine';osc.frequency.value=hz;volume.gain.setValueAtTime(0,start);volume.gain.linearRampToValueAtTime(gain,start+.008);volume.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(volume);volume.connect(context.destination);osc.start(start);osc.stop(start+duration);osc.onended=()=>{osc.disconnect();volume.disconnect();};}
export function unlockAudio(){context??=new AudioContext();void context.resume().catch(()=>{});}
export function muteAudio(value:boolean){muted=value;}
export function snapshot(previous:any,next:any){if(!next?.game||next.phase!=='playing')return;const g=next.game,second=Math.floor(g.clock);if(lastDistrict>=0&&lastDistrict!==g.district){[392,493.88,587.33].forEach((hz,i)=>tone(hz,.7,.035,i*.13));}else if(second!==lastSecond&&second%5===0)tone(second%10?660:880,.12,.012);lastSecond=second;lastDistrict=g.district;}
export function leave(){void context?.close();context=undefined;lastSecond=-1;lastDistrict=-1;}
