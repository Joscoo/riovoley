const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSchema } = require('./schema.cjs');
test('restaura PK antes de FK, funciones antes de policies y ordena vistas', () => {
  const s={schemas:['core','public'], tables:[{schema:'core',name:'users',columns:[{name:'id',type:'uuid',notnull:true}],constraints:[{name:'pk',type:'p',definition:'PRIMARY KEY (id)'}],rls:true}],functions:[{schema:'public',name:'is_admin',identity_args:'',definition:'CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql AS $$ select true $$;',grants:[]}],views:[{schema:'public',name:'second',definition:'select * from public.first',options:['security_invoker=true'],dependencies:[{schema:'public',name:'first'}]},{schema:'public',name:'first',definition:'select * from core.users',options:['security_invoker=true']}],policies:[{schemaname:'core',tablename:'users',policyname:'owner',cmd:'SELECT',roles:['authenticated'],permissive:'PERMISSIVE',qual:'public.is_admin()'}]};
  const sql=buildSchema(s);
  assert.ok(sql.indexOf('FUNCTION public.is_admin')<sql.indexOf('CREATE POLICY'));
  assert.ok(sql.indexOf('VIEW "public"."first"')<sql.indexOf('VIEW "public"."second"'));
  assert.match(sql,/security_invoker=true/); assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
  assert.ok(!sql.includes('DROP SCHEMA'));
});
test('rechaza ciclos de vistas y esquemas administrados', () => {
  assert.throws(()=>buildSchema({schemas:['auth']}),/administrado|esquema/i);
  assert.throws(()=>buildSchema({schemas:['public'],views:[{schema:'public',name:'a',definition:'select 1',dependencies:[{schema:'public',name:'a'}]}]}),/ciclo|dependencia/i);
});
test('crea funciones de columnas generadas antes de las tablas', () => {
  const sql=buildSchema({schemas:['public','core'],functions:[{schema:'public',name:'age',identity_args:'value date',definition:'CREATE FUNCTION public.age(value date) RETURNS integer LANGUAGE sql AS $$ select 1 $$;',grants:[]}],tables:[{schema:'core',name:'people',columns:[{name:'birth',type:'date'},{name:'age',type:'integer',generated:'s',default:'public.age(birth)'}],constraints:[]}]});
  assert.ok(sql.indexOf('CREATE FUNCTION')<sql.indexOf('CREATE TABLE'));
  assert.ok(sql.indexOf('IMMUTABLE')>=0 && sql.indexOf('IMMUTABLE')<sql.indexOf('CREATE TABLE'));
  assert.ok(sql.lastIndexOf('CREATE OR REPLACE FUNCTION public.age')>sql.indexOf('CREATE TABLE'));
});
