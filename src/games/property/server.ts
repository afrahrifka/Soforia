import type {GameServer} from '../../shared/game-contracts.ts';
import {createProperty,tickProperty,propertyAction,propertyValue} from './property.ts';
const server:GameServer={create:base=>({...base,...createProperty()}),tick:(g,_inputs,dt)=>tickProperty(g,dt),action:propertyAction,publicState:g=>g,privateState:()=>({}),result(g){const values=[propertyValue(g,0),propertyValue(g,1)];return {title:values[0]===values[1]?'Kota seimbang!':`Pemain ${values[0]>values[1]?'A':'B'} memenangkan kota!`,detail:`Nilai aset A: ${values[0]} · B: ${values[1]}`};}};export default server;
