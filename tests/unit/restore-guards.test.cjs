const {test}=require('node:test'),assert=require('node:assert/strict');
const {diagnosticCategory,assertCatalog}=require('../../scripts/production/restore-guards.cjs');
test('publica solo categoría ante excepción SQL con texto privado sin comillas',()=>assert.equal(diagnosticCategory('pg_restore: error: could not execute query: ERROR: Persona Sintetica 999999 no autorizada'),'UNKNOWN_NATIVE_ERROR'));
test('clasifica esquema existente sin devolver su nombre',()=>assert.equal(diagnosticCategory('pg_restore: error: ERROR: schema "private_fixture" already exists'),'SCHEMA_EXISTS'));
test('distingue frase de recuperación incorrecta sin publicar stderr',()=>assert.equal(diagnosticCategory('gpg: public key decryption failed: Bad passphrase'),'BAD_RECOVERY_PASSPHRASE'));
test('reconoce el requisito de preload de pg_net sin publicar SQL',()=>assert.equal(diagnosticCategory('ERROR: pg_net is not in shared_preload_libraries'),'EXTENSION_PRELOAD'));
test('acepta coincidencia de huellas válidas',()=>assert.equal(assertCatalog('a'.repeat(32),'a'.repeat(32)),true));
test('rechaza diferencia de catálogo después de cargar filas',()=>assert.throws(()=>assertCatalog('a'.repeat(32),'b'.repeat(32)),/CATALOG_MISMATCH/));
test('rechaza valores ausentes aunque ambos coincidan',()=>assert.throws(()=>assertCatalog(undefined,undefined),/INVALID_CATALOG_FINGERPRINT/));
