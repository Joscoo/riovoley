import {test} from 'node:test';
import assert from 'node:assert/strict';
import {oneRelatedRow} from '../../supabase/functions/_shared/relations.ts';
test('relación uno a uno admite objeto y array unitario conservando identidad',()=>{const row={id:'fixture'};assert.equal(oneRelatedRow(row),row);assert.equal(oneRelatedRow([row]),row);});
test('ausencia de relación devuelve null',()=>{for(const v of [null,undefined,[]])assert.equal(oneRelatedRow(v),null);});
test('multiplicidad inesperada se rechaza sin seleccionar un usuario arbitrario',()=>{assert.throws(()=>oneRelatedRow([{id:'a'},{id:'b'}]),/multiple/);});
test('relaciones anidadas de pago conservan usuario con objetos o arrays',()=>{const u={id:'fixture',nombre:'Ensayo'};for(const nested of [u,[u]])for(const parent of [{users:nested},[{users:nested}]])assert.equal(oneRelatedRow(oneRelatedRow(parent)?.users),u);});
test('multiplicidad en cualquier nivel anidado se rechaza',()=>{assert.throws(()=>oneRelatedRow([{users:[]},{users:[]}]),/multiple/);assert.throws(()=>oneRelatedRow(oneRelatedRow({users:[{id:'a'},{id:'b'}]})?.users),/multiple/);});
