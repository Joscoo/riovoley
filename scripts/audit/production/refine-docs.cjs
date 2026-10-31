// Correct editorial encoding and preserve all denominators before sealing.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
assert.ok(!fs.existsSync(path.join(h.evidence,'MANIFIESTO_SHA256.json')));
const replacements={
 'utiliz?':'utilizó','conserv?':'conservó','comprob?':'comprobó','repiti?':'repitió','realiz?':'realizó','s? sola':'sí sola',
 'Preparaci?n':'Preparación','producci?n':'producción','auditor?a':'auditoría','adem?s':'además','publicaci?n':'publicación','autorizaci?n':'autorización','autom?ticos':'automáticos','t?cnico':'técnico',
 'ejecuci?n':'ejecución','despu?s':'después','?rboles':'árboles','migraci?n':'migración','configuraci?n':'configuración','aprobaci?n':'aprobación','verificaci?n':'verificación','an?lisis':'análisis','Revisi?n':'Revisión','efect?an':'efectúan','?ndice':'índice','Producci?n':'Producción',
 'regresi?n':'regresión','?ltimo':'último','?nicos':'únicos','ra?z':'raíz','separaci?n':'separación','a?n':'aún','p?blicos':'públicos','desactivaci?n':'desactivación','Acci?n':'Acción','Despu?s':'Después','conexi?n':'conexión','Configuraci?n':'Configuración','p?blico':'público','Cat?logo':'Catálogo','cat?logo':'catálogo','espec?ficos':'específicos','observaci?n':'observación','d?a':'día','contrase?a':'contraseña','actualizaci?n':'actualización','versi?n':'versión','recuperaci?n':'recuperación','restauraci?n':'restauración','retenci?n':'retención','transici?n':'transición','Liberaci?n':'Liberación','inspecci?n':'inspección','p?blica':'pública','preparaci?n':'preparación','expl?citos':'explícitos','evaluaci?n':'evaluación',
};
const docs=['INFORME_VERIFICACION_TECNICA.md','MATRIZ_VERIFICACIONES_TESIS.md','RESULTADOS_PARA_TESIS_4_5.md','ESTADO_PRODUCCION.md'];
const files=['README.md','docs/tesis/README.md','docs/produccion/RUNBOOK.md','docs/superpowers/plans/2026-10-30-preparacion-produccion.md','scripts/audit/production/report.cjs',...docs.map(f=>path.join(h.evidence,f))];
for(const file of files){
 let text=fs.readFileSync(file,'utf8');for(const [from,to]of Object.entries(replacements))text=text.split(from).join(to);
 text=text.replace('La ejecución más reciente continúa','La ejecución anterior continúa');
 text=text.replace('Una inspección de perfil autenticado falló','Dos inspecciones de perfil autenticado fallaron');
 text=text.replace('La repetición se registra aparte;', 'La segunda ejecución aprobó la captura y terminó 103/105 por dos esperas de login local agotadas; el diagnóstico registró /token 500 con context canceled. Sin builds simultáneos se repitió la suite con un trabajador. Entre los intentos de regresión se registraron 459 ejecuciones, 456 aprobadas y tres fallidas, correspondientes a 249 combinaciones únicas. El smoke adicional de tres casos repetidos tiene denominador separado. La repetición final se registra aparte;');
 if(/(?:MATRIZ_VERIFICACIONES_TESIS|RESULTADOS_PARA_TESIS_4_5)\.md$/.test(file)&&!text.includes('Aclaración de artefactos')){
  text+='\n\nAclaración de artefactos e intentos: la regresión completa de 249 instancias usó el build previo con mapas, con las mismas fuentes src/ conservadas. Solo los tres casos del [smoke adicional](smoke-build-estricto/resultados.json), ya presentes en la matriz, comprobaron el build estricto final sin mapas; la [copia y sus hashes](compilacion-web/build-estricto-browser.json) lo identifican. Los dos intentos anteriores de paneles terminaron [104/105](paneles-finales/resultados.json) y [103/105](paneles-captura-corregida/resultados.json); la repetición aislada aprobó [105/105](paneles-aislados/resultados.json). Entre los intentos de regresión se acumulan 459 ejecuciones, 456 aprobadas y tres fallidas, sin sumar los tres casos repetidos del smoke. No son 459 funcionalidades únicas.\n';
 }
 fs.writeFileSync(file,text);
}
console.log('Corrección editorial UTF-8 y alcance de artefactos aplicados; sin cambios de resultados.');
