# Informe de verificación técnica: seguridad y regresión local

## 1. Proyecto, commit y alcance autorizado

RIOVOLEY, repositorio https://github.com/Joscoo/riovoley. Base **e469db5608fb77071b6a9ee3db253c28dae734dd**, rama **fix/seguridad-local-20261029**, con cambios sin publicar identificados en el inventario final. Fecha de inicio UTC: 2026-10-29T13:59:54.332Z; generación: 2026-10-29T15:20:23.527Z. Zona de trabajo: America/Guayaquil. [CONTEXTO.json](CONTEXTO.json). No se modificó el documento de tesis ni el backend institucional. Los seis expedientes anteriores permanecen como antecedentes íntegros; las cifras finales de este informe proceden de ejecuciones nuevas.

El usuario autorizó continuar la corrección en el backend local descartable. La autorización no se extiende a producción, publicación de funciones, distribución de APK ni push nuevos. El SQL se conserva fuera de supabase/migrations y exige un marcador de alcance, RLS activo y vistas invocadoras. [../../../../../database/security/local/20261029141114_riovoley_security_local.sql](../../../../../database/security/local/20261029141114_riovoley_security_local.sql), [../../../../../database/security/local/README.md](../../../../../database/security/local/README.md).

## 2. Entorno y configuración

Windows_NT 10.0.26300, x64; Node v24.18.0, npm 11.16.0; PostgreSQL 17.11; driver pg8.23.1 y Deno2.9.6 portátiles/locales. API127.0.0.1:55321, PG127.0.0.1:55322, frontend127.0.0.1:6100, SMTP/Mailpit127.0.0.1:55324. [herramientas-entorno.json](herramientas-entorno.json). Las cuentas son sintéticas y descartables. Variables requeridas: REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY, REACT_APP_PII_ENCRYPTION_KEY y E2E_* se resuelven desde .e2e-local; RIOVOLEY_LOCAL_DB_PASSWORD es opcional para el driver; las claves del servidor Deno se inyectan únicamente al proceso. No se publican valores.

Docker Desktop no estaba iniciado y su API Windows quedó sin responder aun cuando Auth/REST/PG locales funcionaban. Se preservaron los intentos fallidos y se usó conexión PG exclusivamente de loopback. Antes de ejecutar SQL, el driver contrasta el UID y correo de la cuenta sintética de Auth con la misma base; rechaza cualquier otra URL/proyecto. No se ejecut? SQL ni se orden? recrear o reiniciar otros stacks. El árbol functions declara Node22 y se comprobó con Node24; los avisos EBADENGINE se conservan.

## 3. Método y comandos

Se observaron fallos antes de corregirlos, se aplicó el SQL en una transacción local, se verificaron las rutas negativas y los flujos legítimos, y se ejecutaron reversión, comparación y reaplicación. [../../../../superpowers/plans/2026-10-29-seguridad-local.md](../../../../superpowers/plans/2026-10-29-seguridad-local.md) y [../../../../../database/security/local/README.md](../../../../../database/security/local/README.md) detallan preparación, copias y restricciones. Los códigos de salida y tiempos están en cada *.meta.json; los comandos SQL independientes dejan también resultados explícitos. Secuencia principal, siempre en un expediente nuevo:

```powershell
node scripts/audit/security/install-driver.cjs
node scripts/audit/security/snapshot.cjs
node scripts/audit/security/authorization-snapshot.cjs
node scripts/audit/security/apply-local.cjs preflight
node scripts/audit/security/apply-local.cjs apply
node scripts/audit/security/run.cjs access acceso-nuevo
node scripts/audit/security/run.cjs functional funcional-nuevo
node scripts/audit/security/run.cjs edge edge-nuevo
node scripts/audit/security/run.cjs full jest-nuevo
node scripts/e2e/local/build.cjs
node scripts/audit/closure/browser-regression.cjs
node scripts/audit/security/deno-typecheck.cjs
node scripts/audit/security/edge-http.cjs
node scripts/audit/security/verify-final.cjs
node scripts/audit/security/check-functions.cjs
node scripts/audit/closure/audit-dependencies.cjs final
```

El arnés inicializa un expediente mediante initialize.cjs. No volver a tomar snapshots de un backend modificado pretendiendo que son el estado previo. Las etiquetas de salida deben ser nuevas al reproducir. Para semántica de políticas restrictivas y funciones se consultó la documentación oficial de [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) y [funciones PostgreSQL](https://supabase.com/docs/guides/database/functions); la comprobación efectiva se hizo sobre el catálogo y el backend locales.

## 4. Resultados y denominadores

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| UT-01 | Jest y Testing Library | 410 | 410 | 0 | 0 | APROBADO | [unitarias/jest-410-final.json](unitarias/jest-410-final.json) |
| CON-01 | Contratos incluidos en UT-01 | 10 | 10 | 0 | 0 | APROBADO | [unitarias/casos-jest.json](unitarias/casos-jest.json) |
| INT-M | Integración en memoria incluida en UT-01 | 5 | 5 | 0 | 0 | APROBADO | [unitarias/casos-jest.json](unitarias/casos-jest.json) |
| SEC-R | Seguridad REST/RPC/PG local | 34 | 34 | 0 | 0 | APROBADO | [integracion/acceso-final-1793286802959.stdout.log](integracion/acceso-final-1793286802959.stdout.log) |
| INT-R | Flujos funcionales con persistencia local | 18 | 18 | 0 | 0 | APROBADO | [integracion/funcional-final-1793286806893.stdout.log](integracion/funcional-final-1793286806893.stdout.log) |
| EDGE-C | Contratos Edge con dependencias simuladas | 20 | 20 | 0 | 0 | APROBADO | [unitarias/edge-final-1793286815357.stdout.log](unitarias/edge-final-1793286815357.stdout.log) |
| EDGE-H | Handlers HTTP originales con Auth/PG reales | 12 | 12 | 0 | 0 | APROBADO | [integracion/edge-http-pruebas-1793286817025.stdout.log](integracion/edge-http-pruebas-1793286817025.stdout.log) |
| HTTP-F | Express functions en loopback | 2 | 2 | 0 | 0 | APROBADO | [integracion/functions-health-final-1793286376843.stdout.log](integracion/functions-health-final-1793286376843.stdout.log) |
| E2E-1 | publicas-finales | 133 | 133 | 0 | 0 | APROBADO | [publicas-finales/resultados.json](publicas-finales/resultados.json) |
| E2E-2 | paneles-finales | 105 | 105 | 0 | 0 | APROBADO | [paneles-finales/resultados.json](paneles-finales/resultados.json) |
| E2E-3 | mutaciones-finales | 7 | 7 | 0 | 0 | APROBADO | [mutaciones-finales/resultados.json](mutaciones-finales/resultados.json) |
| E2E-4 | limites-finales | 4 | 4 | 0 | 0 | APROBADO | [limites-finales/resultados.json](limites-finales/resultados.json) |
| SQL-01 | Reversión de definiciones/ACL/políticas | — | — | — | — | APROBADO | [seguridad/rollback-verificado-1793286801927-e079a9.json](seguridad/rollback-verificado-1793286801927-e079a9.json) |
| DEN-01 | Deno check: cuatro entrypoints | — | — | — | — | APROBADO | [integracion/deno-typecheck-1793285554921.meta.json](integracion/deno-typecheck-1793285554921.meta.json) |
| WEB-01 | Compilación web | — | — | — | — | APROBADO | [compilacion-web-build-1793285281200.meta.json](compilacion-web-build-1793285281200.meta.json) |
| NPM-raiz | npm audit raiz (avisos, no casos) | — | — | — | — | EJECUTADO: AVISOS | [seguridad/npm-raiz-final.json](seguridad/npm-raiz-final.json) |
| NPM-functions | npm audit functions (avisos, no casos) | — | — | — | — | APROBADO | [seguridad/npm-functions-final.json](seguridad/npm-functions-final.json) |
| NPM-auxiliar | npm audit auxiliar (avisos, no casos) | — | — | — | — | APROBADO | [seguridad/npm-auxiliar-final.json](seguridad/npm-auxiliar-final.json) |
| AND-01 | Nueva compilación Android en esta etapa | — | — | — | — | NO EJECUTADO | [../20261028-200050-android-actualizado-c71f55e/android/artefacto-final.json](../20261028-200050-android-actualizado-c71f55e/android/artefacto-final.json) |
| PROD-01 | Aplicación institucional del endurecimiento | — | — | — | — | BLOQUEADO: AUTORIZACIÓN | [../../../../../database/security/local/README.md](../../../../../database/security/local/README.md) |

CON-01 e INT-M son subconjuntos de los 410 casos y no se suman de nuevo. Los 34 casos de seguridad,18 funcionales,20 contratos Edge,12 HTTP reales y2 HTTP Express son runners separados. Playwright registra 249 instancias:133 públicas +105 de paneles/filtros +7 flujos con escritura local +4 límites de anchura. Los intentos fallidos o intermedios se conservan; no se agregan a los denominadores finales.

## 5. Unitarias y componentes

**410/410 casos en 87 suites**, cero fallos/omitidos, 42.049 s de proceso. Cobertura instrumentada: sentencias 41.26%, ramas 33.57%, funciones 36.7% y líneas 42.65%. [unitarias/cobertura-jest-410-final/lcov-report/index.html](unitarias/cobertura-jest-410-final/lcov-report/index.html), [unitarias/cobertura-resumen.json](unitarias/cobertura-resumen.json), [unitarias/casos-jest.json](unitarias/casos-jest.json). Los módulos incluyen autenticación/sesiones, usuarios, pagos, asistencias, evaluaciones, comunicados/notificaciones, reportes, gamificación y UI compartida. La cobertura no representa todos los comportamientos posibles.

Se añadieron cuatro regresiones sobre recompensa atómica/lecturas sin escrituras y dos sobre autorización del borrado antes de eliminar filas. En el primer recorrido completo falló un test financiero cuyo pago supuestamente vigente terminaba el día28 del mes; el29 ya representaba correctamente una deuda. Se cambió únicamente el dato de cobertura al último día real del mes, manteniendo las expectativas y la lógica de producción. La corrección de esa dependencia del calendario está sustentada por [unitarias/jest-408-final.json](unitarias/jest-408-final.json) y [unitarias/jest-410-final.json](unitarias/jest-410-final.json).

## 6. Contratos e integración

Los 20 casos Edge verifican autorización canónica, suspensión, rechazo de perfiles alternativos, objetivos de eliminación por rol y contratos de comunicaciones/credenciales. Usan dependencias simuladas: no son entrega real de correo/push. Deno check aprobó cuatro entrypoints/árboles de importación del código modificado, [integracion/deno-typecheck-1793285554921.meta.json](integracion/deno-typecheck-1793285554921.meta.json). El primer chequeo detectó expansión excesiva de tipos del SDK; se acotó el adaptador de consulta canónica y el chequeo posterior aprobó sin omitir tipos.

Los 18 casos de [../../../../../tests/integration/gamification.local.test.cjs](../../../../../tests/integration/gamification.local.test.cjs) usan Auth, REST, RPC y PostgreSQL reales locales. Se conserva un adaptador vacío de notificaciones externas; la persistencia y los repositorios de negocio no están simulados. G01–G17 comprueban XP/niveles/historial, rachas, logros/retos/campaña, identidad/títulos/avatar, wallet, compra/equipamiento, ingreso diario e interacción con pagos/asistencias/evaluaciones; G17 entrega recuperación en SMTP/Mailpit local, sin cambiar contraseñas.

G18 amplía la comprobación de clasificaciones: **61 participantes** de la categoría del fixture, posiciones consecutivas, puntuación descendente, desempate por nivel/UUID, correspondencia servicio/snapshot y categoría inexistente vacía. [integracion/ranking-categoria-1793286815153-a27c85.json](integracion/ranking-categoria-1793286815153-a27c85.json). No se extrapola a todas las categorías o métricas.

Los 12 casos HTTP ejecutan los handlers originales de delete-auth-user y send-push en Deno con Auth/PG reales. Solo se sustituye el arranque del servidor por un listener de loopback. La ejecución final usa --cached-only y permisos de red limitados a 55321/6161, sin descarga de módulos ni proveedores externos; la preparación de caché previa sí descargó dependencias públicas. Se comprueban 401/403, perfiles legados, objetivos administrativos rechazados y el borrado real de atletas descartables mediante los repositorios de administrador/entrenador. Push autorizado con cuerpo vacío devuelve 400 antes del proveedor; **no se envía ningún push**. [integracion/edge-http-pruebas-1793286817025.stdout.log](integracion/edge-http-pruebas-1793286817025.stdout.log). No equivale a despliegue en Supabase Cloud ni a transacción distribuida entre Auth y PostgreSQL.

## 7. Seguridad y permisos reales

Los 34 casos de [../../../../../tests/integration/security.local.test.cjs](../../../../../tests/integration/security.local.test.cjs) cubren anónimo, atleta, personal activo y suspendido. La primera matriz de 20 comprobaciones obtuvo 5 aprobadas / 15 fallidas; al ampliar el alcance se conservaron otros ciclos RED/GREEN. El resultado final es 34/34. Se verificaron escrituras propias y ajenas, pagos por REST/RPC, modificación de rol/suspensión, metadatos de alta, duplicación/categoría del estudiante, inventario/logros no adquiridos, reloj/importe no controlables por el cliente y 12 peticiones concurrentes que entregan una sola recompensa de 8 XP. El cambio de relación deportiva no habilita una segunda recompensa al mismo actor.

RLS permanece activo en **gamification.xp_ledger y gamification.login_rewards**, además de wallet/ledger. Las políticas nuevas impiden escrituras del atleta sobre resultados y fuentes protegidas; login_rewards solo se modifica mediante la RPC/servidor. Las RPC UUID de pagos son invocadoras, validan personal activo y no tienen ejecución anónima. Las firmas bigint conservadas no compiten con UUID ni tienen ejecución web. El trigger de auditoría usa esquema explícito. [seguridad/verificacion-catalogo.json](seguridad/verificacion-catalogo.json), [seguridad/funciones-finales.json](seguridad/funciones-finales.json), [seguridad/politicas-finales.json](seguridad/politicas-finales.json).

El personal activo conserva su capacidad administrativa; el cálculo de proyecciones sigue en los casos de uso existentes con escrituras autorizadas. No se afirma que todo el progreso se calcule en el servidor. La compra RPC comprueba desbloqueo al adquirir; se conservan gasto confirmado y compras durante resincronización, y una transición 192→200XP por ingreso diario permite una compra de nivel 2. Los 24 días de historial de ese caso son un fixture sintético, no 24 días de observación temporal. Las reglas no revocan retrospectivamente cosméticos ya adquiridos.

Se probó la reversión real y se compararon **11 definiciones de funciones,11 ACL y 111 políticas** de los esquemas incluidos en la instantánea; se retiró la RPC diaria nueva y después se reaplicó la corrección y se repitieron las pruebas. [seguridad/rollback-verificado-1793286801927-e079a9.json](seguridad/rollback-verificado-1793286801927-e079a9.json). No se restauraron datos descartables ni se presenta ese procedimiento como respaldo institucional. El SQL de reversión es evidencia para el estado local observado, no una migración universal.

## 8. Playwright

- publicas-finales: 133/133, cero omitidos y reintentos; 95.741 s; [publicas-finales/html/index.html](publicas-finales/html/index.html).
- paneles-finales: 105/105, cero omitidos y reintentos; 341.284 s; [paneles-finales/html/index.html](paneles-finales/html/index.html).
- mutaciones-finales: 7/7, cero omitidos y reintentos; 83.443 s; [mutaciones-finales/html/index.html](mutaciones-finales/html/index.html).
- limites-finales: 4/4, cero omitidos y reintentos; 18.435 s; [limites-finales/html/index.html](limites-finales/html/index.html).

Incluye navegación pública, acceso sin sesión, paneles de tres roles, búsquedas/filtros/ordenación, siete altas/pago/asistencia con datos locales y límites 481/600/767/768px. Siete perfiles entre 390 y 1920 px. Los 28 casos de recuperación de contraseña en navegador interceptan Auth/REST y no prueban autenticación remota. Los demás flujos autenticados usan el Auth local. Se conservan HTML/JSON y capturas pertinentes, sin trazas/vídeos con sesiones.

## 9. Compilación web

CRA/react-scripts build finalizó con salida 0, 86.622 s, con Node/npm indicados. El build local activo queda en .e2e-local, sin distribución. [compilacion-web-build-1793285281200.meta.json](compilacion-web-build-1793285281200.meta.json), [compilacion-web-build-1793285281200.stdout.log](compilacion-web-build-1793285281200.stdout.log). Los logs conservan advertencias de CRA/ESLint/tamaño y la deprecación fs.F_OK. Compilar no acredita todas las funcionalidades.

## 10. Android

No se volvió a compilar ni ejecutar Android en esta etapa: el cambio se concentró en el contrato web/backend. La compilación y ejecución nativas del28 de octubre permanecen como **antecedentes**, no resultados nuevos del árbol modificado: [../20261028-200050-android-actualizado-c71f55e/android/artefacto-final.json](../20261028-200050-android-actualizado-c71f55e/android/artefacto-final.json). Se mantiene pendiente verificar una publicación coordinada del cliente Android actualizado, flujos autenticados nativos y dispositivo físico. No se distribuyó un APK ni se publicó una versión.

## 11. Dependencias y servicios auxiliares

| Árbol npm | Avisos antes →después | Altos antes →después | Moderados antes →después | Críticos finales |
|---|---:|---:|---:|---:|
| raiz | 35 →35 | 13 →13 | 6 →6 | 0 |
| functions | 62 →0 | 5 →0 | 57 →0 | 0 |
| auxiliar | 0 →0 | 0 →0 | 0 →0 | 0 |

functions solo importa Express para dos rutas de diagnóstico. Se retiraron Genkit no utilizado y un comando que apuntaba a un archivo inexistente; posteriormente npm audit fix --ignore-scripts --json corrigió un aviso compatible restante de path-to-regexp. No se utilizó --force, no se degradó Genkit y no se migró CRA. Build/lint y 2 pruebas HTTP Express aprobaron después del cambio. [seguridad/functions-retirar-genkit.meta.json](seguridad/functions-retirar-genkit.meta.json), [seguridad/functions-parche-compatible.meta.json](seguridad/functions-parche-compatible.meta.json), [integracion/functions-health-final-1793286376843.stdout.log](integracion/functions-health-final-1793286376843.stdout.log). Los JSON npm finales están en seguridad/npm-*-final.json. La raíz conserva 35 avisos (13 altos, 6 moderados, 16 bajos); no se ocultaron ni se presentó react-scripts0.0.0 como reparación válida.

## 12. Incidencias y límites

Se conservan los intentos fallidos de arranque Docker, preparación de fixtures, RLS/grants, comprobación de tipos y regresiones. Una primera aplicación olvidó el permiso de ejecución del helper para service_role: falló la preparación de24 casos y se corrigió antes del resultado válido. Se ajustaron campos de fixtures a sus contratos reales (método de pago, fecha de nacimiento, columnas generadas no escribibles); no se suprimieron casos. Para UPDATE bloqueado por RLS se comprueba también que la fila permanece intacta, ya que puede devolver cero filas sin excepción.

La eliminación de usuarios ahora autoriza Auth mientras existe el rol canónico y evita mutaciones ante un rechazo; Auth/PG siguen sin una transacción distribuida. No se ha probado recuperación automática de todas las interrupciones posteriores. La comprobación de permisos tiene alcance definido y no es una prueba de penetración completa. Tampoco acredita usabilidad, motivación, interacción de participantes ni resultados USE/UES-SF.

## 13. Integridad y pendientes

[RESUMEN_FINAL.json](RESUMEN_FINAL.json), [INTEGRIDAD.json](INTEGRIDAD.json), [PRIVACIDAD.json](PRIVACIDAD.json) y [MANIFIESTO_SHA256.json](MANIFIESTO_SHA256.json) sustentan cifras, enlaces, privacidad y huellas. Los archivos anteriores no se reescribieron. El código permanece en una rama local sin nueva publicación; el manifiesto identifica el árbol modificado.

Pendientes: autorización y plan de aplicación institucional coordinada (SQL, funciones y clientes), revisión de roles/datos heredados y compatibilidad de clientes antiguos;35 avisos de la raíz; entrega externa Resend/FCM; Android actualizado y dispositivo físico; ampliación de ranking a otras categorías/métricas y recuperación distribuida de borrados. Los providers no se sustituyen por resultados simulados. Los tres documentos de esta etapa son propuesta verificable para revisión académica.

