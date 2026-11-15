/** Interpolasi visual saja; state dan collision tetap otoritatif di server. */
export class GlassPresentation {
 private frames:{state:any;time:number}[]=[];
 private identity='';
 push(state:any,time:number,identity:string){
  const previous=this.frames.at(-1)?.state;
  if(identity!==this.identity||previous?.stage!==state.stage||previous&&Math.hypot(previous.pane.x-state.pane.x,previous.pane.z-state.pane.z)>3||previous?.retryTime>0&&state.retryTime<=0)this.frames=[];
  this.identity=identity;
  this.frames.push({state,time});
  while(this.frames.length>8)this.frames.shift();
 }
 sample(time:number){
  if(!this.frames.length)return null;
  const target=time-50;let a=this.frames[0],b=a;
  for(const frame of this.frames){if(frame.time<=target)a=frame;if(frame.time>=target){b=frame;break;}b=frame;}
  const t=a===b?1:Math.max(0,Math.min(1,(target-a.time)/(b.time-a.time)));
  const mix=(from:any,to:any,keys:string[])=>{const value={...to};for(const key of keys)if(typeof from[key]==='number'&&typeof to[key]==='number')value[key]=from[key]+(to[key]-from[key])*t;return value;};
  return {...b.state,camera:a.state.camera&&b.state.camera?mix(a.state.camera,b.state.camera,['x','y','z','targetX','targetY','targetZ','yaw','heading']):b.state.camera,elapsed:a.state.elapsed+(b.state.elapsed-a.state.elapsed)*t,pane:mix(a.state.pane,b.state.pane,['x','y','z','yaw','roll','slope']),players:b.state.players.map((p:any,i:number)=>mix(a.state.players[i],p,['x','y','z','lift','lower','gripHeight']))};
 }
}
