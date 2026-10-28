// Solo se corrigen documentos derivados del expediente actual, aún sin sellar.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
assert.ok(!fs.existsSync(path.join(h.evidence,'MANIFIESTO_SHA256.json')),'Expediente ya sellado');
const pairs=[
 ['en133','en 133'],['105de','105 de'],['y17','y 17'],['y29','y 29'],['en404','en 404'],['código1','código 1'],['casos ya incluidos en404','casos ya incluidos en 404'],
 ['Posición del atleta de fixture en su clasificación; no todas las categorías','Persistencia de snapshot del atleta; categoría y posición no comprobadas'],
 ['La clasificación comprobada corresponde al fixture; no se extrapola a todas las categorías institucionales.','G08 comprueba existencia de un snapshot de clasificación del atleta de fixture, sin verificar su categoría, posición ni ordenación; ese aspecto permanece parcialmente comprobado.'],
 ['clasificación del atleta de prueba','persistencia de un snapshot de clasificación del atleta de prueba, sin verificar categoría ni posición'],
 ['| 8. Compilación | 0/0 |','| 8. Compilación | No aplica |'],
];
for(const file of ['INFORME_VERIFICACION_TECNICA.md','MATRIZ_VERIFICACIONES_TESIS.md','RESULTADOS_PARA_TESIS_4_5.md']){
 const target=path.join(h.evidence,file);let text=fs.readFileSync(target,'utf8');for(const [a,b] of pairs)text=text.replaceAll(a,b);fs.writeFileSync(target,text);
}
const generator=path.join(__dirname,'report.cjs');let source=fs.readFileSync(generator,'utf8');for(const [a,b] of pairs)source=source.replaceAll(a,b);fs.writeFileSync(generator,source);
