# Informe de corrección y verificación técnica de RIOVOLEY

Commit base **c71f55e5bc59c528a002c4347fb1664794cb277e**; árbol local con cambios de auditoría y las correcciones aquí descritas, sin commit ni push. Fecha: 28/10/2026; zona America/Guayaquil (UTC−05). Los registros guardan inicio/fin UTC. Este expediente complementa [la auditoría inicial](../../verificacion-tecnica/20261027-212222-c71f55e/INFORME_VERIFICACION_TECNICA.md) y [la primera ejecución aislada](../20261028-141243-c71f55e/INFORME_VERIFICACION_TECNICA.md); ambos se conservan con sus hashes.

## Alcance y entorno

Se corrigieron las causas de las 17 instancias fallidas de la primera pasada aislada y se repitieron las mismas 112 instancias, con cuatro comprobaciones adaptables adicionales. Windows 11, Node v24.18.0, npm 11.16.0, CRA 5.0.1, React 19, Playwright instalado según lockfile y Supabase local Docker. API 127.0.0.1:55321, PostgreSQL 17.11 en 55322 y frontend 6100. La configuración [../../../../../playwright.local.config.cjs](../../../../../playwright.local.config.cjs) usa siete perfiles, Chromium/WebKit, tres workers en las pasadas finales y **cero reintentos**. El proxy cerrado bloquea solicitudes externas del navegador. Variables requeridas: claves Supabase y PII locales, cuentas ADMIN/TRAINER/STUDENT y E2E_LOCAL_LABEL; los valores no se publican. No se carga .env.e2e institucional. [bindings-locales.json](bindings-locales.json) acredita bindings a loopback.

Supabase Auth, REST y PostgreSQL de E2E son reales y locales, con datos ficticios. El esquema local fue reconstruido desde metadatos en la etapa anterior; no se afirma equivalencia absoluta con producción (PostgreSQL remoto observado entonces: 17.4). No se modificó la base institucional ni sus credenciales, esquema, RLS o permisos. El build usa configuración exclusiva local. No se publicó ni distribuyó ningún paquete.

## Correcciones y justificación

- Asistencias: se reutiliza el helper de login/navegación que prepara la guía inicial y abre el menú móvil; se espera Registro Rápido, sin condicionar el clic a un conteo inmediato. Los selectores por nombres internos de clases se sustituyen por atributos estables. Se exige al menos una fila y correspondencia entre filas, nombres y acciones, para evitar comprobaciones vacías.
- Pagos: los encabezados se ocultan por global.css hasta 767 px. Se incorporan controles accesibles para los seis criterios en la presentación de tarjetas; usan exactamente queryState/toggleSort existentes. SortableHeader informa el estado fuera de tablas mediante nombre accesible. El ciclo sigue siendo ninguno → ascendente → descendente → ninguno.
- Ordenación E2E: se comprueban importes numéricos reales en todas las páginas, esperando la consulta y la página correspondiente. El seed local incluye dos precios distintos (35 y 32,50); las pruebas rechazan listas constantes como evidencia de ordenación. Los cuatro anchos nuevos cubren el intervalo que no aparecía en los siete perfiles originales.
- Alta: se utilizan Estudiantes, Crear, campos actuales y el modal de credenciales. Se elige entrega manual y se cierra el modal; no se configura ni acredita entrega por proveedores externos. El importe automático deshabilitado se comprueba como 35,00, respetando el formato monetario, sin intentar escribir 25 en él.
- Asistencia: se comprueba el botón correspondiente a una mensualidad activa. Se espera la respuesta POST satisfactoria antes de recargar, pues el color inicial es una actualización optimista. Después se verifica de nuevo pago y asistencia. La consulta SQL posterior acredita las siete cadenas persistidas. Las altas se restringen al arnés local.
- Privacidad: las claves temporales creadas por UI permanecen en runtime ignorado y se incorporan al saneamiento de logs/reportes; el contenido code de credenciales se enmascara visualmente en las capturas.

Archivos principales: [../../../../../tests/e2e/asistencias.guided.review.spec.js](../../../../../tests/e2e/asistencias.guided.review.spec.js), [../../../../../tests/e2e/filters-sorting.tables.spec.js](../../../../../tests/e2e/filters-sorting.tables.spec.js), [../../../../../tests/e2e/admin.happy-path-controlled.spec.js](../../../../../tests/e2e/admin.happy-path-controlled.spec.js), [../../../../../tests/e2e/helpers/paymentsSorting.js](../../../../../tests/e2e/helpers/paymentsSorting.js), [../../../../../tests/e2e/payments.responsive-boundaries.spec.js](../../../../../tests/e2e/payments.responsive-boundaries.spec.js), [../../../../../src/features/payments/presentation/components/PagosManager.js](../../../../../src/features/payments/presentation/components/PagosManager.js), [../../../../../src/shared/ui/SortableHeader.js](../../../../../src/shared/ui/SortableHeader.js) y [../../../../../src/features/attendance/presentation/components/AsistenciasManager.js](../../../../../src/features/attendance/presentation/components/AsistenciasManager.js). No se cambió la lógica de cálculo, cobro, autenticación o persistencia del producto para hacer aprobar pruebas; el cambio funcional de interfaz incorpora ordenación móvil con la lógica existente.

## Metodología reproducible

Desde la raíz, con Docker local disponible: ejecutar secuencialmente npm.cmd run e2e:local:setup; npm.cmd run e2e:local:build; node scripts/e2e/local/functions.cjs (servicio en otra terminal); node scripts/e2e/local/run.cjs mutations --workers=3; node scripts/e2e/local/run.cjs pending --workers=3; node scripts/e2e/local/run.cjs boundaries --workers=2; node scripts/e2e/local/check-fixes.cjs coverage-final; node scripts/e2e/local/check-environment-fixes.cjs. Usar etiquetas nuevas en cada ejecución. No correr seed/idempotencia simultáneamente con altas. [../../../../../scripts/e2e/local/README.md](../../../../../scripts/e2e/local/README.md) documenta preparación y aislamiento. Cada comando instrumentado conserva stdout/stderr y meta.json con argumentos, fechas, duración y código de salida.

## Resultados consolidados finales

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| JEST-01 | Jest y Testing Library | 395 | 395 | 0 | 0 | APROBADO | [jest-coverage-final.json](jest-coverage-final.json) |
| CON-01 | Contratos (subconjunto de JEST-01) | 6 | 6 | 0 | 0 | APROBADO | [casos-jest-detallados.json](casos-jest-detallados.json) |
| INT-01 | Integración lógica en memoria (subconjunto de JEST-01) | 5 | 5 | 0 | 0 | APROBADO | [casos-jest-detallados.json](casos-jest-detallados.json) |
| E2E-01 | Quince casos × siete perfiles | 105 | 105 | 0 | 0 | APROBADO | [pendientes-finales/resultados.json](pendientes-finales/resultados.json) |
| E2E-02 | Alta + mensualidad + asistencia, siete perfiles | 7 | 7 | 0 | 0 | APROBADO | [mutaciones-confirmadas/resultados.json](mutaciones-confirmadas/resultados.json) |
| E2E-03 | Límites adaptables de pagos | 4 | 4 | 0 | 0 | APROBADO | [limites-finales/resultados.json](limites-finales/resultados.json) |
| DB-01 | Persistencia SQL de los siete flujos | 7 | 7 | 0 | 0 | APROBADO | [persistencia-siete-flujos.json](persistencia-siete-flujos.json) |
| HAR-01 | Pruebas del arnés local | 12 | 12 | 0 | 0 | APROBADO | [arnes-final.stdout.log](arnes-final.stdout.log) |
| AUTH-01 | Login y lectura de tres roles locales | 3 | 3 | 0 | 0 | APROBADO | [auth-roles-reales.json](auth-roles-reales.json) |
| RLS-01 | Matriz SQL local con ROLLBACK (un script) | — | — | — | — | APROBADO | [rls-local.meta.json](rls-local.meta.json) |
| WEB-01 | Compilación CRA (comando, sin casos) | — | — | — | — | APROBADO | [compilacion-web-build-1793201023441.meta.json](compilacion-web-build-1793201023441.meta.json) |
| AND-01 | Compilación nativa Android | — | — | — | — | NO EJECUTADO | [../../verificacion-tecnica/20261027-212222-c71f55e/INFORME_VERIFICACION_TECNICA.md](../../verificacion-tecnica/20261027-212222-c71f55e/INFORME_VERIFICACION_TECNICA.md) |

Las mismas **112 instancias** pasaron de **95 aprobadas y 17 fallidas a 112 aprobadas y cero fallidas**, con cero omisiones. [fallos-corregidos.json](fallos-corregidos.json) relaciona individualmente los 17 fallos anteriores con su resultado actual; [casos-e2e-detallados.json](casos-e2e-detallados.json) conserva el denominador completo. Los cuatro casos de límites son adicionales: **116 instancias E2E finales aprobadas**, no una suma de todos los intentos. Los siete controles SQL verifican las mismas altas y no se añaden al denominador E2E. Los contratos y cinco integraciones lógicas están dentro de las 395 pruebas Jest, no se suman otra vez.

Jest: **84/84 suites y 395/395 casos**, 0 omitidos. Esos resultados incluyen las cinco pruebas de integración lógica añadidas durante la auditoría inicial y tres nuevas aserciones de accesibilidad de SortableHeader. La mayoría de pruebas de servicios/casos de uso usan repositorios o dependencias simuladas; los cinco casos de integración lógica usan almacenamiento en memoria, no PostgreSQL. La cobertura instrumentada es: líneas **41.27% (4988/12084)**, sentencias 39.92%, funciones 35.68% y ramas 32.35% ([cobertura-resumen.json](cobertura-resumen.json), [cobertura/lcov-report/index.html](cobertura/lcov-report/index.html)). Se conserva la limitación del App.test.js trivial identificada inicialmente; no se interpreta la cobertura como validación completa del producto.

Duraciones Playwright finales: 105 instancias, 258.400 s; siete cadenas, 66.545 s; cuatro límites, 13.128 s. Reportes HTML: [pendientes-finales/html/index.html](pendientes-finales/html/index.html), [mutaciones-confirmadas/html/index.html](mutaciones-confirmadas/html/index.html), [limites-finales/html/index.html](limites-finales/html/index.html). Las capturas de revisión guiada conservan los datos ficticios; no se habilitaron trazas ni vídeos que pudieran guardar tokens.

## Compilación web y Android

| Comando registrado | Salida | Duración (s) | Evidencia |
|---|---:|---:|---|
| C:\Program Files\nodejs\node.exe D:\Riovoley\riovoley\node_modules\react-scripts\scripts\build.js | 0 | 61.053 | [compilacion-web-build-1793200684370.meta.json](compilacion-web-build-1793200684370.meta.json) |
| C:\Program Files\nodejs\node.exe D:\Riovoley\riovoley\node_modules\react-scripts\scripts\build.js | 0 | 55.273 | [compilacion-web-build-1793201023441.meta.json](compilacion-web-build-1793201023441.meta.json) |

Ambos builds se generaron en directorios nuevos de .e2e-local; el segundo contiene el breakpoint final. Archivos de salida y hashes: [artefactos-compilacion.json](artefactos-compilacion.json). Advertencias: consultar los stdout/stderr de compilación; se registró la deprecación DEP0176 de Node. Se compiló React para web; ello no demuestra todas las funcionalidades ni constituye una compilación Android. Android no se reejecutó: en la inspección inicial faltó Android SDK y el JDK/Gradle disponible era incompatible. Esa verificación conserva estado NO EJECUTADO, con requisitos en el informe inicial. No se publicaron APK/AAB ni OTA.

## Persistencia, roles y seguridad

[persistencia-siete-flujos.json](persistencia-siete-flujos.json) acredita mediante SELECT local **siete estudiantes nuevos, siete pagos de 35 y siete asistencias** dentro de la ventana del run final. Es evidencia de persistencia real local, además de la recarga UI. No equivale a verificar todas las actualizaciones de XP, wallet, tienda, concurrencia o integraciones externas. Los intentos de depuración también dejaron registros ficticios, que se conservan; no se cuentan como siete casos adicionales.

Los tres roles aprobaron login y lecturas locales ([auth-roles-reales.json](auth-roles-reales.json)); la matriz SQL con ROLLBACK finalizó con salida 0 ([rls-local.meta.json](rls-local.meta.json)). Estos controles tienen alcance limitado. No se ejecutó una nueva auditoría remota, npm audit fix, cambios de permisos ni remediación de los avisos de dependencias anteriores. Los hallazgos de seguridad de la auditoría inicial siguen pendientes de tratamiento específico; no se presenta este trabajo como prueba de penetración ni certificación de seguridad.

## Intentos, incidencias y límites

Todos los intentos Playwright de esta etapa se conservan; las filas finales se identifican por sus etiquetas y no se combinan con fallos previos para calcular el resultado final.

| Intento | Aprobados | Fallidos | Omitidos | Duración runner (s) | Evidencia |
|---|---:|---:|---:|---:|---|
| afectadas-asistencia-pagos | 7 | 7 | 0 | 59.236 | [afectadas-asistencia-pagos/resultados.json](afectadas-asistencia-pagos/resultados.json) |
| antes-filtros-asistencia | 0 | 2 | 0 | 36.577 | [antes-filtros-asistencia/resultados.json](antes-filtros-asistencia/resultados.json) |
| antes-mutacion | 0 | 1 | 0 | 17.808 | [antes-mutacion/resultados.json](antes-mutacion/resultados.json) |
| asistencias-corregidas | 7 | 0 | 0 | 17.731 | [asistencias-corregidas/resultados.json](asistencias-corregidas/resultados.json) |
| flujo-actual-desktop | 0 | 1 | 0 | 61.855 | [flujo-actual-desktop/resultados.json](flujo-actual-desktop/resultados.json) |
| flujo-actual-desktop-crear | 0 | 1 | 0 | 62.036 | [flujo-actual-desktop-crear/resultados.json](flujo-actual-desktop-crear/resultados.json) |
| flujo-actual-desktop-filtros | 0 | 1 | 0 | 15.626 | [flujo-actual-desktop-filtros/resultados.json](flujo-actual-desktop-filtros/resultados.json) |
| flujo-actual-moneda | 0 | 1 | 0 | 23.454 | [flujo-actual-moneda/resultados.json](flujo-actual-moneda/resultados.json) |
| flujo-confirmacion-persistencia | 1 | 0 | 0 | 13.323 | [flujo-confirmacion-persistencia/resultados.json](flujo-confirmacion-persistencia/resultados.json) |
| limites-finales | 4 | 0 | 0 | 13.128 | [limites-finales/resultados.json](limites-finales/resultados.json) |
| mutaciones-confirmadas | 7 | 0 | 0 | 66.545 | [mutaciones-confirmadas/resultados.json](mutaciones-confirmadas/resultados.json) |
| mutaciones-finales | 3 | 4 | 0 | 87.573 | [mutaciones-finales/resultados.json](mutaciones-finales/resultados.json) |
| pendientes-finales | 105 | 0 | 0 | 258.400 | [pendientes-finales/resultados.json](pendientes-finales/resultados.json) |

La comprobación inicial de idempotencia coincidió por error con altas en curso y devolvió salida 1 al observar conteos cambiantes; no permite concluir duplicación ni corrupción. Se repitió después de terminar las escrituras y aprobó con conteos iguales ([seed-idempotencia.json](seed-idempotencia.json)); los logs de ambos intentos se conservan. La primera ejecución llamada jest-rojo no llegó a evaluar el componente sin corrección, porque la edición se produjo antes de que CRA terminara de cargarlo: no se usa como evidencia de fallo previo. La pasada explícita jest-sin-correccion comprobó tres fallos nuevos y tres casos existentes aprobados; jest-con-correccion aprobó seis. El primer comando denominado jest-coverage solo ejecutó seis casos enfocados, sin cobertura; el resultado completo válido es jest-coverage-final (395 casos y artefactos de cobertura).

No se han ejecutado nuevas compras/equipamientos cosméticos ni validaciones de proveedores externos, compilación nativa o pruebas con usuarios. Los siete fallos de acceso anónimo a /estudiante de la primera auditoría pública corresponden a otro expediente y no se reejecutaron ni se declaran corregidos aquí. La corrección acreditada en esta etapa se refiere a las 17 instancias de la ejecución aislada.

La revisión independiente y las correcciones atendidas figuran en [REVISION_INDEPENDIENTE.md](REVISION_INDEPENDIENTE.md). Integridad/privacidad: [INTEGRIDAD.json](INTEGRIDAD.json), [PRIVACIDAD.json](PRIVACIDAD.json) y [MANIFIESTO_SHA256.json](MANIFIESTO_SHA256.json). Las cifras se generan desde los JSON originales, no desde resultados simulados. Propuesta de texto académico: [RESULTADOS_PARA_TESIS_4_5.md](RESULTADOS_PARA_TESIS_4_5.md); trazabilidad: [MATRIZ_VERIFICACIONES_TESIS.md](MATRIZ_VERIFICACIONES_TESIS.md).

