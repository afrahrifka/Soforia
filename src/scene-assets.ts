import * as T from 'three';
import {addAsset,assetChoices} from './assets3d.ts';
const groups=[
 [...assetChoices('kaykit-city',/^building_[A-H]$/),...assetChoices('kenney-nature',/^(bench|plant_bush|flower_yellow)/)],
 [...assetChoices('kaykit-resources',/^(Fuel_[AB]_Barrel|Wood_Log_Stack|Pallet_Wood|Textiles_Stack_Small)$/),...assetChoices('kaykit-space',/^(cargo_[AB]|containers_[AB]|cargodepot_A)$/)],
 [...assetChoices('quaternius-nature',/^(CommonTree_|TwistedTree_|Bush_|Flower_.*Group|Mushroom_|Fern_)/)],
 [...assetChoices('kaykit-resources',/^(Parts_|Iron_Bars|Fuel_.*Barrel|Copper_Bars)/),...assetChoices('quaternius-city',/^(Metal_Column|Stairs_Entrance|Building_Small)/)],
 [...assetChoices('quaternius-nature',/^(Pine_|Rock_Medium_|Pebble_Round_)/),...assetChoices('kenney-platformer',/^tree.*snow/)],
 [...assetChoices('kenney-nature',/^(rock_large|cliff_top|tree_pine)/),...assetChoices('kenney-platformer',/^(tree.*snow|rocks)/)]
];
function semanticHeight(id:string){
 if(/flower|fern|mushroom|clover|grass/i.test(id))return .6;
 if(/bush|plant/i.test(id))return .9;
 if(/bench/i.test(id))return .8;
 if(/building/i.test(id))return 3.4;
 if(/tree|pine/i.test(id))return 3;
 if(/rock|cliff/i.test(id))return 1.6;
 if(/bars|pallet|pile|wood_log|textiles/i.test(id))return .7;
 return 1.25;
}
export function addGlassBackdrop(root:T.Object3D,world:number,variation:number){
 const list=groups[world];
 for(let section=0;section<4;section++)for(const side of [-1,1]){
  const i=(variation*5+section*3+(side>0?1:0))%list.length;
  addAsset(root,list[i],{x:side*8,z:-section*12-6,y:-.6,height:semanticHeight(list[i]),maxFootprint:3,yaw:side>0?-Math.PI/2:Math.PI/2});
  const small=groups[(world+1)%groups.length];addAsset(root,small[(i+2)%small.length],{x:side*6,z:-section*12-3,y:-.2,height:Math.min(.9,semanticHeight(small[(i+2)%small.length])),maxFootprint:1.8,yaw:variation*.3});
 }
 if(world===3)addAsset(root,'kaykit-space/windturbine_tall',{x:-10,z:-19,height:6,y:-1});
 if(world===1)addAsset(root,'kaykit-city/watertower',{x:10,z:-13,height:5,y:-1});
}
export const forestChoices=[...assetChoices('quaternius-nature',/^CommonTree_/),...assetChoices('kenney-nature',/^tree_default/)].slice(0,12);
