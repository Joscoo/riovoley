'use strict';
// Local catalog rehearsal only. Does not modify the reviewed production proposals.
const assert = require('node:assert/strict'), ctx = require('./packet-context.cjs');
const gateName = 'riovoley_packet_write_gate';
const digestQuery = `SELECT md5(COALESCE(string_agg(item,E'\\n' ORDER BY item),'')) AS fingerprint FROM (
 SELECT 'schema:'||n.nspname||':'||pg_get_userbyid(n.nspowner)||':'||COALESCE(n.nspacl::text,'DEFAULT') AS item FROM pg_namespace n WHERE n.nspname='gate_guard'
 UNION ALL SELECT 'function:'||p.proname||':'||pg_get_function_identity_arguments(p.oid)||':'||pg_get_userbyid(p.proowner)||':'||pg_get_functiondef(p.oid)||':'||COALESCE(p.proacl::text,'DEFAULT') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='gate_guard'
 UNION ALL SELECT 'trigger:'||n.nspname||'.'||c.relname||':'||t.tgenabled::text||':'||pg_get_triggerdef(t.oid) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE t.tgname='riovoley_packet_write_gate'
 UNION ALL SELECT 'inventory:'||n.nspname||'.'||c.relname||':'||c.relkind::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN('r','p') AND n.nspname NOT LIKE 'pg_%' AND n.nspname NOT IN('information_schema','extensions')
) items`;
async function digest(db) { return (await db.query(digestQuery)).rows[0].fingerprint; }
async function targetGuard(db) {
  const c = ctx.read(); assert.equal(db.connectionParameters.host, '127.0.0.1'); assert.equal(Number(db.connectionParameters.port), 55322);
  const row = (await db.query("SELECT current_database() AS name,current_user,session_user,current_setting('role') AS role,shobj_description(oid,'pg_database') AS marker FROM pg_database WHERE datname=current_database()")).rows[0];
  assert.equal(row.name, c.database); assert.equal(row.marker, ctx.marker); assert.equal(row.current_user, 'postgres'); assert.equal(row.session_user, 'postgres'); assert.equal(row.role, 'none');
}
async function install(db, tables) {
  await targetGuard(db); assert.ok(tables.length > 0);
  const target = tables.find(t => t.id_column && ['core', 'public', 'profiles'].includes(t.schema)); assert.ok(target, 'PROBE_TARGET_REQUIRED');
  await db.query('BEGIN');
  try {
    await db.query("SET LOCAL lock_timeout='2s'; SET LOCAL statement_timeout='10s'; CREATE SCHEMA gate_guard; REVOKE ALL ON SCHEMA gate_guard FROM PUBLIC;");
    await db.query(`CREATE FUNCTION gate_guard.reject_write() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $gate$
    BEGIN
      IF current_database() !~ '^riovoley_gatepacket_[0-9]{14}_[a-f0-9]{6}$' THEN RAISE EXCEPTION 'LOCAL_PACKET_ONLY'; END IF;
      IF session_user='postgres' AND current_user='postgres' AND current_setting('role')='none' THEN RETURN NULL; END IF;
      RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='RIOVOLEY_LOCAL_WRITE_GATE';
    END $gate$; REVOKE ALL ON FUNCTION gate_guard.reject_write() FROM PUBLIC;`);
    for (const table of tables) await db.query('CREATE TRIGGER ' + gateName + ' BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON ' + ctx.qi(table.schema) + '.' + ctx.qi(table.name) + ' FOR EACH STATEMENT EXECUTE FUNCTION gate_guard.reject_write()');
    await db.query('CREATE FUNCTION gate_guard.probe_write() RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $probe$ UPDATE ' + ctx.qi(target.schema) + '.' + ctx.qi(target.name) + ' SET id=id WHERE false $probe$');
    await db.query('REVOKE ALL ON FUNCTION gate_guard.probe_write() FROM PUBLIC; GRANT USAGE ON SCHEMA gate_guard TO authenticated; GRANT EXECUTE ON FUNCTION gate_guard.probe_write() TO authenticated; COMMIT;');
  } catch (error) { await db.query('ROLLBACK'); throw error; }
}
async function remove(db, tables) {
  await targetGuard(db); await db.query('BEGIN');
  try {
    await db.query("SET LOCAL lock_timeout='2s'; SET LOCAL statement_timeout='10s';");
    const n = (await db.query("SELECT count(*)::int AS n FROM pg_trigger WHERE tgname=$1 AND tgfoid='gate_guard.reject_write()'::regprocedure", [gateName])).rows[0].n;
    assert.equal(n, tables.length, 'INCOMPLETE_PACKET_GATE');
    for (const table of tables) await db.query('DROP TRIGGER ' + gateName + ' ON ' + ctx.qi(table.schema) + '.' + ctx.qi(table.name));
    await db.query('DROP FUNCTION gate_guard.probe_write(); DROP FUNCTION gate_guard.reject_write(); DROP SCHEMA gate_guard; COMMIT;');
  } catch (error) { await db.query('ROLLBACK'); throw error; }
}
function createVariant(source, mapping, gateDigest) {
  const c = ctx.read(); assert.match(gateDigest, /^[a-f0-9]{32}$/);
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  assert.equal((source.match(/^BEGIN;\r?$/gm) || []).length, 1);
  assert.equal((source.match(/^COMMIT;\r?$/gm) || []).length, 1);
  let replaced = 0;
  const body = source.replace(/IF actual IS DISTINCT FROM '([a-f0-9]{32})'/g, (text, expected) => {
    assert.ok(Object.hasOwn(mapping, expected), 'UNMAPPED_CATALOG_GUARD'); assert.match(mapping[expected], /^[a-f0-9]{32}$/); replaced++;
    return "IF actual IS DISTINCT FROM '" + mapping[expected] + "'";
  });
  assert.ok(replaced > 0);
  const extra = `DO $local_gate_guard$
  DECLARE actual text;
  BEGIN
    IF current_database() <> '${c.database}' OR (SELECT shobj_description(oid,'pg_database') FROM pg_database WHERE datname=current_database()) IS DISTINCT FROM '${ctx.marker}' THEN RAISE EXCEPTION 'LOCAL_PACKET_ONLY'; END IF;
    IF current_user <> 'postgres' OR session_user <> 'postgres' OR current_setting('role') <> 'none' THEN RAISE EXCEPTION 'LOCAL_PACKET_ADMIN_REQUIRED'; END IF;
    SELECT fingerprint INTO actual FROM (${digestQuery}) gate_catalog;
    IF actual IS DISTINCT FROM '${gateDigest}' THEN RAISE EXCEPTION 'LOCAL_GATE_CATALOG_DRIFT'; END IF;
  END $local_gate_guard$;`;
  const sql = body.replace(/^BEGIN;(?=\r?$)/m, 'BEGIN;' + eol + 'SET LOCAL search_path=public,extensions;' + eol + extra.replaceAll('\n', eol));
  // Reversal proves that functional statements and original guard structure remain intact.
  const reverse = Object.fromEntries(Object.entries(mapping).map(([before, after]) => [after, before])); assert.equal(Object.keys(reverse).length, Object.keys(mapping).length);
  const restored = body.replace(/IF actual IS DISTINCT FROM '([a-f0-9]{32})'/g, (text, expected) => "IF actual IS DISTINCT FROM '" + reverse[expected] + "'");
  assert.equal(restored, source, 'FUNCTIONAL_SQL_CHANGED');
  return { sql, guardsRebased: replaced, originalBodyPreservedBytewise: true };
}
module.exports = { install, remove, digest, digestQuery, createVariant, gateName };
