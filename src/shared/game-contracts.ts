/** API antar-modul. Perubahan kontrak merupakan scope platform/architecture. */
export interface GameManifest {
 schemaVersion:1;id:string;title:string;tag:string;description:string;duration:string;icon:string;color:string;layout:string;instructions:string;
 order?:number;players:2;menu:{title:string;line:string;genre:string;showLevel?:boolean};
 input:{axes:string[];actions:string[]};developer?:{keyboard:boolean;maxLevel:number};
}
export interface GameBase {id:string;mode:string;level:number;seed:number;elapsed:number;finished:boolean;score:number;[key:string]:any}
export interface GameContext {random:()=>number}
export interface GameServer<S extends GameBase=GameBase> {
 create(base:GameBase,context:GameContext):S;tick(game:S,inputs:Record<string,number>[],dt:number):void;
 action(game:S,slot:number,name:string,value?:unknown):void;
 publicState(game:S):unknown;privateState(game:S,slot:number):unknown;result(game:S):{title:string;detail:string;stars?:number|null};
 neutral?(game:S,slot?:number):void;controllerReplaced?(game:S,slot:number):void;
}
/** SceneKit memberi resource scene aktif, bukan akses ke game/dashboard lain. */
export interface SceneKit { [key:string]:any;camera:any;world:any;scene:any;readonly reducedMotion:boolean;animate:(object:any,update:(state:any,time:number,dt:number)=>void)=>void }
export interface ControllerView {buttons:string;utilities?:string;analogDisabled?:boolean;analogLabel?:string;caption?:string;actionClass?:string;attributes?:string}
export interface GameClient {
 environment?:{space?:boolean;background?:string};
 buildConsole(game:any,kit:SceneKit):void;hud?(state:any):string;display?(state:any):string;displayClass?:string;hudClass?:string;resultLabel?:string;
 art?():string;sceneKey?(game:any):string|number;cameraOffset?:number;
 controller(state:any,personal:any,prefs:any):ControllerView;syncController?(state:any,connected:boolean,muted:boolean):void;
 renderKey?(state:any,personal:any,prefs:any):unknown;analog?(state:any,personal:any,draft:number|null,x:number,y:number):number|null|undefined;
 control?(action:string,value:unknown,context:any):boolean;notes?(previous:any,next:any):number[];
 snapshot?(previous:any,next:any,context:{operator:boolean;muted:boolean;time:number}):void;frameState?(game:any,time:number):any;
 unlockAudio?():void;muteAudio?(muted:boolean):void;leave?():void;
 developer?:{codes:string[];inputs:(held:Set<string>)=>Record<string,number>[];actions:Record<string,[number,string]>;help:string};
}
