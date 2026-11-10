'use strict';
// Experimental SQL-only gate, hard limited to a uniquely marked local fixture.
// Not a production migration or an application-wide maintenance mechanism.
const assert = require('node:assert/strict');
const lab = require('./lab.cjs');
async function guard(db) {
  assert.equal(db.connectionParameters.host, '127.0.0.1'); assert.equal(Number(db.connectionParameters.port), 55322);
  const expected = lab.context();
  const r = await db.query("SELECT current_database() AS name,session_user,current_user,current_setting('role') AS role,shobj_description(oid,'pg_database') AS marker FROM pg_database WHERE datname=current_database()");
  assert.equal(r.rows[0].name, expected.database); assert.equal(r.rows[0].marker, lab.marker);
  assert.equal(r.rows[0].session_user, 'postgres'); assert.equal(r.rows[0].current_user, 'postgres'); assert.equal(r.rows[0].role, 'none');
}
async function transaction(db, timeout, operation) {
  assert.ok(['200ms', '2s'].includes(timeout)); await guard(db);
  await db.query('BEGIN');
  try {
    await db.query("SELECT set_config('lock_timeout',$1,true),set_config('statement_timeout','5s',true)", [timeout]);
    await operation(); await db.query('COMMIT');
  } catch (error) { await db.query('ROLLBACK'); throw error; }
}
async function install(db, timeout = '2s') {
  return transaction(db, timeout, async () => {
    await db.query(`CREATE SCHEMA gate_guard;
      REVOKE ALL ON SCHEMA gate_guard FROM PUBLIC;
      CREATE FUNCTION gate_guard.reject_write() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $gate$
      BEGIN
        IF current_database() !~ '^riovoley_gate_[0-9]{14}_[a-f0-9]{6}$' THEN
          RAISE EXCEPTION 'LOCAL_FIXTURE_ONLY';
        END IF;
        IF session_user='postgres' AND current_user='postgres' AND current_setting('role')='none' THEN
          RETURN NULL;
        END IF;
        RAISE EXCEPTION USING ERRCODE='55000', MESSAGE='RIOVOLEY_LOCAL_WRITE_GATE';
      END $gate$;
      REVOKE ALL ON FUNCTION gate_guard.reject_write() FROM PUBLIC;`);
    for (const table of lab.relations) await db.query('CREATE TRIGGER riovoley_local_write_gate BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON ' + table + ' FOR EACH STATEMENT EXECUTE FUNCTION gate_guard.reject_write()');
  });
}
async function remove(db, timeout = '2s') {
  return transaction(db, timeout, async () => {
    const entries = (await db.query("SELECT t.tgrelid::regclass::text AS relation FROM pg_trigger t WHERE t.tgname='riovoley_local_write_gate' AND t.tgfoid='gate_guard.reject_write()'::regprocedure ORDER BY 1")).rows;
    assert.equal(entries.length, lab.relations.length, 'INCOMPLETE_FIXTURE_GATE');
    for (const table of lab.relations) await db.query('DROP TRIGGER riovoley_local_write_gate ON ' + table);
    await db.query('DROP FUNCTION gate_guard.reject_write(); DROP SCHEMA gate_guard');
  });
}
module.exports = { install, remove };
