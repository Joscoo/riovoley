const assert = require('node:assert/strict');
const { readLocal } = require('./safety.cjs');
const h = require('./harness.cjs');
(async () => {
  readLocal();
  // Exclusivamente un pago del seed local fijo: dos importes distintos permiten
  // comprobar orden real, sin aceptar listas constantes como evidencia suficiente.
  await h.sql('preparar-importes-locales', "UPDATE billing.payments SET membership_type_id=2,monto=32.50 WHERE id='eeee1000-0000-4000-8000-000000000008' AND student_id='eeee0000-0000-4000-8000-000000000008';");
  const r = await h.sql('precondicion-importes', 'SELECT count(distinct monto) FROM billing.payments;');
  assert.ok(Number(r.stdout.trim()) >= 2);
})();
