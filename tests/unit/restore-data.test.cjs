const {test}=require('node:test'),assert=require('node:assert/strict');
const {parseCopies,rowDigest}=require('../../scripts/audit/production/compare-restored-data.cjs');
test('extrae COPY sin ejecutar el SQL que lo rodea',()=>{const blocks=parseCopies('SELECT 1;\r\nCOPY fixture.records (id, value) FROM stdin;\r\n1\talpha\\nline\r\n2\tbeta\r\n\\.\r\nSELECT 2;');assert.equal(blocks.length,1);assert.equal(blocks[0].table,'fixture.records');assert.deepEqual(blocks[0].columns,['id','value']);assert.equal(blocks[0].rows.length,2);});
test('rechaza COPY incompleto en vez de aceptar una comparación parcial',()=>assert.throws(()=>parseCopies('COPY fixture.records (id) FROM stdin;\n1\n'),/COPY_BLOCK_INCOMPLETE/));
test('compara filas independientemente de su orden físico',()=>assert.equal(rowDigest(['2\tb','1\ta']),rowDigest(['1\ta','2\tb'])));
test('conserva multiplicidad de filas en el control de contenido',()=>assert.notEqual(rowDigest(['1\ta']),rowDigest(['1\ta','1\ta'])));
