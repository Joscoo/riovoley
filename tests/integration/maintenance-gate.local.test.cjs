'use strict';
// Explicit local-only suite; deliberately not included in hosted synthetic CI.
const { test, before, after } = require('node:test'), assert = require('node:assert/strict');
const lab = require('../../scripts/audit/maintenance/lab.cjs');
const phase = process.env.RIOVOLEY_GATE_PHASE;
assert.ok(['baseline', 'red', 'green'].includes(phase), 'Explicit local phase required');
let admin, clients = [], beforeSnapshot, oldTransaction;
const denied = async (db, sql) => assert.rejects(() => lab.rollbackQuery(db, sql), error => error.code === '55000' && error.message === 'RIOVOLEY_LOCAL_WRITE_GATE');
before(async () => {
  admin = await lab.connect(); beforeSnapshot = await lab.snapshot(admin);
  for (const actor of lab.actors) clients.push({ actor, db: await lab.actorConnection(actor) });
  if (phase === 'green') {
    await clients[1].db.query('PREPARE gate_cached_write AS INSERT INTO public.gate_probe VALUES(2,200)');
    await lab.rollbackQuery(clients[1].db, 'EXECUTE gate_cached_write');
    oldTransaction = await lab.actorConnection(lab.actors[1]);
    await oldTransaction.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
    await oldTransaction.query('SELECT * FROM public.gate_probe');
  }
});
after(async () => {
  try {
    if (oldTransaction) { await oldTransaction.query('ROLLBACK'); await oldTransaction.end(); }
    if (admin) {
      const afterSnapshot = await lab.snapshot(admin);
      assert.deepEqual(afterSnapshot, beforeSnapshot, 'Synthetic rows must not change');
      const h = require('../../scripts/e2e/local/harness.cjs');
      h.write('integracion/fixture-despues-' + phase + '.json', { tables: afterSnapshot, matchesBefore: true, productionChanged: false });
    }
  } finally {
    await Promise.allSettled(clients.map(c => c.db.end())); if (admin) await admin.end();
  }
});
if (phase === 'baseline') {
  for (const actor of lab.actors) test('baseline: ' + actor.name + ' permite INSERT antes de la barrera', async () => {
    const { db } = clients.find(c => c.actor === actor);
    const r = await lab.rollbackQuery(db, 'INSERT INTO public.gate_probe VALUES(2,200)'); assert.equal(r.rowCount, 1);
  });
} else if (phase === 'red') {
  test('rechaza INSERT de authenticated con codigo y mensaje de barrera', async () => {
    await denied(clients[1].db, 'INSERT INTO public.gate_probe VALUES(2,200)');
  });
} else {
  const gate = require('../../scripts/audit/maintenance/gate.cjs');
  test('instalacion con escritor activo falla atomicamente y no deja disparadores parciales', async () => {
    const writer = await lab.connect();
    try {
      await writer.query('BEGIN'); await writer.query('UPDATE storage.gate_probe SET value=101 WHERE id=1');
      await assert.rejects(() => gate.install(admin, '200ms'), { code: '55P03' });
      assert.equal((await admin.query("SELECT count(*)::int AS n FROM pg_trigger WHERE tgname='riovoley_local_write_gate'")).rows[0].n, 0);
      assert.equal((await admin.query("SELECT to_regnamespace('gate_guard') AS schema")).rows[0].schema, null);
    } finally { await writer.query('ROLLBACK'); await writer.end(); }
  });
  test('instala barrera en las siete relaciones de fixture', async () => {
    await gate.install(admin);
    assert.equal((await admin.query("SELECT count(*)::int AS n FROM pg_trigger WHERE tgname='riovoley_local_write_gate'")).rows[0].n, 7);
  });
  test('transaccion REPEATABLE READ anterior no elude el nuevo disparador', async () => {
    await assert.rejects(() => oldTransaction.query('INSERT INTO public.gate_probe VALUES(2,200)'), error => error.code === '55000' && error.message === 'RIOVOLEY_LOCAL_WRITE_GATE');
    await oldTransaction.query('ROLLBACK');
  });
  test('sentencia preparada y ejecutada antes del cierre no elude la barrera', async () => {
    await denied(clients[1].db, 'EXECUTE gate_cached_write');
  });
  for (const actor of lab.actors) {
    for (const [operation, sql] of Object.entries({ INSERT: 'INSERT INTO public.gate_probe VALUES(2,200)', UPDATE: 'UPDATE public.gate_probe SET value=200 WHERE id=1', DELETE: 'DELETE FROM public.gate_probe WHERE id=1', TRUNCATE: 'TRUNCATE public.gate_probe' })) {
      test('rechaza ' + operation + ' de ' + actor.name, async () => { await denied(clients.find(c => c.actor === actor).db, sql); });
    }
    test('permite SELECT a ' + actor.name, async () => {
      assert.equal((await clients.find(c => c.actor === actor).db.query('SELECT count(*)::int AS n FROM public.gate_probe')).rows[0].n, 1);
    });
  }
  for (const schema of ['gamification', 'auth', 'storage']) test('bloquea escritura SQL en esquema sintetico ' + schema, async () => {
    await denied(clients[1].db, 'INSERT INTO ' + schema + '.gate_probe VALUES(2,200)');
  });
  for (const [actor, schema] of [[lab.actors[3], 'auth'], [lab.actors[4], 'storage']]) test('bloquea ' + actor.name + ' en su esquema sintetico ' + schema, async () => {
    await denied(clients.find(c => c.actor === actor).db, 'INSERT INTO ' + schema + '.gate_probe VALUES(2,200)');
  });
  for (const actor of lab.actors.slice(0, 3)) test('SECURITY DEFINER no elude barrera para ' + actor.name, async () => {
    await denied(clients.find(c => c.actor === actor).db, 'SELECT public.gate_definer_write()');
  });
  test('bloquea UPDATE a traves de vista security_invoker', async () => { await denied(clients[1].db, 'UPDATE public.gate_view SET value=200 WHERE id=1'); });
  for (const table of ['gate_partition', 'gate_partition_low']) test('bloquea escritura por ' + table, async () => { await denied(clients[1].db, 'INSERT INTO public.' + table + ' VALUES(2,200)'); });
  test('bloquea UPSERT antes de modificar filas', async () => { await denied(clients[1].db, 'INSERT INTO public.gate_probe VALUES(1,200) ON CONFLICT(id) DO UPDATE SET value=excluded.value'); });
  test('bloquea UPDATE aunque no encuentre filas', async () => { await denied(clients[1].db, 'UPDATE public.gate_probe SET value=200 WHERE id=99'); });
  test('marcador closed-to-clients no concede excepcion a authenticated', async () => {
    const db = clients[1].db;
    await db.query("SELECT set_config('riovoley.release.window','closed-to-clients',false)");
    await denied(db, 'INSERT INTO public.gate_probe VALUES(2,200)');
  });
  test('conexion administrativa postgres conserva capacidad de escritura explicitamente', async () => {
    assert.equal((await lab.rollbackQuery(admin, 'INSERT INTO public.gate_probe VALUES(2,200)')).rowCount, 1);
  });
  test('postgres con SET ROLE authenticated no obtiene excepcion administrativa', async () => {
    await admin.query('SET ROLE authenticated');
    try { await denied(admin, 'INSERT INTO public.gate_probe VALUES(2,200)'); } finally { await admin.query('RESET ROLE'); }
  });
  test('retirada con escritor administrativo activo revierte todos los cambios parciales', async () => {
    const writer = await lab.connect();
    try {
      await writer.query('BEGIN'); await writer.query('UPDATE storage.gate_probe SET value=101 WHERE id=1');
      await assert.rejects(() => gate.remove(admin, '200ms'), { code: '55P03' });
      assert.equal((await admin.query("SELECT count(*)::int AS n FROM pg_trigger WHERE tgname='riovoley_local_write_gate'")).rows[0].n, 7);
    } finally { await writer.query('ROLLBACK'); await writer.end(); }
  });
  test('retirada devuelve escrituras a los cinco actores y conserva filas sinteticas', async () => {
    await gate.remove(admin);
    assert.equal((await admin.query("SELECT count(*)::int AS n FROM pg_trigger WHERE tgname='riovoley_local_write_gate'")).rows[0].n, 0);
    for (const { db } of clients) assert.equal((await lab.rollbackQuery(db, 'INSERT INTO public.gate_probe VALUES(2,200)')).rowCount, 1);
    assert.deepEqual(await lab.snapshot(admin), beforeSnapshot);
  });
}
