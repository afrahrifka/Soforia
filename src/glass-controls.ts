/** Putar kiri/kanan menggulingkan kaca pada sumbu panjang di antara dua pembawa. */
export const GLASS_TURN_LEFT=1;
export const GLASS_TURN_RIGHT=-1;
export function keyboardGlassInputs(held:ReadonlySet<string>){
 const axis=(positive:string,negative:string)=>Number(held.has(positive))-Number(held.has(negative));
 return [
  {x:axis('KeyD','KeyA'),y:axis('KeyS','KeyW'),glassX:axis('KeyQ','KeyE')*GLASS_TURN_LEFT,glassY:axis('KeyF','KeyR')},
  {x:axis('ArrowRight','ArrowLeft'),y:axis('ArrowDown','ArrowUp'),glassX:axis('KeyU','KeyO')*GLASS_TURN_LEFT,glassY:axis('KeyK','KeyI')}
 ];
}
